import { addDays, isAfter, isBefore, subDays } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export const BRUSSELS_TZ = "Europe/Brussels";

export const nowInBrussels = () => toZonedTime(new Date(), BRUSSELS_TZ);

export const isWithinNextDaysBrussels = (date: Date, days: number) => {
  const now = nowInBrussels();
  const target = toZonedTime(date, BRUSSELS_TZ);
  const max = addDays(now, days);

  return isAfter(target, now) && isBefore(target, max);
};

export const getPredictionEditDeadline = (eventDate: Date) => subDays(eventDate, 1);

export const isPredictionLocked = (eventDate: Date) => nowInBrussels() >= getPredictionEditDeadline(eventDate);