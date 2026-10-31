/**
 * Shared navigation data and helpers for the site header, footer and CTAs.
 */

export type NavLink = {
  href: string;
  label: string;
  /** External links render as plain anchors opening in a new tab. */
  external?: boolean;
};

export const SHOP_URL = "https://www.riblo.it/agrumea-farm/";

export const primaryLinks: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/dispensa", label: "Pantry" },
  { href: "/produzione", label: "Production" },
];

export const secondaryLinks: NavLink[] = [
  { href: "/experience", label: "Experience" },
  { href: "/chi-siamo", label: "About" },
  { href: "/contatti", label: "Contacts" },
  { href: SHOP_URL, label: "Shop", external: true },
];

/**
 * Returns true when `href` points at the current pathname. External links
 * never match; the root ("/") only matches exactly so nested routes stay
 * unambiguous.
 */
export function isActiveLink(href: string, pathname: string): boolean {
  if (href === pathname) return true;
  return href !== "/" && pathname.startsWith(`${href}/`);
}
