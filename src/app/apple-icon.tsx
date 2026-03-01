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
          backgroundColor: "#000000",
          backgroundImage:
            "radial-gradient(90% 45% at 50% 100%, rgba(255,255,255,0.55) 0%, rgba(90,90,90,0.45) 28%, rgba(0,0,0,1) 72%)",
          color: "#c1121f",
          fontSize: 34,
          fontWeight: 900,
          letterSpacing: 2,
          fontFamily: "Arial"
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            lineHeight: 1.05,
            textTransform: "uppercase"
          }}
        >
          <span>Fight</span>
          <span>Prophet</span>
        </div>
      </div>
    ),
    size
  );
}
