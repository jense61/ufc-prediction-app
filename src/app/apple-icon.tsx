import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const size = {
  width: 180,
  height: 180
};

export const contentType = "image/png";
export const runtime = "nodejs";

export default async function AppleIcon() {
  const logo = await readFile(join(process.cwd(), "public", "logo.png"));
  const logoDataUri = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "transparent"
        }}
      >
        <img
          src={logoDataUri}
          alt="UFC Fight Prophet"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain"
          }}
        />
      </div>
    ),
    size
  );
}
