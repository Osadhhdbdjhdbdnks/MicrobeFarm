import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Agrumea Farm | Jams, pestos and flavours of Sicily",
  description:
    "Agrumea Farm transforms Sicilian citrus fruits, other fruits and produce into artisanal jams, pestos and preserves with an authentic flavour",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <a className="visually-hidden" href="#site-main">
          Skip to content
        </a>
        <SiteHeader />
        <main id="site-main">{children}</main>
        <div className="site-shell__legal">
          <Link className="site-legal__link" href="/chi-siamo#privacy">
            Privacy
          </Link>
          {" & "}
          <Link className="site-legal__link" href="/chi-siamo#cookies">
            Cookies
          </Link>
        </div>
      </body>
    </html>
  );
}