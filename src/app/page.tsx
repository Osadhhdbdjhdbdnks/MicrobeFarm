import type { Metadata } from "next";
import Link from "next/link";
import { FruitSlider } from "@/components/fruit-slider";
import { StorySection } from "@/components/story-section";
import { CtaPill } from "@/components/cta-pill";
import { ProductCard } from "@/components/product-card";
import { categories, products, productsByCategory } from "@/data/products";

export const metadata: Metadata = {
  title: "Agrumea Farm | Jams, pestos and Sicilian preserves",
  description:
    "Agrumea Farm — Sicilian artisan marmalades, spreads and preserves. Pure fruits, natural goodness, from our farm.",
};

const MARQUEE_WORDS = [
  "Pure fruits",
  "Natural goodness",
  "From our farm",
  "Sicilian recipes",
  "Malaysian harvest",
];

export default function HomePage() {
  const featured = products.slice(0, 3);

  return (
    <>
      <FruitSlider />

      {/* ① 品牌词带 */}
      <div className="home-marquee" aria-hidden="true">
        <div className="home-marquee__track">
          {[0, 1].map((k) => (
            <span className="home-marquee__group" key={k}>
              {MARQUEE_WORDS.map((w) => (
                <span className="home-marquee__item" key={w}>
                  {w}
                  <i className="home-marquee__diamond" />
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ② 品牌故事 */}
      <StorySection kicker="Our story" title="From our orchards to your table." tint>
        <p className="story-text">
          Microbe Farm grows, picks and preserves fruit at the exact peak of
          ripeness. No concentrates, no shortcuts — only the patience of the
          seasons and the honesty of whole fruit.
        </p>
        <p className="story-text">
          Every jar, crate and box carries the same promise: pure fruit,
          natural goodness, from our farm to your table.
        </p>
        <div className="story-stats">
          <div className="story-stat">
            <p className="story-stat__value">100%</p>
            <p className="story-stat__label">Pure fruit</p>
          </div>
          <div className="story-stat">
            <p className="story-stat__value">5</p>
            <p className="story-stat__label">Harvests a year</p>
          </div>
          <div className="story-stat">
            <p className="story-stat__value">0</p>
            <p className="story-stat__label">Additives, ever</p>
          </div>
        </div>
        <div className="story-actions">
          <CtaPill href="/chi-siamo">Meet the farm</CtaPill>
          <CtaPill href="/produzione" variant="outline">How we preserve</CtaPill>
        </div>
      </StorySection>

      {/* ③ 分类入口 */}
      <section className="home-categories">
        <header className="home-section-head">
          <p className="story-kicker">The pantry</p>
          <h2 className="home-section-title">Three shelves, one harvest.</h2>
        </header>
        <div className="home-categories__grid">
          {categories.map((c, i) => (
            <Link key={c.slug} className="home-category" href={`/dispensa#${c.slug}`}>
              <span className="home-category__index">0{i + 1}</span>
              <h3 className="home-category__label">{c.label}</h3>
              <p className="home-category__blurb">{c.blurb}</p>
              <span className="home-category__count">
                {(productsByCategory[c.slug] ?? []).length} products
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ④ 当季主打 */}
      <section className="home-featured">
        <header className="home-section-head">
          <p className="story-kicker">In season now</p>
          <h2 className="home-section-title">This month&rsquo;s harvest.</h2>
        </header>
        <div className="pantry-grid home-featured__grid">
          {featured.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
        <div className="home-featured__cta">
          <CtaPill href="/dispensa">Browse the full pantry</CtaPill>
        </div>
      </section>

      {/* ⑤ 到访体验 */}
      <section className="experience-banner">
        <div>
          <p className="story-kicker">Experience</p>
          <h2 className="story-title">Taste the farm in person.</h2>
          <p className="story-text">
            Walk the orchards, join a preserving workshop and taste straight
            from the copper pan.
          </p>
          <CtaPill href="/experience">Plan your visit</CtaPill>
        </div>
      </section>
    </>
  );
}