import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Microbe Farm | Jams, pestos and flavours of Sicily",
  description:
    "Microbe Farm transforms Sicilian citrus fruits, other fruits and produce into artisanal jams, pestos and preserves with an authentic flavour",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="visually-hidden" href="#site-main">
          Skip to content
        </a>

        <SiteHeader />

        <div className="site-shell">
          {/* ⚠️ 关键修复：{children} 全文件只能出现这一次。
              之前被粘贴成 {children}{children}，导致每个页面
              （hero / 故事段 / 四栏）都连排渲染两遍。 */}
          <main id="site-main">{children}</main>

          <SiteFooter />
        </div>

        {/* 固定定位的 Privacy & Cookies 已移除：
            页脚内已含 Privacy / Cookies 链接，避免图4 的双份 legal */}
      </body>
    </html>
  );
}