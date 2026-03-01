import type { Route } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeName } from "@/lib/utils";

type Props = {
  params: Promise<{ userId: string }>;
};

export default async function LeaderboardUserHistoryPage({ params }: Props) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { userId } = await params;

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true }
  });

  if (!targetUser) {
    notFound();
  }

  const events = await prisma.event.findMany({
    where: {
      fights: {
        some: {
          predictions: {
            some: {
              userId: targetUser.id
            }
          }
        }
      }
    },
    include: {
      fights: {
        include: {
          predictions: {
            where: {
              userId: targetUser.id
            }
          }
        }
      }
    },
    orderBy: {
      date: "desc"
    }
  });

  if (events.length === 0) {
    return (
      <section className="ufc-panel p-6">
        <Link href="/leaderboard" className="text-sm uppercase tracking-wide text-zinc-400 hover:text-ufc-red">
          ← Back to Leaderboard
        </Link>
        <h1 className="mt-4 font-display text-3xl text-ufc-red">Prediction History</h1>
        <p className="mt-2 text-zinc-300">Player: {targetUser.username}</p>
        <p className="mt-2 text-zinc-300">This player has not submitted any predictions yet.</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <Link href="/leaderboard" className="text-sm uppercase tracking-wide text-zinc-400 hover:text-ufc-red">
          ← Back to Leaderboard
        </Link>
        <h1 className="font-display text-3xl text-ufc-red md:text-4xl">Prediction History</h1>
        <p className="text-sm uppercase tracking-wide text-zinc-300">Player: {targetUser.username}</p>
      </div>

      <div className="space-y-4">
        {events.map((event) => {
          const picksCount = event.fights.reduce((total, fight) => total + fight.predictions.length, 0);
          const completedFights = event.fights.filter((fight) => fight.winner && !fight.isInvalidated);
          const invalidatedFights = event.fights.filter((fight) => fight.isInvalidated).length;
          const correctPicks = completedFights.filter((fight) => {
            const pick = fight.predictions[0]?.predictedWinner;
            return pick && normalizeName(pick) === normalizeName(fight.winner ?? "");
          }).length;
          const eventScore = correctPicks;
          const accuracy = completedFights.length > 0 ? (correctPicks / completedFights.length) * 100 : 0;

          return (
            <Link
              key={event.id}
              href={`/leaderboard/${targetUser.id}/${event.id}` as Route}
              className="block ufc-panel p-5 transition hover:border-ufc-red"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="break-words font-display text-2xl text-ufc-red">{event.name}</h2>
                  <p className="mt-1 text-zinc-300">{event.location}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-zinc-400">
                    {event.date.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric"
                    })}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:items-end">
                  <p className="text-xs uppercase tracking-wide text-zinc-400">{event.isCompleted ? "Completed" : "Upcoming"}</p>
                  <span className="border border-zinc-700 px-2 py-1 text-xs uppercase tracking-wide text-zinc-200">
                    {event.isCompleted ? `${correctPicks}/${completedFights.length} Correct` : "Upcoming"}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid gap-2 text-xs uppercase tracking-wide text-zinc-300 sm:grid-cols-4">
                <p className="border border-zinc-800 px-2 py-2">Event score: {eventScore}</p>
                <p className="border border-zinc-800 px-2 py-2">Picks made: {picksCount}</p>
                <p className="border border-zinc-800 px-2 py-2">Accuracy: {accuracy.toFixed(1)}%</p>
                <p className="border border-zinc-800 px-2 py-2">Invalid fights: {invalidatedFights}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
