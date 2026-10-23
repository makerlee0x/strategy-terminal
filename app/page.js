// Homepage: server-rendered with live (or last-good) data, then refreshed in the browser.
import Home from './Home'; import { HOME } from './feeds'; import { initial } from '../lib/ssr';
export const revalidate = 60;
export default async function Page() { return <Home init={await initial(HOME)} />; }
