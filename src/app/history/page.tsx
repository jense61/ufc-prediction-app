import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeName } from "@/lib/utils";

export default async function HistoryPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const events = await prisma.event.findMany({
    where: {
      fights: {
        some: {
          predictions: {
            some: {
              userId: session.user.id
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
              userId: session.user.id
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
        <h1 className="font-display text-3xl text-ufc-red">Prediction History</h1>
        <p className="mt-2 text-zinc-300">You have not submitted any predictions yet.</p>
        <Link href="/predictions" className="mt-4 inline-block text-sm uppercase tracking-wide text-ufc-red">
          Go to Predictions
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <h1 className="font-display text-4xl text-ufc-red">Prediction History</h1>
      <div className="space-y-4">
        {events.map((event) => {
          const picksCount = event.fights.reduce((total, fight) => total + fight.predictions.length, 0);
          const completedFights = event.fights.filter((fight) => fight.winner && !fight.isInvalidated);
          const correctPicks = completedFights.filter((fight) => {
            const pick = fight.predictions[0]?.predictedWinner;
            return pick && normalizeName(pick) === normalizeName(fight.winner ?? "");
          }).length;

          return (
            <Link key={event.id} href={`/history/${event.id}`} className="block ufc-panel p-5 transition hover:border-ufc-red">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl text-ufc-red">{event.name}</h2>
                  <p className="mt-1 text-zinc-300">{event.location}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="text-xs uppercase tracking-wide text-zinc-400">{event.isCompleted ? "Completed" : "Upcoming"}</p>
                  <span className="border border-zinc-700 px-2 py-1 text-xs uppercase tracking-wide text-zinc-200">
                    {event.isCompleted ? `${correctPicks}/${completedFights.length} Correct` : "Upcoming"}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-sm text-zinc-400">Your picks: {picksCount}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
