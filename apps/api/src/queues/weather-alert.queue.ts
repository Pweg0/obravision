import { Queue } from "bullmq"
import { connection } from "./pdf-conversion.queue"

// Weather alert job data — worker queries DB directly, no per-job data needed
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface WeatherAlertJobData {}

export const weatherAlertQueue = new Queue<WeatherAlertJobData>("weather-alert", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
})

/**
 * Registers the daily weather-alert BullMQ cron scheduler.
 * Runs at 07:00 BRT (10:00 UTC) every day.
 * Uses upsertJobScheduler so re-calling on restart is idempotent.
 */
export async function registerWeatherAlertScheduler(): Promise<void> {
  await weatherAlertQueue.upsertJobScheduler(
    "daily-weather-check",
    { pattern: "0 7 * * *", tz: "America/Sao_Paulo" },
    { name: "weather-check", data: {} }
  )
}
