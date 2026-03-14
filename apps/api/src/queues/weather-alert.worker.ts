import { Worker } from "bullmq"
import { prisma } from "@obravision/db"
import { connection } from "./pdf-conversion.queue"
import { type WeatherAlertJobData } from "./weather-alert.queue"
import { detectWeatherAlerts, type ForecastDay } from "./weather-detection"
import type { Server as SocketIOServer } from "socket.io"

// Re-export for external consumers
export { detectWeatherAlerts } from "./weather-detection"
export type { ForecastDay, TarefaForAlert, WeatherAlert } from "./weather-detection"

// ---- Open-Meteo API response shape (minimal) ----

interface OpenMeteoResponse {
  daily: {
    time: string[]
    precipitation_probability_max: number[]
    precipitation_sum: number[]
  }
}

// ---- Socket.io injection ----

let ioInstance: SocketIOServer | null = null

export function setWeatherAlertSocketIo(io: SocketIOServer): void {
  ioInstance = io
}

// ---- Open-Meteo fetch helper ----

async function fetchOpenMeteo(lat: number, lon: number): Promise<ForecastDay[]> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&daily=precipitation_probability_max,precipitation_sum` +
    `&forecast_days=4` +
    `&timezone=America/Sao_Paulo`

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Open-Meteo fetch failed: ${res.status} ${res.statusText}`)
  }

  const json = (await res.json()) as OpenMeteoResponse
  const { time, precipitation_probability_max, precipitation_sum } = json.daily

  return time.map((date, i) => ({
    date,
    precipitation_probability_max: precipitation_probability_max[i] ?? 0,
    precipitation_sum: precipitation_sum[i] ?? 0,
  }))
}

// ---- BullMQ Worker ----

export const weatherAlertWorker = new Worker<WeatherAlertJobData>(
  "weather-alert",
  async (job) => {
    job.log("Starting daily weather alert check")

    // Use UTC midnight to avoid local-timezone artifacts
    const nowUtc = new Date()
    const today = new Date(Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth(), nowUtc.getUTCDate()))
    const day1 = new Date(today); day1.setUTCDate(day1.getUTCDate() + 1)
    const day3 = new Date(today); day3.setUTCDate(day3.getUTCDate() + 3)
    const targetDates = [day1, day3]

    // 1. Find all active obras with lat/lon populated
    const obras = await prisma.obra.findMany({
      where: {
        archived: false,
        lat: { not: null },
        lon: { not: null },
      },
      include: {
        members: { select: { userId: true, role: true } },
      },
    })

    job.log(`Found ${obras.length} obra(s) with coordinates`)

    for (const obra of obras) {
      try {
        // 2. Query tarefas starting in next 1–3 days
        const tarefas = await prisma.tarefa.findMany({
          where: {
            obraId: obra.id,
            startDate: {
              gte: targetDates[0], // 1 day out
              lte: targetDates[1], // 3 days out
            },
            status: { notIn: ["CONCLUIDA"] },
          },
          include: {
            etapa: { select: { climaSensivel: true } },
          },
        })

        // 3. Skip if no tarefas in the window
        if (tarefas.length === 0) {
          job.log(`Obra ${obra.id}: no tarefas in date range — skipping API call`)
          continue
        }

        // 4. Fetch Open-Meteo forecast for this obra's location
        const forecastDays = await fetchOpenMeteo(obra.lat!, obra.lon!)
        job.log(`Obra ${obra.id}: fetched ${forecastDays.length} forecast days`)

        // 5. Detect alerts via pure function
        const alerts = detectWeatherAlerts(tarefas, forecastDays, today)
        job.log(`Obra ${obra.id}: ${alerts.length} alert(s) detected`)

        if (alerts.length === 0) continue

        // 6. Recipients: ADMIN + ENGENHEIRO members only (not CLIENTE)
        const recipientIds = obra.members
          .filter((m) => m.role === "ADMIN" || m.role === "ENGENHEIRO")
          .map((m) => m.userId)

        if (recipientIds.length === 0) continue

        // 7. Create Notification records (one per alert per recipient)
        for (const alert of alerts) {
          const notificationData = recipientIds.map((userId) => ({
            userId,
            tenantId: obra.tenantId,
            type: alert.alertType,
            payload: {
              obraId: obra.id,
              obraName: obra.nome,
              tarefaId: alert.tarefaId,
              alertDate: alert.alertDate.toISOString(),
              precipitationProbability: alert.precipitationProbability,
            },
          }))

          await prisma.notification.createMany({ data: notificationData })
        }

        // 8. Emit socket event to obra room (non-fatal — same pattern as Phase 2)
        if (ioInstance) {
          try {
            ioInstance.to(`obra:${obra.id}`).emit("weather-alert", {
              obraId: obra.id,
              alertCount: alerts.length,
            })
          } catch (socketErr) {
            job.log(`Socket emit error for obra ${obra.id}: ${socketErr}`)
          }
        }
      } catch (obraErr) {
        // Log per-obra error and continue to next obra
        job.log(`Error processing obra ${obra.id}: ${obraErr}`)
        console.error(`[weather-alert] Error processing obra ${obra.id}:`, obraErr)
      }
    }

    job.log("Daily weather alert check complete")
  },
  { connection, concurrency: 1 }
)

weatherAlertWorker.on("completed", (job) => {
  console.log(`[weather-alert] Job ${job.id} completed`)
})

weatherAlertWorker.on("failed", (job, err) => {
  console.error(`[weather-alert] Job ${job?.id} failed:`, err)
})
