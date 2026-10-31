import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { findProduct, products } from "@/data/products";
import { SHOP_URL } from "@/data/navigation";
import { CtaPill } from "@/components/cta-pill";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) return { title: "Product not found | Agrumea Farm" };
  return {
    title: `${product.name} | Agrumea Farm`,
    description: `${product.name} — artisanal Sicilian preserve from Agrumea Farm.`,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) notFound();

  return (
    <section className="story-section story-section--offset product-detail">
      <p className="story-kicker">Pantry</p>
      <h1 className="story-title">{product.name}</h1>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="product-detail__image" src={product.image} alt={product.name} />
      <p className="story-text product-detail__text">
        An artisanal Sicilian preserve from Agrumea Farm, made with fruit and produce
        from our orchards and vegetable gardens, cooked slowly the traditional way.
      </p>
      <div className="product-detail__actions">
        <CtaPill href={SHOP_URL}>Buy online</CtaPill>
        <CtaPill href="/dispensa" variant="outline">
          Back to pantry
        </CtaPill>
      </div>
    </section>
  );
}
