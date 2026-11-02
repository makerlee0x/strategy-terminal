import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBtc } from '../lib/btc8k.mjs';

// Plain text of the Nov 2, 2026 8-K BTC update (tags stripped as in lib/filings.js).
const NOV2 = 'Item 8.01 Other Events. BTC Update During Period October 26, 2026 to November 1, 2026 As of November 1, 2026 BTC Purchased (1) Aggregate Purchase Price (in millions) (2) Average Purchase Price (2) Aggregate BTC Holdings Aggregate Purchase Price (in billions) (2) Average Purchase Price (2) 811 $ 65.5 $ 80,846 849,327 $ 64.08 $ 75,451 (1) The bitcoin purchases were made using net proceeds from MSTR Stock sales.';
const OCT19 = 'BTC Update During Period October 12, 2026 to October 18, 2026 As of October 18, 2026 BTC Purchased (1) Aggregate Purchase Price (in millions) (2) Average Purchase Price (2) Aggregate BTC Holdings Aggregate Purchase Price (in billions) (2) Average Purchase Price (2) 267 $22.1 $82,900 848,517 $64.02 $75,446';

test('reads BTC purchased from the filing, not the holdings diff', () => {
  const cur = parseBtc(NOV2), prev = parseBtc(OCT19);
  assert.equal(cur.btcHeld, 849327);
  assert.equal(cur.btcPurchased, 811);
  assert.equal(cur.periodFrom, 'October 26, 2026');
  assert.equal(cur.periodTo, 'November 1, 2026');
  assert.equal(cur.asOf, 'November 1, 2026');
  assert.equal(cur.avgCostUsd, 75451);
  // The old method: rounded totals drift by one.
  assert.equal(cur.btcHeld - prev.btcHeld, 810);
  assert.equal(prev.btcPurchased, 267);
});

test('handles comma-separated purchase counts', () => {
  const t = OCT19.replace('267 $22.1 $82,900 848,517', '1,234 $102.1 $82,900 848,517');
  assert.equal(parseBtc(t).btcPurchased, 1234);
});

test('no purchased column → null, caller falls back to holdings diff', () => {
  const t = OCT19.replace('BTC Purchased (1)', 'BTC Sold (1)');
  assert.equal(parseBtc(t).btcPurchased, null);
});

test('no BTC table → null', () => {
  assert.equal(parseBtc('Strategy did not purchase or sell any bitcoin. As of October 25, 2026, Strategy holds approximately 848,517 bitcoin'), null);
});
