// The terminal: an easter egg linked from the $STRATEGY page footer. Server-rendered with live data, then refreshed in the browser.
import View from './View'; import { TERMINAL } from '../feeds'; import { initial } from '../../lib/ssr';
export const revalidate = 60;
// Serve a saved copy and rebuild it in the background at most once a minute. Without this, the data fetches
// (cache: 'no-store') make every visit render from scratch and wait on the upstream APIs.
export const dynamic = 'force-static';
export const metadata = {
  title: 'Terminal',
  description: 'C:\\$STRATEGY> interactive CRT. HOLD. HOLD. AMPLIFY.',
  alternates: { canonical: '/terminal' },
  robots: { index: true, follow: true }
};
export default async function Page() { return <View init={await initial(TERMINAL)} />; }
