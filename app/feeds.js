// API feeds each page reads; the server page pre-renders them (lib/ssr.js) and the client keeps them fresh.
export const HOME = ['/api/strategy-metrics', '/api/pool-backing', '/api/strategy-filings', '/api/mstr-tokens', '/api/pools', '/api/robinhood-mstr'];
export const STATS = ['/api/strategy-metrics', '/api/pools', '/api/pool-backing', '/api/strategy-history'];
export const MSTR = ['/api/mstr-tokens', '/api/strategy-metrics', '/api/strategy-filings', '/api/offhours', '/api/chains', '/api/perps'];
export const TERMINAL = ['/api/strategy-metrics', '/api/pool-backing', '/api/strategy-history', '/api/strategy-filings', '/api/mstr-tokens', '/api/offhours'];
export const EIGHTK = ['/api/strategy-filings', '/api/pool-backing'];
