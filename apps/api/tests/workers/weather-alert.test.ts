import { describe, it, expect } from "vitest"
import { detectWeatherAlerts } from "../../src/queues/weather-alert.worker"

// Types for test data
interface TestTarefa {
  id: string
  startDate: Date
  climaSensivel: boolean | null
  etapa: { climaSensivel: boolean }
}

interface ForecastDay {
  date: string // ISO date string "YYYY-MM-DD"
  precipitation_probability_max: number
  precipitation_sum: number
}

describe("detectWeatherAlerts", () => {
  // Helper: build a tarefa with a start date N days from "today" reference
  function makeTarefa(
    id: string,
    daysFromNow: number,
    climaSensivel: boolean | null,
    etapaClimaSensivel: boolean,
    today: Date
  ): TestTarefa {
    const d = new Date(today)
    d.setDate(d.getDate() + daysFromNow)
    d.setHours(0, 0, 0, 0)
    return {
      id,
      startDate: d,
      climaSensivel,
      etapa: { climaSensivel: etapaClimaSensivel },
    }
  }

  function makeForecastDay(date: Date, precipProbability: number, precipSum: number): ForecastDay {
    const iso = date.toISOString().slice(0, 10)
    return { date: iso, precipitation_probability_max: precipProbability, precipitation_sum: precipSum }
  }

  it("returns weather_preliminary alert for task 3 days out with probability >= 50", () => {
    const today = new Date("2026-01-01T00:00:00Z")
    const tarefas = [makeTarefa("t1", 3, true, false, today)]

    const forecastDays: ForecastDay[] = [
      makeForecastDay(new Date("2026-01-01"), 10, 0),
      makeForecastDay(new Date("2026-01-02"), 20, 0),
      makeForecastDay(new Date("2026-01-03"), 70, 5), // 3 days out
    ]

    const alerts = detectWeatherAlerts(tarefas, forecastDays, today)

    expect(alerts).toHaveLength(1)
    expect(alerts[0].tarefaId).toBe("t1")
    expect(alerts[0].alertType).toBe("weather_preliminary")
    expect(alerts[0].precipitationProbability).toBe(70)
  })

  it("returns weather_confirmed alert for task 1 day out with probability >= 50", () => {
    const today = new Date("2026-01-01T00:00:00Z")
    const tarefas = [makeTarefa("t2", 1, true, false, today)]

    const forecastDays: ForecastDay[] = [
      makeForecastDay(new Date("2026-01-01"), 10, 0),
      makeForecastDay(new Date("2026-01-02"), 80, 10), // 1 day out
      makeForecastDay(new Date("2026-01-03"), 20, 0),
    ]

    const alerts = detectWeatherAlerts(tarefas, forecastDays, today)

    expect(alerts).toHaveLength(1)
    expect(alerts[0].tarefaId).toBe("t2")
    expect(alerts[0].alertType).toBe("weather_confirmed")
    expect(alerts[0].precipitationProbability).toBe(80)
  })

  it("skips tasks with precipitation_probability_max < 50", () => {
    const today = new Date("2026-01-01T00:00:00Z")
    const tarefas = [makeTarefa("t3", 3, true, false, today)]

    const forecastDays: ForecastDay[] = [
      makeForecastDay(new Date("2026-01-01"), 10, 0),
      makeForecastDay(new Date("2026-01-02"), 20, 0),
      makeForecastDay(new Date("2026-01-03"), 49, 2), // below threshold
    ]

    const alerts = detectWeatherAlerts(tarefas, forecastDays, today)
    expect(alerts).toHaveLength(0)
  })

  it("skips tasks where climaSensivel is false and etapa.climaSensivel is false", () => {
    const today = new Date("2026-01-01T00:00:00Z")
    const tarefas = [makeTarefa("t4", 3, false, false, today)]

    const forecastDays: ForecastDay[] = [
      makeForecastDay(new Date("2026-01-01"), 10, 0),
      makeForecastDay(new Date("2026-01-02"), 20, 0),
      makeForecastDay(new Date("2026-01-03"), 90, 15),
    ]

    const alerts = detectWeatherAlerts(tarefas, forecastDays, today)
    expect(alerts).toHaveLength(0)
  })

  it("uses etapa.climaSensivel when tarefa.climaSensivel is null", () => {
    const today = new Date("2026-01-01T00:00:00Z")
    const tarefas = [makeTarefa("t5", 3, null, true, today)] // null own, true from etapa

    const forecastDays: ForecastDay[] = [
      makeForecastDay(new Date("2026-01-01"), 10, 0),
      makeForecastDay(new Date("2026-01-02"), 20, 0),
      makeForecastDay(new Date("2026-01-03"), 60, 3),
    ]

    const alerts = detectWeatherAlerts(tarefas, forecastDays, today)
    expect(alerts).toHaveLength(1)
    expect(alerts[0].tarefaId).toBe("t5")
    expect(alerts[0].alertType).toBe("weather_preliminary")
  })

  it("handles multiple tasks and multiple alert days", () => {
    const today = new Date("2026-01-01T00:00:00Z")
    const tarefas = [
      makeTarefa("ta", 1, true, false, today), // 1 day out
      makeTarefa("tb", 3, true, false, today), // 3 days out
    ]

    const forecastDays: ForecastDay[] = [
      makeForecastDay(new Date("2026-01-01"), 10, 0),
      makeForecastDay(new Date("2026-01-02"), 80, 10), // day+1 -> confirmed
      makeForecastDay(new Date("2026-01-03"), 20, 0),
      makeForecastDay(new Date("2026-01-04"), 75, 8), // day+3 -> preliminary
    ]

    const alerts = detectWeatherAlerts(tarefas, forecastDays, today)
    expect(alerts).toHaveLength(2)

    const taAlert = alerts.find((a) => a.tarefaId === "ta")
    expect(taAlert?.alertType).toBe("weather_confirmed")

    const tbAlert = alerts.find((a) => a.tarefaId === "tb")
    expect(tbAlert?.alertType).toBe("weather_preliminary")
  })

  it("returns empty array when tarefas list is empty", () => {
    const today = new Date("2026-01-01T00:00:00Z")
    const forecastDays: ForecastDay[] = [
      makeForecastDay(new Date("2026-01-02"), 90, 10),
    ]

    const alerts = detectWeatherAlerts([], forecastDays, today)
    expect(alerts).toHaveLength(0)
  })

  it("records alertDate as the tarefa startDate", () => {
    const today = new Date("2026-01-01T00:00:00Z")
    const tarefas = [makeTarefa("t6", 1, true, false, today)]

    const forecastDays: ForecastDay[] = [
      makeForecastDay(new Date("2026-01-01"), 10, 0),
      makeForecastDay(new Date("2026-01-02"), 90, 10),
    ]

    const alerts = detectWeatherAlerts(tarefas, forecastDays, today)
    expect(alerts).toHaveLength(1)
    expect(alerts[0].alertDate).toBeDefined()
  })
})
