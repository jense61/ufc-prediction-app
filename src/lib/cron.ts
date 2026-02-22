import type { NextRequest } from "next/server";

const getQuerySecret = (req: NextRequest) => req.nextUrl.searchParams.get("secret")?.trim() ?? "";

const getHeaderSecret = (req: NextRequest) => {
  const explicit = req.headers.get("x-cron-secret")?.trim();
  if (explicit) {
    return explicit;
  }

  const auth = req.headers.get("authorization")?.trim() ?? "";
  if (/^Bearer\s+/i.test(auth)) {
    return auth.replace(/^Bearer\s+/i, "").trim();
  }

  return "";
};

export const isAuthorizedCronRequest = (req: NextRequest) => {
  const expected = process.env.CRON_SECRET?.trim() ?? "";
  if (!expected) {
    return false;
  }

  const provided = getHeaderSecret(req) || getQuerySecret(req);
  return provided === expected;
};
