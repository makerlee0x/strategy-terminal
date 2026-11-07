'use client';
import { useEffect } from 'react';

/**
 * Hide the sticky mobile Buy bar while the home hero is on screen so it
 * can't cover HOLD / AMPLIFY / CTAs (phones + wallet in-app browsers).
 * Bar returns once the hero scrolls out of view.
 */
export default function HeroBuybar() {
  useEffect(() => {
    const hero = document.querySelector('.hero-red');
    if (!hero) return;
    const sync = (on) => document.body.classList.toggle('hero-inview', on);
    const io = new IntersectionObserver(
      ([e]) => sync(e.isIntersecting && e.intersectionRatio > 0.08),
      { threshold: [0, 0.08, 0.2] }
    );
    io.observe(hero);
    sync(true);
    return () => {
      io.disconnect();
      document.body.classList.remove('hero-inview');
    };
  }, []);
  return null;
}
