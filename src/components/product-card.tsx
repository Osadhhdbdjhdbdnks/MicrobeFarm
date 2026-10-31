import Link from "next/link";
import type { Product } from "@/data/products";

/**
 * Card linking to a product detail page, used in the pantry grid.
 * A plain <img> is intentional: the fruit photos keep their natural aspect
 * ratio via CSS, and next/image would require fixed intrinsic sizes that
 * distort the artwork.
 */
export function ProductCard({ product }: { product: Product }) {
  return (
    <Link className="product-card" href={`/dispensa/${product.slug}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="product-card__image"
        src={product.image}
        alt={product.name}
        loading="lazy"
        decoding="async"
      />
      <span className="product-card__name">{product.name}</span>
      <span className="product-card__cta">Discover</span>
    </Link>
  );
}
