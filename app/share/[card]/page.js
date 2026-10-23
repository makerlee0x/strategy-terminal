// Share links: their X / link preview is the card image; visitors are sent on to the matching homepage section.
// ?d=YYYY-MM-DD in the link makes X fetch a fresh image instead of a cached one.
import { notFound } from 'next/navigation';
import Go from './Go';
const CARDS = {
  stack: { title: 'Flex your stack · STRATEGY COIN', desc: 'Every 1M $STRATEGY sits on MSTR in the pool. Amplified MSTR.', img: '/api/card/stack', to: '/#stack' },
  supply: { title: 'Share of MSTR · STRATEGY COIN', desc: 'The $STRATEGY pool holds a slice of every MSTR token on Robinhood Chain.', img: '/api/card/supply', to: '/#supply' }
};
export const dynamic = 'force-dynamic';
export function generateMetadata({ params, searchParams }) {
  const c = CARDS[params.card]; if (!c) return {};
  const img = c.img + (searchParams?.d ? '?d=' + encodeURIComponent(String(searchParams.d).slice(0, 10)) : '');
  return { title: c.title, description: c.desc, openGraph: { title: c.title, description: c.desc, images: [{ url: img, width: 1200, height: 675 }] }, twitter: { card: 'summary_large_image', title: c.title, description: c.desc, images: [img] } };
}
export default function Page({ params }) {
  const c = CARDS[params.card]; if (!c) notFound();
  return <section style={{ maxWidth: 720, margin: '40px auto' }}><Go to={c.to} />
    <img src={c.img} alt={c.desc} width={1200} height={675} style={{ width: '100%', height: 'auto', display: 'block' }} />
    <p style={{ marginTop: 18 }}><a href={c.to} style={{ color: 'var(--red-t)' }}>Go to strategycoin.io →</a></p></section>;
}
