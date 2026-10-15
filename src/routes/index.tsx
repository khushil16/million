import { createFileRoute } from "@tanstack/react-router";
import { Home } from "@/components/experience/Home";
export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "MILLION / ONE — Your first investment universe" },
      {
        name: "description",
        content:
          "One goal. A million possibilities. Explore an honest, interactive financial journey from ₹8,000 a month toward ₹10,00,000.",
      },
      { property: "og:title", content: "MILLION / ONE — One goal. Your way forward." },
      {
        property: "og:description",
        content:
          "A cinematic financial planning experience with transparent projections, a personal monthly plan, and an educational market-storm simulation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});
