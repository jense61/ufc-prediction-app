import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "UFC Prediction App",
    short_name: "UFC Picks",
    description: "Predict outcomes and track UFC event results.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#c1121f",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon"
      }
    ]
  };
}
