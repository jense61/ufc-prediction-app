import { prisma } from "@/lib/prisma";
import { normalizeName } from "@/lib/utils";
import { UfcScraper } from "@/server/scrapers/ufcScraper";
import { ensureSeasonResetIfNeeded } from "@/server/services/seasonService";

const scraper = new UfcScraper();

const sameFighterPair = (a1: string, a2: string, b1: string, b2: string) => {
  const pairA = [normalizeName(a1), normalizeName(a2)].sort();
  const pairB = [normalizeName(b1), normalizeName(b2)].sort();
  return pairA[0] === pairB[0] && pairA[1] === pairB[1];
};

export async function applyLatestEventResults() {
  await ensureSeasonResetIfNeeded();

  const results = await scraper.getLatestNumberedEventResults();
  if (!results) {
    return { ok: true, message: "No recent numbered UFC event results found." };
  }

  const event = await prisma.event.findUnique({
    where: { name: results.eventName },
    include: {
      fights: {
        include: {
          predictions: true
        }
      }
    }
  });

  if (!event) {
    return { ok: true, message: "No matching event found in database. Run Monday sync first." };
  }

  if (event.isCompleted) {
    return { ok: true, message: "Event already completed and scored." };
  }

  const scoreMap = new Map<string, number>();

  await prisma.$transaction(async (tx) => {
    for (const fight of event.fights) {
      const matchedResult = results.fights.find((result) =>
        sameFighterPair(fight.fighter1Name, fight.fighter2Name, result.fighter1Name, result.fighter2Name)
      );

      if (!matchedResult) {
        await tx.fight.update({
          where: { id: fight.id },
          data: {
            isInvalidated: true,
            winner: null,
            method: "Invalidated: fighter replacement detected"
          }
        });
        continue;
      }

      const shouldInvalidate =
        matchedResult.isDraw || matchedResult.isNoContest || matchedResult.isOverturned;

      if (shouldInvalidate || !matchedResult.winner) {
        await tx.fight.update({
          where: { id: fight.id },
          data: {
            isInvalidated: true,
            winner: null,
            method: matchedResult.method
          }
        });
        continue;
      }

      await tx.fight.update({
        where: { id: fight.id },
        data: {
          winner: matchedResult.winner,
          method: matchedResult.method,
          isInvalidated: false
        }
      });

      for (const prediction of fight.predictions) {
        if (normalizeName(prediction.predictedWinner) === normalizeName(matchedResult.winner)) {
          const current = scoreMap.get(prediction.userId) ?? 0;
          scoreMap.set(prediction.userId, current + 1);
        }
      }
    }

    for (const [userId, points] of scoreMap.entries()) {
      await tx.user.update({
        where: { id: userId },
        data: {
          totalScore: {
            increment: points
          }
        }
      });
    }

    await tx.event.update({
      where: { id: event.id },
      data: {
        isCompleted: true
      }
    });
  });

  return { ok: true, message: `Scored ${event.name}.` };
}