import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  username: z.string().trim().min(3).max(24).optional(),
  email: z.string().email(),
  password: z.string().min(8).max(64)
});

type RegisterBody = z.infer<typeof registerSchema>;

const toUsernameBase = (email: string) => {
  const localPart = email.split("@")[0] ?? "user";
  const sanitized = localPart.toLowerCase().replace(/[^a-z0-9]/g, "");
  const base = sanitized.length >= 3 ? sanitized : "user";
  return base.slice(0, 24);
};

const createUniqueUsername = async (email: string) => {
  const base = toUsernameBase(email);

  for (let counter = 0; counter < 100; counter += 1) {
    const suffix = counter === 0 ? "" : String(counter);
    const maxBaseLength = 24 - suffix.length;
    const candidate = `${base.slice(0, Math.max(3, maxBaseLength))}${suffix}`;

    const existing = await prisma.user.findUnique({
      where: { username: candidate }
    });

    if (!existing) {
      return candidate;
    }
  }

  throw new Error("Unable to generate unique username.");
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RegisterBody;
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid registration data." },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase();

    const username = parsed.data.username?.trim() || (await createUniqueUsername(email));

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });

    if (existing) {
      return NextResponse.json(
        { ok: false, error: "Username or email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    await prisma.user.create({
      data: {
        username,
        email,
        passwordHash
      }
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Unexpected server error." }, { status: 500 });
  }
}