import Link from "next/link";
import { Countdown } from "@/components/countdown";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const event = await prisma.event.findFirst({
    where: { isCompleted: false },
    include: { fights: true },
    orderBy: { date: "asc" }
  });

  return (
    <div className="space-y-8">
      <section className="ufc-panel bg-gradient-to-r from-black via-zinc-900 to-black p-8">
        <h1 className="font-display text-4xl uppercase text-ufc-red md:text-5xl">UFC Fight Pick League</h1>
        <p className="mt-3 max-w-2xl text-zinc-300">
          Predict main card outcomes for numbered UFC events. Lock your picks before fight night and compete on
          accuracy.
        </p>
        <div className="mt-6">
          <Link href="/predictions" className="ufc-button inline-block">
            Make Predictions
          </Link>
        </div>
      </section>

      {event ? (
        <section className="grid gap-4 md:grid-cols-[2fr_1fr]">
          <div className="ufc-panel p-6">
            <p className="text-xs uppercase text-zinc-400">Upcoming Numbered Event</p>
            <h2 className="mt-2 font-display text-3xl text-ufc-red">{event.name}</h2>
            <p className="mt-2 text-zinc-300">{event.location}</p>
            <p className="mt-4 text-sm uppercase">Main Card Fights: {event.fights.length}</p>
          </div>
          <Countdown targetDate={event.date.toISOString()} />
        </section>
      ) : (
        <section className="ufc-panel p-6">
          <h2 className="font-display text-2xl text-ufc-red">No Upcoming Numbered UFC Event</h2>
          <p className="mt-2 text-zinc-300">The Monday scraper will add an event automatically when one is within 7 days.</p>
        </section>
      )}
    </div>
  );
}