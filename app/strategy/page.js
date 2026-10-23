// Server-rendered with live (or last-good) data, then refreshed in the browser.
import View from './View'; import { STATS } from '../feeds'; import { initial } from '../../lib/ssr';
export const revalidate = 60;
export const metadata = {
  title: '$STRATEGY',
  description:
    'Paired with tokenized MSTR on Robinhood Chain. Pool MSTR, yield, holders, and live swap.',
  alternates: { canonical: '/strategy' },
  openGraph: {
    title: '$STRATEGY · STRATEGY COIN',
    description: 'Paired with tokenized MSTR on Robinhood Chain.',
    url: 'https://www.strategycoin.io/strategy',
    images: [{ url: '/api/card/stack', width: 1200, height: 675 }]
  }
};
export default async function Page() { return <View init={await initial(STATS)} />; }
