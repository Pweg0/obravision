// ---- Types ----

export interface ForecastDay {
  date: string // "YYYY-MM-DD"
  precipitation_probability_max: number
  precipitation_sum: number
}

export interface TarefaForAlert {
  id: string
  startDate: Date
  climaSensivel: boolean | null
  etapa: { climaSensivel: boolean }
}

export interface WeatherAlert {
  tarefaId: string
  alertType: "weather_preliminary" | "weather_confirmed"
  precipitationProbability: number
  alertDate: Date
}

/**
 * Returns a "YYYY-MM-DD" string from a Date, treating the date in UTC.
 * This avoids local-timezone artifacts that trip up startOfDay comparisons.
 */
function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/**
 * Adds N calendar days to a date, returning a new Date at UTC midnight.
 */
function addUTCDays(d: Date, n: number): Date {
  const result = new Date(d)
  result.setUTCDate(result.getUTCDate() + n)
  return result
}

/**
 * Pure function: given a list of tarefas and Open-Meteo forecast days, returns weather alerts.
 *
 * Alert rules:
 *   - task startDate is 3 calendar days from today AND precipitation_probability_max >= 50 → "weather_preliminary"
 *   - task startDate is 1 calendar day from today AND precipitation_probability_max >= 50 → "weather_confirmed"
 *
 * A tarefa is climate-sensitive if:
 *   - tarefa.climaSensivel === true (explicit override)
 *   - tarefa.climaSensivel === null AND etapa.climaSensivel === true (inherit)
 *
 * @param tarefas - list of tarefas to evaluate
 * @param forecastDays - Open-Meteo daily forecast entries
 * @param today - reference date (injected for testability; UTC midnight of today)
 */
export function detectWeatherAlerts(
  tarefas: TarefaForAlert[],
  forecastDays: ForecastDay[],
  today: Date = new Date()
): WeatherAlert[] {
  const alerts: WeatherAlert[] = []

  // Build fast lookup: "YYYY-MM-DD" -> precipitationProbability
  const precipByDate = new Map<string, number>()
  for (const day of forecastDays) {
    precipByDate.set(day.date, day.precipitation_probability_max)
  }

  // Compute target date strings (1 day out, 3 days out)
  const day1Key = toISODate(addUTCDays(today, 1))
  const day3Key = toISODate(addUTCDays(today, 3))

  for (const tarefa of tarefas) {
    // Determine climate sensitivity
    const isClimateSensitive =
      tarefa.climaSensivel === true ||
      (tarefa.climaSensivel === null && tarefa.etapa.climaSensivel === true)

    if (!isClimateSensitive) continue

    const startDateKey = toISODate(new Date(tarefa.startDate))

    let alertType: WeatherAlert["alertType"] | null = null
    if (startDateKey === day1Key) {
      alertType = "weather_confirmed"
    } else if (startDateKey === day3Key) {
      alertType = "weather_preliminary"
    }

    if (!alertType) continue

    const probability = precipByDate.get(startDateKey)
    if (probability === undefined || probability < 50) continue

    alerts.push({
      tarefaId: tarefa.id,
      alertType,
      precipitationProbability: probability,
      alertDate: new Date(tarefa.startDate),
    })
  }

  return alerts
}
