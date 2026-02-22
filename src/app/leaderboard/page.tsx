import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeName } from "@/lib/utils";
import { ensureSeasonResetIfNeeded, getCurrentSeasonYear } from "@/server/services/seasonService";

export default async function LeaderboardPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  await ensureSeasonResetIfNeeded();
  const currentYear = Number(getCurrentSeasonYear());

  const users = await prisma.user.findMany({
    include: {
      predictions: {
        include: {
          fight: {
            include: {
              event: true
            }
          }
        }
      }
    }
  });

  const rows = users
    .map((user) => {
      const validPredictions = user.predictions.filter(
        (prediction) =>
          prediction.fight.event.isCompleted &&
          prediction.fight.event.date.getFullYear() === currentYear &&
          prediction.fight.winner &&
          !prediction.fight.isInvalidated
      );

      const correct = validPredictions.filter(
        (prediction) => normalizeName(prediction.predictedWinner) === normalizeName(prediction.fight.winner ?? "")
      ).length;

      const accuracy = validPredictions.length > 0 ? (correct / validPredictions.length) * 100 : 0;

      return {
        username: user.username,
        score: user.totalScore,
        correct,
        accuracy
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.accuracy - a.accuracy;
    });

  return (
    <section className="space-y-6">
      <h1 className="font-display text-4xl text-ufc-red">Leaderboard</h1>
      <p className="text-sm uppercase tracking-wide text-zinc-400">Season {currentYear}</p>
      <div className="overflow-x-auto ufc-panel">
        <table className="min-w-full">
          <thead className="bg-black/70 text-left text-xs uppercase tracking-wide text-zinc-400">
            <tr>
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Correct Picks</th>
              <th className="px-4 py-3">Accuracy %</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.username} className="border-t border-zinc-800">
                <td className="px-4 py-3">{index + 1}</td>
                <td className="px-4 py-3 font-semibold">{row.username}</td>
                <td className="px-4 py-3">{row.correct}</td>
                <td className="px-4 py-3">{row.accuracy.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}