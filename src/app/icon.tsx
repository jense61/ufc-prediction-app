import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512
};

export const contentType = "image/png";

export default function Icon() {
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
          border: "20px solid #c1121f",
          borderRadius: 96,
          color: "#ffffff",
          fontSize: 210,
          fontWeight: 900,
          letterSpacing: 8,
          fontFamily: "Arial"
        }}
      >
        FP
      </div>
    ),
    size
  );
}
