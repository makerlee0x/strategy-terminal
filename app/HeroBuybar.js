'use client';
import { useEffect } from 'react';

/**
 * Sticky Buy fades in after the home hero leaves the viewport.
 * While the hero is on screen the bar stays faded out so it can't
 * cover HOLD / AMPLIFY (phones + wallet in-app browsers).
 */
export default function HeroBuybar() {
  useEffect(() => {
    const hero = document.querySelector('.hero-red');
    if (!hero) return;
    const sync = (on) => {
      document.body.classList.toggle('hero-inview', on);
      document.body.classList.add('buybar-ready');
    };
    const io = new IntersectionObserver(
      ([e]) => sync(e.isIntersecting && e.intersectionRatio > 0.08),
      { threshold: [0, 0.08, 0.2] }
    );
    io.observe(hero);
    sync(true);
    return () => {
      io.disconnect();
      document.body.classList.remove('hero-inview', 'buybar-ready');
    };
  }, []);
  return null;
}
