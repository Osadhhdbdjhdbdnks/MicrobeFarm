import { categories, productsByCategory } from "@/data/products";
import { ProductCard } from "@/components/product-card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sicilian jams, pestos and preserves | Agrumea Farm",
  description:
    "Explore the Agrumea Farm pantry: Sicilian artisanal marmalades, jams, spreadable creams, pestos and savoury preserves.",
};

export default function PantryPage() {
  return (
    <>
      <section className="pantry-hero">
        <h1 className="pantry-hero__title">Pantry</h1>
        <p className="pantry-hero__lead">Our land, one fruit at a time.</p>
      </section>

      {categories.map((c) => (
        <section key={c.key} className="story-section">
          <p className="story-kicker">{c.title}</p>
          <h2 className="story-title">{c.title}</h2>
          <p className="story-text">{c.blurb}</p>

          <div className="pantry-grid pantry-grid--flush">
            {productsByCategory(c.key).map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
