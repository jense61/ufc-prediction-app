import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeName } from "@/lib/utils";

type Props = {
  params: Promise<{ eventId: string }>;
};

export default async function EventHistoryDetailPage({ params }: Props) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { eventId } = await params;

  const event = await prisma.event.findUnique({
    where: {
      id: eventId
    },
    include: {
      fights: {
        include: {
          predictions: {
            where: {
              userId: session.user.id
            }
          }
        },
        orderBy: {
          createdAt: "asc"
        }
      }
    }
  });

  if (!event) {
    notFound();
  }

  const hasAnyPrediction = event.fights.some((fight) => fight.predictions.length > 0);
  if (!hasAnyPrediction) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <Link href="/history" className="text-sm uppercase tracking-wide text-zinc-400 hover:text-ufc-red">
        ← Back to History
      </Link>

      <div className="ufc-panel p-6">
        <h1 className="font-display text-4xl text-ufc-red">{event.name}</h1>
        <p className="mt-2 text-zinc-300">{event.location}</p>
        <p className="mt-2 text-xs uppercase tracking-wide text-zinc-400">{event.isCompleted ? "Completed" : "Upcoming"}</p>
      </div>

      <div className="space-y-4">
        {event.fights.map((fight) => {
          const pick = fight.predictions[0]?.predictedWinner;
          const winner = fight.winner;
          const isCorrect = pick && winner && normalizeName(pick) === normalizeName(winner);

          return (
            <div key={fight.id} className="ufc-panel p-5">
              <p className="text-sm uppercase tracking-wide text-zinc-400">{fight.division}</p>
              <p className="mt-1 text-lg font-semibold">
                {fight.fighter1Name} vs {fight.fighter2Name}
              </p>

              <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                <p>
                  <span className="text-zinc-400">Your pick: </span>
                  <span className="text-zinc-100">{pick ?? "No pick"}</span>
                </p>

                <p>
                  <span className="text-zinc-400">Winner: </span>
                  <span className="text-zinc-100">{event.isCompleted ? winner ?? "No winner" : "Pending"}</span>
                </p>

                <p>
                  <span className="text-zinc-400">Result: </span>
                  <span className={event.isCompleted ? (fight.isInvalidated ? "text-zinc-300" : isCorrect ? "text-emerald-400" : "text-ufc-red") : "text-zinc-300"}>
                    {!event.isCompleted
                      ? "Pending"
                      : fight.isInvalidated
                        ? "Invalidated"
                        : isCorrect
                          ? "Correct"
                          : "Incorrect"}
                  </span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
