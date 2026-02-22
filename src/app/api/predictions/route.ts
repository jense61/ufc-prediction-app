import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nowInBrussels } from "@/lib/time";

const submitSchema = z.object({
  eventId: z.string().min(1),
  picks: z.array(
    z.object({
      fightId: z.string().min(1),
      predictedWinner: z.string().min(1)
    })
  )
});

export async function GET() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const predictions = await prisma.prediction.findMany({
    where: { userId: session.user.id },
    include: {
      fight: {
        include: {
          event: true
        }
      }
    }
  });

  return NextResponse.json({ ok: true, predictions });
}

export async function POST(req: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = submitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid payload." }, { status: 400 });
    }

    const { eventId, picks } = parsed.data;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        fights: true
      }
    });

    if (!event) {
      return NextResponse.json({ ok: false, error: "Event not found." }, { status: 404 });
    }

    if (event.isCompleted || nowInBrussels() >= event.date) {
      return NextResponse.json(
        { ok: false, error: "Predictions are locked for this event." },
        { status: 400 }
      );
    }

    const eventFightIds = new Set(event.fights.map((fight) => fight.id));

    if (picks.length !== event.fights.length) {
      return NextResponse.json(
        { ok: false, error: "You must submit one prediction for each main card fight." },
        { status: 400 }
      );
    }

    for (const pick of picks) {
      if (!eventFightIds.has(pick.fightId)) {
        return NextResponse.json(
          { ok: false, error: "One or more fights do not belong to this event." },
          { status: 400 }
        );
      }
    }

    const alreadySubmitted = await prisma.prediction.findFirst({
      where: {
        userId: session.user.id,
        fight: {
          eventId
        }
      }
    });

    if (alreadySubmitted) {
      return NextResponse.json(
        { ok: false, error: "Predictions already submitted. Edits are disabled." },
        { status: 409 }
      );
    }

    await prisma.$transaction(async (tx) => {
      for (const pick of picks) {
        await tx.prediction.create({
          data: {
            userId: session.user.id,
            fightId: pick.fightId,
            predictedWinner: pick.predictedWinner
          }
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Unexpected server error." }, { status: 500 });
  }
}