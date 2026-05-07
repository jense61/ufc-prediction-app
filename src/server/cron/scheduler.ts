import cron from "node-cron";
import { syncUpcomingEvent } from "@/server/services/eventService";
import { applyLatestEventResults } from "@/server/services/scoringService";
import { ensureSeasonResetIfNeeded } from "@/server/services/seasonService";

let cronStarted = false;

export function startSchedulers() {
  if (cronStarted) {
    return;
  }

  cron.schedule(
    "0 9 * * 1",
    async () => {
      try {
        await ensureSeasonResetIfNeeded();
        await syncUpcomingEvent();
      } catch (error) {
        console.error("Monday UFC sync failed", error);
      }
    },
    { timezone: "Europe/Brussels" }
  );

  cron.schedule(
    "0 11 * * 0",
    async () => {
      try {
        await ensureSeasonResetIfNeeded();
        await applyLatestEventResults();
      } catch (error) {
        console.error("Sunday UFC scoring failed", error);
      }
    },
    { timezone: "Europe/Brussels" }
  );

  cron.schedule(
    "5 0 1 1 *",
    async () => {
      try {
        await ensureSeasonResetIfNeeded();
      } catch (error) {
        console.error("Yearly season reset failed", error);
      }
    },
    { timezone: "Europe/Brussels" }
  );

  // Daily database keepalive to prevent database pausing
  cron.schedule(
    "0 12 * * *",
    async () => {
      try {
        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/cron/keepalive`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.CRON_SECRET}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.error("Database keepalive failed:", response.status);
        } else {
          console.log("Database keepalive successful");
        }
      } catch (error) {
        console.error("Database keepalive error:", error);
      }
    },
    { timezone: "Europe/Brussels" }
  );

  cronStarted = true;
}