// src/data/products.ts
export type Product = {
  slug: string;
  fruit: string;
  name: string;
  category: string; // 分类 slug（对应 categories）
  image: string;
  turns: string[];
  model: string; // 真 3D 网格（glTF-Binary）
  description: string;
};

export type Category = {
  slug: string;
  label: string;
  blurb: string;
};

const pad = (n: number) => String(n).padStart(2, "0");

/** 实际 glb 文件名映射（文件位于 public/assets/agrumea/models/） */
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
  category: string,
  description: string
): Product => ({
  slug,
  fruit,
  name,
  category,
  image: `/assets/agrumea/fruit-${slug}-side.webp`,
  turns: Array.from(
    { length: 16 },
    (_, i) => `/assets/agrumea/fruit-${slug}-turn-${pad(i)}.webp`
  ),
  model: MODEL_BY_SLUG[slug] ?? `/assets/agrumea/models/${slug}.glb`,
  description,
});

/* ============ 分类（Pantry 页按此分组） ============ */
export const categories: Category[] = [
  {
    slug: "fresh-fruit",
    label: "Fresh Fruit",
    blurb: "Sun-ripened harvest from our Sicilian orchards, picked at the perfect moment.",
  },
  {
    slug: "tropical",
    label: "Tropical Goodness",
    blurb: "Exotic notes grown with Mediterranean patience and bright, tangy character.",
  },
  {
    slug: "savoury",
    label: "Savoury",
    blurb: "Earthy, generous produce — the humble backbone of the island's table.",
  },
];

/* 顺序即展示顺序：初始三果 = 榴莲 / 木瓜 / 哈密瓜（对照设计图构图） */
export const products: Product[] = [
  product("durian", "Durian", "Fresh durian", "fresh-fruit", "The king of fruits, 3D-scanned turn by turn."),
  product("papaya", "Papaya", "Fresh papaya", "fresh-fruit", "Sun-ripened papaya, 3D-scanned turn by turn."),
  product("hamimelon", "Hami melon", "Fresh hami melon", "fresh-fruit", "Netted hami melon, 3D-scanned turn by turn."),
  product("potato", "Potato", "Fresh potato", "savoury", "Earthy Sicilian potato, 3D-scanned turn by turn."),
  product("passionfruit", "Passion fruit", "Fresh passion fruit", "tropical", "Glossy passion fruit, 3D-scanned turn by turn."),
];

/* ============ 分类 → 商品 映射（Pantry 页直接取用） ============ */
export const productsByCategory: Record<string, Product[]> = categories.reduce(
  (acc, c) => {
    acc[c.slug] = products.filter((p) => p.category === c.slug);
    return acc;
  },
  {} as Record<string, Product[]>
);

export function findProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}
export const PRODUCTS = products;
export default products;