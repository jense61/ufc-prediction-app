import "dotenv/config";
import { startSchedulers } from "@/server/cron/scheduler";

startSchedulers();

console.log("UFC cron scheduler running in Europe/Brussels timezone.");