import { redirect } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeName } from "@/lib/utils";
import { Crown } from "@/components/crown";
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
      const displayName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username;

      return {
        userId: user.id,
        displayName,
        username: user.username,
        correct,
        accuracy
      };
    })
    .sort((a, b) => {
      if (b.correct !== a.correct) {
        return b.correct - a.correct;
      }
      if (b.accuracy !== a.accuracy) {
        return b.accuracy - a.accuracy;
      }
      return a.displayName.localeCompare(b.displayName);
    });

  return (
    <section className="space-y-6">
      <div className="ufc-panel space-y-4 p-4 sm:p-6">
        <h1 className="font-display text-3xl text-ufc-red md:text-4xl">Leaderboard</h1>
        <p className="text-sm uppercase tracking-wide text-zinc-400">Season {currentYear}</p>

        <div className="space-y-3 md:hidden">
          {rows.map((row, index) => (
            <div key={row.userId} className="border border-zinc-800 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-400">Rank #{index + 1}</p>
                  <Link href={`/leaderboard/${row.userId}` as Route} className="mt-1 block text-lg font-semibold text-zinc-100 hover:text-ufc-red">
                    {row.displayName}
                    {index === 0 ? (
                      <Crown
                        className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_6px_rgba(255,215,0,0.7)]"
                        aria-label="Top rank"
                      />
                    ) : null}
                  </Link>
                  <p className="mt-2 text-sm text-zinc-300">Correct picks: {row.correct}</p>
                </div>
                <div className="flex items-end justify-between gap-3 sm:flex-col sm:items-end">
                  <p className="text-sm text-zinc-300">{row.accuracy.toFixed(2)}%</p>
                  <Link
                    href={`/leaderboard/${row.userId}` as Route}
                    className="inline-flex items-center justify-center rounded-none border border-ufc-red px-2 py-1 text-[10px] uppercase tracking-wide text-zinc-100 hover:bg-ufc-red/20 hover:text-ufc-red"
                  >
                    View History →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full">
            <thead className="bg-black/70 text-left text-xs uppercase tracking-wide text-zinc-400">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Correct Picks</th>
                <th className="px-4 py-3">Accuracy %</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.userId} className="border-t border-zinc-800">
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3 font-semibold">
                    <div className="space-y-2">
                      <Link href={`/leaderboard/${row.userId}` as Route} className="hover:text-ufc-red">
                        {row.displayName}
                        {index === 0 ? (
                          <Crown
                            className="ml-2 text-red-600 w-5 h-5 drop-shadow-[0_0_4px_rgba(255,0,0,0.6)]"
                            aria-label="Top rank"
                          />
                        ) : null}
                      </Link>
                      <Link
                        href={`/leaderboard/${row.userId}` as Route}
                        className="inline-flex items-center justify-center rounded-none border border-ufc-red px-2 py-1 text-[10px] uppercase tracking-wide text-zinc-100 hover:bg-ufc-red/20 hover:text-ufc-red"
                      >
                        View History →
                      </Link>
                    </div>
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