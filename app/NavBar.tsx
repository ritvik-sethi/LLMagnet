"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import navStyles from "../styles/NavBar.module.scss";

const features = [
  { title: 'Content Score', path: '/content-seo-score' },
  { title: 'Semantic Score', path: '/semantic-seo-score' },
  { title: 'Query Optimizer', path: '/query-optimizer' },
  { title: 'Rewrite Tool', path: '/rewrite-for-llm' },
  { title: 'Trends', path: '/trend-alerts' },
  { title: 'Competitor Gap', path: '/competitor-gap-analysis' },
];

export default function NavBar() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [menuOpen, setMenuOpen] = useState(false);

  const handleMenuToggle = () => setMenuOpen((open) => !open);
  const handleLinkClick = () => setMenuOpen(false);

  return (
    <nav className={navStyles.nav}>
      <div className={navStyles.navContainer}>
        <Link href="/" className={navStyles.logo}>
          <img src="/logo.svg" alt="LLMagnet Logo" className={navStyles.logoImg} />
          <span className={navStyles.logoText}>LLMagnet</span>
        </Link>
        {/* Hamburger icon for mobile */}
        {isHome && (
          <button
            className={navStyles.menuButton}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={handleMenuToggle}
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        )}
        {/* Desktop links */}
        <div className={navStyles.navLinks + ' ' + (menuOpen ? navStyles.open : '')}>
          {isHome && features.map((feature) => (
            <Link
              key={feature.path}
              href={feature.path}
              className={pathname === feature.path ? navStyles.active : ''}
              onClick={handleLinkClick}
            >
              {feature.title}
            </Link>
          ))}
        </div>
      </div>
      {/* Mobile dropdown menu */}
      {isHome && menuOpen && (
        <div id="mobile-menu" className={navStyles.mobileMenu}>
          {features.map((feature) => (
            <Link
              key={feature.path}
              href={feature.path}
              className={pathname === feature.path ? navStyles.active : ''}
              onClick={handleLinkClick}
            >
              {feature.title}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
} 