import { describe, it, expect } from "vitest"
import { detectWeatherAlerts } from "../../src/queues/weather-detection"

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

/**
 * All dates are UTC-based to avoid timezone artifacts.
 * "today" is always passed as UTC midnight (e.g. new Date(Date.UTC(2026, 0, 1))).
 */
function addUTCDays(d: Date, n: number): Date {
  const result = new Date(d)
  result.setUTCDate(result.getUTCDate() + n)
  return result
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function makeTarefa(
  id: string,
  daysFromNow: number,
  climaSensivel: boolean | null,
  etapaClimaSensivel: boolean,
  today: Date
): TestTarefa {
  return {
    id,
    startDate: addUTCDays(today, daysFromNow),
    climaSensivel,
    etapa: { climaSensivel: etapaClimaSensivel },
  }
}

function makeForecastDay(d: Date, precipProbability: number, precipSum: number): ForecastDay {
  return {
    date: toISODate(d),
    precipitation_probability_max: precipProbability,
    precipitation_sum: precipSum,
  }
}

describe("detectWeatherAlerts", () => {
  // Use UTC midnight to avoid local-timezone drift
  const TODAY = new Date(Date.UTC(2026, 0, 1)) // 2026-01-01 UTC

  it("returns weather_preliminary alert for task 3 days out with probability >= 50", () => {
    const tarefas = [makeTarefa("t1", 3, true, false, TODAY)]

    const forecastDays: ForecastDay[] = [
      makeForecastDay(TODAY, 10, 0),
      makeForecastDay(addUTCDays(TODAY, 1), 20, 0),
      makeForecastDay(addUTCDays(TODAY, 2), 15, 0),
      makeForecastDay(addUTCDays(TODAY, 3), 70, 5), // 3 days out
    ]

    const alerts = detectWeatherAlerts(tarefas, forecastDays, TODAY)

    expect(alerts).toHaveLength(1)
    expect(alerts[0].tarefaId).toBe("t1")
    expect(alerts[0].alertType).toBe("weather_preliminary")
    expect(alerts[0].precipitationProbability).toBe(70)
  })

  it("returns weather_confirmed alert for task 1 day out with probability >= 50", () => {
    const tarefas = [makeTarefa("t2", 1, true, false, TODAY)]

    const forecastDays: ForecastDay[] = [
      makeForecastDay(TODAY, 10, 0),
      makeForecastDay(addUTCDays(TODAY, 1), 80, 10), // 1 day out
      makeForecastDay(addUTCDays(TODAY, 2), 20, 0),
      makeForecastDay(addUTCDays(TODAY, 3), 30, 0),
    ]

    const alerts = detectWeatherAlerts(tarefas, forecastDays, TODAY)

    expect(alerts).toHaveLength(1)
    expect(alerts[0].tarefaId).toBe("t2")
    expect(alerts[0].alertType).toBe("weather_confirmed")
    expect(alerts[0].precipitationProbability).toBe(80)
  })

  it("skips tasks with precipitation_probability_max < 50", () => {
    const tarefas = [makeTarefa("t3", 3, true, false, TODAY)]

    const forecastDays: ForecastDay[] = [
      makeForecastDay(TODAY, 10, 0),
      makeForecastDay(addUTCDays(TODAY, 1), 20, 0),
      makeForecastDay(addUTCDays(TODAY, 2), 15, 0),
      makeForecastDay(addUTCDays(TODAY, 3), 49, 2), // below threshold
    ]

    const alerts = detectWeatherAlerts(tarefas, forecastDays, TODAY)
    expect(alerts).toHaveLength(0)
  })

  it("skips tasks where climaSensivel is false and etapa.climaSensivel is false", () => {
    const tarefas = [makeTarefa("t4", 3, false, false, TODAY)]

    const forecastDays: ForecastDay[] = [
      makeForecastDay(TODAY, 10, 0),
      makeForecastDay(addUTCDays(TODAY, 1), 20, 0),
      makeForecastDay(addUTCDays(TODAY, 2), 15, 0),
      makeForecastDay(addUTCDays(TODAY, 3), 90, 15),
    ]

    const alerts = detectWeatherAlerts(tarefas, forecastDays, TODAY)
    expect(alerts).toHaveLength(0)
  })

  it("uses etapa.climaSensivel when tarefa.climaSensivel is null", () => {
    const tarefas = [makeTarefa("t5", 3, null, true, TODAY)] // null own → inherits etapa = true

    const forecastDays: ForecastDay[] = [
      makeForecastDay(TODAY, 10, 0),
      makeForecastDay(addUTCDays(TODAY, 1), 20, 0),
      makeForecastDay(addUTCDays(TODAY, 2), 15, 0),
      makeForecastDay(addUTCDays(TODAY, 3), 60, 3),
    ]

    const alerts = detectWeatherAlerts(tarefas, forecastDays, TODAY)
    expect(alerts).toHaveLength(1)
    expect(alerts[0].tarefaId).toBe("t5")
    expect(alerts[0].alertType).toBe("weather_preliminary")
  })

  it("handles multiple tasks with both alert levels on different days", () => {
    const tarefas = [
      makeTarefa("ta", 1, true, false, TODAY), // 1 day out → confirmed
      makeTarefa("tb", 3, true, false, TODAY), // 3 days out → preliminary
    ]

    const forecastDays: ForecastDay[] = [
      makeForecastDay(TODAY, 10, 0),
      makeForecastDay(addUTCDays(TODAY, 1), 80, 10), // day+1
      makeForecastDay(addUTCDays(TODAY, 2), 20, 0),
      makeForecastDay(addUTCDays(TODAY, 3), 75, 8), // day+3
    ]

    const alerts = detectWeatherAlerts(tarefas, forecastDays, TODAY)
    expect(alerts).toHaveLength(2)

    const taAlert = alerts.find((a) => a.tarefaId === "ta")
    expect(taAlert?.alertType).toBe("weather_confirmed")

    const tbAlert = alerts.find((a) => a.tarefaId === "tb")
    expect(tbAlert?.alertType).toBe("weather_preliminary")
  })

  it("returns empty array when tarefas list is empty", () => {
    const forecastDays: ForecastDay[] = [
      makeForecastDay(addUTCDays(TODAY, 1), 90, 10),
    ]

    const alerts = detectWeatherAlerts([], forecastDays, TODAY)
    expect(alerts).toHaveLength(0)
  })

  it("records alertDate as the tarefa startDate", () => {
    const tarefas = [makeTarefa("t6", 1, true, false, TODAY)]

    const forecastDays: ForecastDay[] = [
      makeForecastDay(TODAY, 10, 0),
      makeForecastDay(addUTCDays(TODAY, 1), 90, 10),
    ]

    const alerts = detectWeatherAlerts(tarefas, forecastDays, TODAY)
    expect(alerts).toHaveLength(1)
    expect(alerts[0].alertDate).toBeDefined()
    // alertDate should be the tarefa's startDate
    expect(alerts[0].alertDate.toISOString().slice(0, 10)).toBe(toISODate(addUTCDays(TODAY, 1)))
  })
})
