import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #000000 0%, #111111 100%)",
          border: "8px solid #c1121f",
          borderRadius: 36,
          color: "#ffffff",
          fontSize: 74,
          fontWeight: 900,
          letterSpacing: 2,
          fontFamily: "Arial"
        }}
      >
        FP
      </div>
    ),
    size
  );
}
