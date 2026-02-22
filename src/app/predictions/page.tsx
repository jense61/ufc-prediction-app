import { redirect } from "next/navigation";
import { PredictionForm } from "@/components/prediction-form";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nowInBrussels } from "@/lib/time";

export default async function PredictionsPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const event = await prisma.event.findFirst({
    where: { isCompleted: false },
    include: {
      fights: true
    },
    orderBy: { date: "asc" }
  });

  if (!event) {
    return (
      <section className="ufc-panel p-6">
        <h1 className="font-display text-3xl text-ufc-red">Predictions</h1>
        <p className="mt-2 text-zinc-300">No upcoming numbered UFC event is available yet.</p>
      </section>
    );
  }

  const existingPredictions = await prisma.prediction.findMany({
    where: {
      userId: session.user.id,
      fight: {
        eventId: event.id
      }
    }
  });

  const initialPicks = Object.fromEntries(
    existingPredictions.map((prediction) => [prediction.fightId, prediction.predictedWinner])
  );

  const isLocked = nowInBrussels() >= event.date;

  return (
    <section className="space-y-6">
      <div className="ufc-panel p-6">
        <h1 className="font-display text-4xl text-ufc-red">{event.name}</h1>
        <p className="mt-2 text-zinc-300">{event.location}</p>
      </div>
      <PredictionForm
        eventId={event.id}
        fights={event.fights}
        isLocked={isLocked}
        hasSubmitted={existingPredictions.length > 0}
        initialPicks={initialPicks}
      />
    </section>
  );
}