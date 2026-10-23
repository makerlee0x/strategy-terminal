// Server-rendered with live (or last-good) data, then refreshed in the browser.
import View from './View'; import { STATS } from '../feeds'; import { initial } from '../../lib/ssr';
export const revalidate = 60;
// Serve a saved copy and rebuild it in the background at most once a minute. Without this, the data fetches
// (cache: 'no-store') make every visit render from scratch and wait on the upstream APIs.
export const dynamic = 'force-static';
export const metadata = {
  title: '$STRATEGY',
  description:
    'Paired with tokenized MSTR on Robinhood Chain. Pool MSTR, yield, holders, and live swap.',
  alternates: { canonical: '/strategy' },
  openGraph: {
    title: '$STRATEGY · STRATEGY COIN',
    description: 'Paired with tokenized MSTR on Robinhood Chain.',
    url: 'https://www.strategycoin.io/strategy',
    images: [{ url: '/api/card/stack', width: 1200, height: 675, type: 'image/png' }]
  },
  twitter: {
    card: 'summary_large_image',
    site: '@strategystock',
    images: ['/api/card/stack']
  }
};
export default async function Page() { return <View init={await initial(STATS)} />; }
