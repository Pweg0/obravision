/**
 * Integration test: Socket.io obra room isolation.
 *
 * Tests:
 * 1. Client can connect and join an obra room
 * 2. Client in obra:A receives events emitted to obra:A
 * 3. Client in obra:B does NOT receive events emitted to obra:A
 * 4. Client receives event after joining, not before
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest"
import { createServer } from "http"
import { Server as SocketIOServer } from "socket.io"
import { io as ioClient, type Socket as ClientSocket } from "socket.io-client"
import { AddressInfo } from "net"

function waitFor<T>(
  socket: ClientSocket,
  event: string,
  timeout = 2000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for event "${event}"`))
    }, timeout)

    socket.once(event, (data: T) => {
      clearTimeout(timer)
      resolve(data)
    })
  })
}

function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

describe("Socket.io obra room isolation", () => {
  let io: SocketIOServer
  let port: number
  const clients: ClientSocket[] = []

  beforeAll(async () => {
    // Create a minimal HTTP server + Socket.io — same pattern as app.ts
    const httpServer = createServer()

    io = new SocketIOServer(httpServer, {
      cors: { origin: "*", credentials: false },
    })

    // Register the same room management logic as plugins/socketio.ts
    io.on("connection", (socket) => {
      socket.on("join-obra", (obraId: string) => {
        socket.join(`obra:${obraId}`)
      })

      socket.on("leave-obra", (obraId: string) => {
        socket.leave(`obra:${obraId}`)
      })
    })

    // Start on a random available port
    await new Promise<void>((resolve) => {
      httpServer.listen(0, "127.0.0.1", () => {
        const addr = httpServer.address() as AddressInfo
        port = addr.port
        resolve()
      })
    })
  })

  afterAll(async () => {
    // Disconnect all remaining clients
    clients.forEach((c) => c.disconnect())
    await new Promise<void>((resolve) => io.close(() => resolve()))
  })

  afterEach(() => {
    // Disconnect any clients created per-test
    clients.forEach((c) => c.disconnect())
    clients.length = 0
  })

  function createClient(): Promise<ClientSocket> {
    return new Promise((resolve, reject) => {
      const socket = ioClient(`http://127.0.0.1:${port}`, {
        transports: ["websocket"],
        reconnection: false,
      })
      clients.push(socket)

      socket.on("connect", () => resolve(socket))
      socket.on("connect_error", (err) => reject(err))

      setTimeout(() => reject(new Error("Connection timeout")), 3000)
    })
  }

  it("client can connect and join an obra room", async () => {
    const client = await createClient()
    expect(client.connected).toBe(true)

    // Join obra room
    client.emit("join-obra", "obra-test-1")

    // Brief wait for the server to process the join
    await waitMs(100)

    // Verify by emitting to the room — client should receive it
    const eventPromise = waitFor<{ msg: string }>(client, "test-event")
    io.to("obra:obra-test-1").emit("test-event", { msg: "hello obra" })

    const received = await eventPromise
    expect(received).toEqual({ msg: "hello obra" })
  })

  it("events emitted to obra:A are received by clients in obra:A", async () => {
    const client = await createClient()
    client.emit("join-obra", "obra-A")
    await waitMs(100)

    const eventPromise = waitFor<{ pinId: string }>(client, "new-pin")
    io.to("obra:obra-A").emit("new-pin", { pinId: "pin-123" })

    const data = await eventPromise
    expect(data.pinId).toBe("pin-123")
  })

  it("events emitted to obra:A are NOT received by clients in obra:B", async () => {
    const clientA = await createClient()
    const clientB = await createClient()

    clientA.emit("join-obra", "obra-A-isolation")
    clientB.emit("join-obra", "obra-B-isolation")
    await waitMs(100)

    let clientBReceivedEvent = false
    clientB.on("new-pin-isolation", () => {
      clientBReceivedEvent = true
    })

    // Emit only to obra:A
    io.to("obra:obra-A-isolation").emit("new-pin-isolation", { pinId: "pin-isolation" })

    // Wait a bit to ensure clientB doesn't receive the event
    await waitMs(300)

    expect(clientBReceivedEvent).toBe(false)
  })

  it("client does not receive events in a room before joining", async () => {
    const client = await createClient()
    // Do NOT join any room

    let receivedBeforeJoin = false
    client.on("pre-join-event", () => {
      receivedBeforeJoin = true
    })

    // Emit to a room the client hasn't joined
    io.to("obra:not-joined-yet").emit("pre-join-event", { msg: "should not receive" })
    await waitMs(200)

    expect(receivedBeforeJoin).toBe(false)

    // Now join the room
    client.emit("join-obra", "not-joined-yet")
    await waitMs(100)

    // Now the client should receive events in the room
    const eventPromise = waitFor<{ msg: string }>(client, "post-join-event")
    io.to("obra:not-joined-yet").emit("post-join-event", { msg: "should receive" })

    const received = await eventPromise
    expect(received.msg).toBe("should receive")
  })

  it("client leaves obra room on leave-obra event", async () => {
    const client = await createClient()
    client.emit("join-obra", "obra-leave-test")
    await waitMs(100)

    // Receive one event to confirm we're in the room
    const joinConfirm = waitFor<{ msg: string }>(client, "join-confirm")
    io.to("obra:obra-leave-test").emit("join-confirm", { msg: "in room" })
    await joinConfirm

    // Leave the room
    client.emit("leave-obra", "obra-leave-test")
    await waitMs(100)

    // After leaving, should not receive events
    let receivedAfterLeave = false
    client.on("after-leave-event", () => {
      receivedAfterLeave = true
    })

    io.to("obra:obra-leave-test").emit("after-leave-event", { msg: "should not receive" })
    await waitMs(200)

    expect(receivedAfterLeave).toBe(false)
  })
})
