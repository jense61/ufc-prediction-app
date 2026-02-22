import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeName } from "@/lib/utils";
import { ensureSeasonResetIfNeeded, getCurrentSeasonYear } from "@/server/services/seasonService";

type LeaderboardRow = {
  username: string;
  totalScore: number;
  correctPicks: number;
  totalValidPicks: number;
  accuracy: number;
};

export async function GET() {
  try {
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

    const rows: LeaderboardRow[] = users.map((user) => {
      const validPredictions = user.predictions.filter(
        (prediction) =>
          prediction.fight.event.date.getFullYear() === currentYear &&
          prediction.fight.event.isCompleted &&
          prediction.fight.winner &&
          !prediction.fight.isInvalidated &&
          prediction.fight.eventId &&
          !prediction.fight.method?.toLowerCase().includes("no contest")
      );

      const correctPicks = validPredictions.filter(
        (prediction) => normalizeName(prediction.predictedWinner) === normalizeName(prediction.fight.winner ?? "")
      ).length;

      const totalValidPicks = validPredictions.length;
      const accuracy = totalValidPicks === 0 ? 0 : Number(((correctPicks / totalValidPicks) * 100).toFixed(2));

      return {
        username: user.username,
        totalScore: user.totalScore,
        correctPicks,
        totalValidPicks,
        accuracy
      };
    });

    rows.sort((a, b) => {
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      if (b.accuracy !== a.accuracy) {
        return b.accuracy - a.accuracy;
      }
      return a.username.localeCompare(b.username);
    });

    return NextResponse.json({ ok: true, leaderboard: rows });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to fetch leaderboard." }, { status: 500 });
  }
}