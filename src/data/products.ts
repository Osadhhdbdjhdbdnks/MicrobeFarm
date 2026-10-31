// src/data/products.ts
export type Product = {
  slug: string;
  fruit: string;
  name: string;
  origin: string;
  image: string;
  turns: string[];
  model: string;
  description: string;
};

const pad = (n: number) => String(n).padStart(2, "0");

const MODEL_BY_SLUG: Record<string, string> = {
  durian: "/assets/agrumea/models/durian_the_king_of_fruits.glb",
  papaya: "/assets/agrumea/models/papaya.glb",
  hamimelon: "/assets/agrumea/models/hamimelon.glb",
  potato: "/assets/agrumea/models/potato.glb",
  passionfruit: "/assets/agrumea/models/passionfruit.glb",
};

const product = (
  slug: string,
  fruit: string,
  name: string,
  origin: string,
  description: string
): Product => ({
  slug,
  fruit,
  name,
  origin,
  image: `/assets/agrumea/fruit-${slug}-side.webp`,
  turns: Array.from({ length: 16 }, (_, i) => `/assets/agrumea/fruit-${slug}-turn-${pad(i)}.webp`),
  model: MODEL_BY_SLUG[slug] ?? `/assets/agrumea/models/${slug}.glb`,
  description,
});

/* 顺序即展示顺序：初始三果 = 百香果 / 榴莲 / 木瓜（对照新设计图） */
export const products: Product[] = [
  product("passionfruit", "Passion fruit", "Fresh passion fruit", "Tropical Highlands", "Glossy purple passion fruit with a bright, tangy heart."),
  product("durian", "Durian", "Fresh durian", "Southeast Asia", "The king of fruits — creamy, complex, unmistakable."),
  product("papaya", "Papaya", "Fresh papaya", "Sicilian Sun", "Sun-ripened papaya, sweet and silken on the palate."),
  product("hamimelon", "Hami melon", "Fresh hami melon", "Xinjiang Desert", "Netted hami melon, cool and honeyed."),
  product("potato", "Potato", "Fresh potato", "Sicilian Earth", "Earthy Sicilian potato, the farm's humble pride."),
];

export function findProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}
export const PRODUCTS = products;
export default products;