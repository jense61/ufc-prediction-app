import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const event = await prisma.event.findFirst({
      where: {
        isCompleted: false
      },
      include: {
        fights: true
      },
      orderBy: {
        date: "asc"
      }
    });

    return NextResponse.json({ ok: true, event });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to fetch upcoming event." }, { status: 500 });
  }
}