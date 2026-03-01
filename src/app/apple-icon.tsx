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
          backgroundColor: "#c1121f",
          backgroundImage:
            "radial-gradient(120% 70% at 50% 100%, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0) 60%), linear-gradient(180deg, #d11a28 0%, #b50f1c 100%)",
          color: "#0a0a0a",
          fontSize: 42,
          fontWeight: 900,
          letterSpacing: -2,
          fontStyle: "italic",
          textShadow: "0 1px 0 rgba(0,0,0,0.55)",
          fontFamily: "Times New Roman"
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            lineHeight: 0.86
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
