'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';
import navStyles from '../styles/NavBar.module.scss';

const features = [
  { title: 'Draft', path: '/draft' },
  { title: 'Score', path: '/content-seo-score' },
  { title: 'Live check', path: '/live-signals' },
  { title: 'Advice', path: '/desk-suggest' },
  { title: 'Polish', path: '/rewrite-for-llm' },
  { title: 'Rivals', path: '/competitor-gap-analysis' },
];

export default function NavBar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className={navStyles.nav}>
      <div className={navStyles.navShell}>
        <div className={navStyles.navContainer}>
          <Link href="/" className={navStyles.logo} onClick={() => setMenuOpen(false)}>
            <span className={navStyles.logoMark} aria-hidden>
              <img src="/logo.svg" alt="" className={navStyles.logoImg} />
            </span>
            <span className={navStyles.logoText}>
              LLM<span>agnet</span>
            </span>
            <span className={navStyles.logoChip}>edit</span>
          </Link>

          <button
            className={navStyles.menuButton}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            data-variant="ghost"
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>

          <div className={`${navStyles.navLinks} ${menuOpen ? navStyles.open : ''}`}>
            {features.map((feature) => {
              const active = pathname === feature.path;
              return (
                <Link
                  key={feature.path}
                  href={feature.path}
                  className={`${navStyles.link} ${active ? navStyles.active : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  {feature.title}
                  {active && <span className={navStyles.activeDot} aria-hidden />}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
