// Homepage: server-rendered with live (or last-good) data, then refreshed in the browser.
import Home from './Home'; import { HOME } from './feeds'; import { initial } from '../lib/ssr';
export const revalidate = 60;
// Serve a saved copy and rebuild it in the background at most once a minute. Without this, the data fetches
// (cache: 'no-store') make every visit render from scratch and wait on the upstream APIs.
export const dynamic = 'force-static';
export default async function Page() { return <Home init={await initial(HOME)} />; }
