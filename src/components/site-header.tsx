"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  isActiveLink,
  primaryLinks,
  secondaryLinks,
  type NavLink,
} from "@/data/navigation";

function NavItem({
  link,
  pathname,
  onNavigate,
  marker = false,
  className,
  linkClassName,
}: {
  link: NavLink;
  pathname: string;
  onNavigate: () => void;
  marker?: boolean;
  className?: string;
  linkClassName?: string;
}) {
  const active = !link.external && isActiveLink(link.href, pathname);
  return (
    <li className={className}>
      {link.external ? (
        <a href={link.href} className={linkClassName} target="_blank" rel="noreferrer">
          {link.label}
          <span className="fp-nav__arrow" aria-hidden>↗</span>
        </a>
      ) : (
        <Link href={link.href} className={linkClassName} aria-current={active ? "page" : undefined} onClick={onNavigate}>
          {marker ? <span className="fp-nav__marker" aria-hidden /> : null}
          {link.label}
        </Link>
      )}
    </li>
  );
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const [experienceLink, ...moreLinks] = secondaryLinks;

  return (
    <>
      <header className="site-header site-header--new">
        <div className="site-header__bar">
          {/* 隐藏语言切换 */}
          <div className="site-header__side site-header__side--start" style={{ visibility: "hidden" }}>
            <nav className="site-lang-switcher" aria-label="Language switcher">
              <Link href="/" className="site-lang-switcher__item">IT</Link>
              <span aria-current="true" className="site-lang-switcher__item is-active">EN</span>
            </nav>
          </div>

          {/* 居中品牌区 */}
          <div className="site-header__center new-header-center">
            <div className="site-header__brand new-brand">
              <Link href="/" aria-label="Agrumea Farm" className="site-header__wordmark">
                <span className="site-header__wordmark-main">AGRUMEA</span>
                <span className="site-header__wordmark-sub">Farm</span>
              </Link>
              
              {/* 装饰线与叶子图标 */}
              <div className="header-decoration">
                <span className="deco-line"></span>
                <svg className="deco-leaf" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
                </svg>
                <span className="deco-line"></span>
              </div>
              
              {/* 副标题 */}
              <p className="header-subtitle">PURE FRUITS &nbsp;•&nbsp; NATURAL GOODNESS &nbsp;•&nbsp; FROM OUR FARM</p>
            </div>
          </div>

          {/* 隐藏 Menu 按钮 */}
          <div className="site-header__side site-header__side--end" style={{ visibility: "hidden" }}>
            <button type="button" className="site-menu-toggle" onClick={() => setMenuOpen((v) => !v)}>
              <span className="site-menu-toggle__pill">
                <span className="site-menu-toggle__diamond" aria-hidden />
                {menuOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* 保留全屏导航结构，但通过 CSS 控制显示 */}
      <div id="site-full-page-nav" className={`site-full-page-nav${menuOpen ? " is-open" : ""}`} aria-hidden={!menuOpen}>
        <div className="site-full-page-nav__inner">
          <nav aria-label="Primary">
            <ul className="fp-nav__list">
              {primaryLinks.map((l) => (
                <NavItem key={l.href} link={l} pathname={pathname} onNavigate={closeMenu} marker className="fp-nav__item" linkClassName="fp-nav__link" />
              ))}
              <li className="fp-nav__item fp-nav__item--is-last">
                <Link href={experienceLink.href} className="fp-nav__link" onClick={closeMenu}>
                  <span className="fp-nav__marker" aria-hidden />{experienceLink.label}
                </Link>
                <ul className="fp-nav__secondary">
                  {moreLinks.map((l) => (
                    <NavItem key={l.label} link={l} pathname={pathname} onNavigate={closeMenu} className="fp-nav__secondary-item" linkClassName="fp-nav__secondary-link" />
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}