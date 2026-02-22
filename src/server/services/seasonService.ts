import { nowInBrussels } from "@/lib/time";
import { prisma } from "@/lib/prisma";

const SEASON_STATE_KEY = "leaderboard-season-year";

export const getCurrentSeasonYear = () => String(nowInBrussels().getFullYear());

export async function ensureSeasonResetIfNeeded() {
  const currentSeasonYear = getCurrentSeasonYear();

  const state = await prisma.appState.findUnique({
    where: { key: SEASON_STATE_KEY }
  });

  if (!state) {
    await prisma.appState.create({
      data: {
        key: SEASON_STATE_KEY,
        value: currentSeasonYear
      }
    });

    return { ok: true, resetApplied: false, seasonYear: currentSeasonYear };
  }

  if (state.value === currentSeasonYear) {
    return { ok: true, resetApplied: false, seasonYear: currentSeasonYear };
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.updateMany({
      data: {
        totalScore: 0
      }
    });

    await tx.appState.update({
      where: { key: SEASON_STATE_KEY },
      data: { value: currentSeasonYear }
    });
  });

  return { ok: true, resetApplied: true, seasonYear: currentSeasonYear };
}

export async function forceSeasonReset() {
  const currentSeasonYear = getCurrentSeasonYear();

  await prisma.$transaction(async (tx) => {
    await tx.user.updateMany({
      data: {
        totalScore: 0
      }
    });

    await tx.appState.upsert({
      where: { key: SEASON_STATE_KEY },
      create: {
        key: SEASON_STATE_KEY,
        value: currentSeasonYear
      },
      update: {
        value: currentSeasonYear
      }
    });
  });

  return { ok: true, resetApplied: true, seasonYear: currentSeasonYear };
}