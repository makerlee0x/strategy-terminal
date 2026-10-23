// Server-rendered with live (or last-good) data, then refreshed in the browser.
import View from './View'; import { STATS } from '../feeds'; import { initial } from '../../lib/ssr';
export const revalidate = 60;
export default async function Page() { return <View init={await initial(STATS)} />; }
