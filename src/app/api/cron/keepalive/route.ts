import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron";
import { prisma } from "@/lib/prisma";

async function handle(req: NextRequest) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const randomValue = Math.floor(Math.random() * 1000000);

    await prisma.databaseKeepalive.create({
      data: {
        randomValue
      }
    });

    return NextResponse.json({
      ok: true,
      message: `Database keepalive written with value: ${randomValue}`
    });
  } catch (error) {
    console.error("Keepalive error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to write keepalive." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return handle(req);
}

export async function GET(req: NextRequest) {
  return handle(req);
}
