import "dotenv/config";
import { syncUpcomingEvent } from "@/server/services/eventService";

async function main() {
  console.log("Running event scraper...");
  const result = await syncUpcomingEvent();
  console.log("Result:", result);
}

main().catch(console.error);