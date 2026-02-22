import { prisma } from "@/lib/prisma";
import { UfcScraper } from "@/server/scrapers/ufcScraper";

const scraper = new UfcScraper();

export async function syncUpcomingEvent() {
  const snapshot = await scraper.getUpcomingNumberedEventWithin7Days();
  if (!snapshot) {
    return { ok: true, message: "No numbered UFC event in the next 7 days." };
  }

  const existingEvent = await prisma.event.findUnique({
    where: { name: snapshot.name },
    include: {
      fights: {
        include: {
          predictions: true
        }
      }
    }
  });

  if (existingEvent?.isCompleted) {
    return { ok: true, message: "Event already completed. Skipping." };
  }

  const hasPredictions = (existingEvent?.fights ?? []).some((fight) => fight.predictions.length > 0);

  if (hasPredictions) {
    return { ok: true, message: "Event already has predictions. Snapshot locked." };
  }

  const event = await prisma.event.upsert({
    where: { name: snapshot.name },
    update: {
      date: snapshot.date,
      location: snapshot.location,
      isCompleted: false
    },
    create: {
      name: snapshot.name,
      date: snapshot.date,
      location: snapshot.location,
      isCompleted: false
    }
  });

  await prisma.$transaction(async (tx) => {
    await tx.prediction.deleteMany({
      where: {
        fight: {
          eventId: event.id
        }
      }
    });

    await tx.fight.deleteMany({ where: { eventId: event.id } });

    for (const fight of snapshot.fights) {
      await tx.fight.create({
        data: {
          eventId: event.id,
          division: fight.division,
          isTitleFight: fight.isTitleFight,
          fighter1Name: fight.fighter1.name,
          fighter1Record: fight.fighter1.record,
          fighter1Age: fight.fighter1.age,
          fighter1Height: fight.fighter1.height,
          fighter1Reach: fight.fighter1.reach,
          fighter2Name: fight.fighter2.name,
          fighter2Record: fight.fighter2.record,
          fighter2Age: fight.fighter2.age,
          fighter2Height: fight.fighter2.height,
          fighter2Reach: fight.fighter2.reach
        }
      });
    }
  });

  return { ok: true, message: `Synced ${snapshot.name} with ${snapshot.fights.length} fights.` };
}