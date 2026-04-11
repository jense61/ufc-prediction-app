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
      <section className="ufc-panel bg-gradient-to-r from-black via-zinc-900 to-black p-5 sm:p-8">
        <h1 className="font-display text-3xl uppercase text-ufc-red sm:text-4xl md:text-5xl">UFC Fight Prophet</h1>
        <p className="mt-3 max-w-2xl text-zinc-300">
          Predict main card outcomes for numbered UFC events. Lock your picks before fight night and compete on
          accuracy!
        </p>
        <div className="mt-6">
          <Link href="/predictions" className="ufc-button inline-block">
            Make Predictions
          </Link>
        </div>
      </section>

      {event ? (
        <section className="grid gap-4 md:grid-cols-[2fr_1fr]">
          <div className="ufc-panel p-5 sm:p-6">
            <p className="text-xs uppercase text-zinc-400">Upcoming Event</p>
            <h2 className="mt-2 break-words font-display text-2xl text-ufc-red sm:text-3xl">{event.name}</h2>
            <p className="mt-2 text-zinc-300">{event.location}</p>
            <p className="mt-2 text-sm uppercase tracking-wide text-zinc-400">
              {event.date.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric"
              })}
            </p>
            <div className="mt-4">
              <Countdown targetDate={event.date.toISOString()} />
            </div>
          </div>

          <div className="ufc-panel p-5 sm:p-6">
            <p className="text-sm uppercase tracking-wide text-zinc-400">Main Card</p>
            <div className="mt-4 space-y-3 text-sm text-zinc-300">
              {event.fights.map((fight) => (
                <p key={fight.id} className="break-words text-center uppercase">
                  {fight.fighter1Name} vs {fight.fighter2Name}
                </p>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="ufc-panel p-6">
          <h2 className="font-display text-2xl text-ufc-red">No Upcoming Event</h2>
          <p className="mt-2 text-zinc-300">The scraper will add a numbered UFC event automatically when one is within 7 days.</p>
        </section>
      )}
    </div>
  );
}