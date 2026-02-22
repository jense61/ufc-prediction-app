"use client";

import { formatInTimeZone } from "date-fns-tz";
import { useEffect, useMemo, useState } from "react";

type Props = {
  targetDate: string;
};

function formatMs(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

export function Countdown({ targetDate }: Props) {
  const target = useMemo(() => new Date(targetDate), [targetDate]);
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const diff = target.getTime() - now.getTime();

  return (
    <div className="ufc-panel p-4">
      <p className="text-xs uppercase text-zinc-400">Event Time (Europe/Brussels)</p>
      <p className="mt-1 text-lg font-bold text-ufc-red">
        {formatInTimeZone(target, "Europe/Brussels", "EEE d MMM yyyy, HH:mm")}
      </p>
      <p className="mt-2 text-sm uppercase tracking-wide">{diff > 0 ? formatMs(diff) : "Predictions Locked"}</p>
    </div>
  );
}