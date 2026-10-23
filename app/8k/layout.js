// Server wrapper so /8k can carry its own share image (the page itself is a client component).
export const metadata = {
  title: '8-K day · STRATEGY COIN',
  description: 'What Strategy₿ Inc.’s latest 8-K means for every MSTR token and every 1M $STRATEGY.',
  openGraph: { images: [{ url: '/api/card/8k', width: 1200, height: 675 }] },
  twitter: { card: 'summary_large_image', images: ['/api/card/8k'] }
};
export default function L({ children }) { return children; }
