import type { Metadata } from "next";
import { categories, productsByCategory } from "@/data/products";
import { ProductCard } from "@/components/product-card";

export const metadata: Metadata = {
  title: "Pantry | Microbe Farm",
  description:
    "Browse the Microbe Farm pantry: fresh fruit, tropical goodness and savoury produce, grouped by category.",
};

export default function PantryPage() {
  return (
    <>
      <section className="pantry-hero">
        <p className="story-kicker">Pantry</p>
        <h1 className="pantry-hero__title">The harvest, shelved.</h1>
        <p className="pantry-hero__lead">
          Every fruit begins in our orchards. Browse the pantry by category and
          discover the flavour of Sicily at its source.
        </p>
      </section>

      {categories.map((c) => {
        const items = productsByCategory[c.slug] ?? [];
        if (!items.length) return null;
        return (
          <section key={c.slug} className="pantry-category">
            <header className="pantry-category__head">
              <h2 className="pantry-category__title">{c.label}</h2>
              <p className="pantry-category__blurb">{c.blurb}</p>
            </header>
            <div className="pantry-grid">
              {items.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}