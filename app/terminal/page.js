// The terminal: an easter egg linked from the $STRATEGY page footer. Server-rendered with live data, then refreshed in the browser.
import View from './View'; import { TERMINAL } from '../feeds'; import { initial } from '../../lib/ssr';
export const revalidate = 60;
export const metadata = { title: 'STRATEGY COIN · Terminal', description: 'C:\\$STRATEGY> HOLD. HOLD. AMPLIFY.' };
export default async function Page() { return <View init={await initial(TERMINAL)} />; }
