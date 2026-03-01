import { redirect } from "next/navigation";
import Link from "next/link";
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
        userId: user.id,
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
      <h1 className="font-display text-3xl text-ufc-red md:text-4xl">Leaderboard</h1>
      <div className="ufc-panel space-y-4 p-4 sm:p-6">
        <p className="text-sm uppercase tracking-wide text-zinc-400">Season {currentYear}</p>

        <div className="space-y-3 md:hidden">
          {rows.map((row, index) => (
            <div key={row.userId} className="border border-zinc-800 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-400">Rank #{index + 1}</p>
                  <Link href={`/leaderboard/${row.userId}`} className="mt-1 block text-lg font-semibold text-zinc-100 hover:text-ufc-red">
                    {row.username}
                  </Link>
                </div>
                <p className="text-sm text-zinc-300">{row.accuracy.toFixed(2)}%</p>
              </div>
              <p className="mt-2 text-sm text-zinc-300">Correct picks: {row.correct}</p>
            </div>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
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
                <tr key={row.userId} className="border-t border-zinc-800">
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3 font-semibold">
                    <Link href={`/leaderboard/${row.userId}`} className="hover:text-ufc-red">
                      {row.username}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{row.correct}</td>
                  <td className="px-4 py-3">{row.accuracy.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}