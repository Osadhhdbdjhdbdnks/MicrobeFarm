import type { Metadata } from "next";
import { StorySection } from "@/components/story-section";

export const metadata: Metadata = {
  title: "About | Agrumea Farm",
  description:
    "Agrumea Farm — Azienda Agricola Sebastiano Piazza: a Sicilian farm transforming citrus fruits and produce into artisanal preserves.",
};

export default function AboutPage() {
  return (
    <StorySection kicker="About" title="A farm that keeps Sicilian flavours alive." offset>
      <p className="story-text">
        Agrumea Farm is the agricultural estate of Sebastiano Piazza, a family that has
        chosen to keep working the land the honest way: growing citrus fruits, almonds,
        pistachios and vegetables, then transforming them by hand into jams, pestos and
        preserves with an authentic flavour.
      </p>
      <p className="story-text">
        Every product carries the story of our orchards — a small piece of Sicily, cooked
        slowly and shared generously.
      </p>
      <p className="story-text story-copyright">
        ©2026 | Agrumea Farm — Azienda Agricola Sebastiano Piazza
      </p>
    </StorySection>
  );
}
