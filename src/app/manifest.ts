import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "La Chimère",
    short_name: "La Chimère",
    description: "Programme, clés et communauté du club La Chimère",
    start_url: "/programme",
    display: "standalone",
    background_color: "#f1ece3",
    theme_color: "#3f6ea5",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
