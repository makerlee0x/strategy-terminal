// Server-rendered with live (or last-good) data, then refreshed in the browser.
import View from './View'; import { MSTR } from '../feeds'; import { initial } from '../../lib/ssr';
export const revalidate = 60;
export const metadata = {
  title: 'MSTR On-Chain',
  description:
    'Tokenized MSTR hub: how much exists, where it trades, earn fees, borrow, and trade 24/7.',
  alternates: { canonical: '/mstr' },
  openGraph: {
    title: 'MSTR On-Chain · STRATEGY COIN',
    description: 'Every MSTR token, every chain, and how to put it to work.',
    url: 'https://www.strategycoin.io/mstr',
    images: [{ url: '/api/card/supply', width: 1200, height: 675, type: 'image/png' }]
  },
  twitter: {
    card: 'summary_large_image',
    site: '@strategystock',
    images: ['/api/card/supply']
  }
};
export default async function Page() { return <View init={await initial(MSTR)} />; }
