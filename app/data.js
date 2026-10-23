import cg from '../data/coingecko-tokens.json';
export { cg };
export const S = () => <span className="tag sample">SAMPLE</span>;
export const Lv = ({ s = 'LIVE' }) => <span className="tag live">{s}</span>;
/** Status tag: LIVE / LOADING / DATA DELAYED */
export const St = ({ d, s = 'LIVE' }) => d == null ? <span className="tag sample">LOADING</span> : d.ok === false || d.delayed ? <span className="tag delayed">DATA DELAYED</span> : <span className="tag live">{s}</span>;
export const fmt = n => n == null || !Number.isFinite(+n) ? '—' : n >= 1e9 ? '$' + (n / 1e9).toFixed(2) + 'B' : n >= 1e6 ? '$' + (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? '$' + (n / 1e3).toFixed(0) + 'K' : '$' + Math.round(n);
export const num = n => n == null || !Number.isFinite(+n) ? '—' : Math.round(n).toLocaleString('en-US');
export const pct = (n, d = 2) => n == null || !Number.isFinite(+n) ? '—' : (+n).toFixed(d) + '%';
export const EXP = { ethereum: ['Ethereum', 'https://etherscan.io/token/'], 'binance-smart-chain': ['BNB Chain', 'https://bscscan.com/token/'], 'arbitrum-one': ['Arbitrum', 'https://arbiscan.io/token/'], base: ['Base', 'https://basescan.org/token/'], solana: ['Solana', 'https://solscan.io/token/'], avalanche: ['Avalanche', 'https://snowtrace.io/token/'], hyperevm: ['HyperEVM', 'https://hyperevmscan.io/token/'], 'morph-l2': ['Morph L2', 'https://explorer.morphl2.io/token/'], robinhood: ['Robinhood Chain', 'https://robinhoodchain.blockscout.com/token/'] };
export const ORDER = ['robinhood', 'arbitrum-one'];
export const day = () => new Date().toISOString().slice(0, 10);
