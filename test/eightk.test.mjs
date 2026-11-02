import test from 'node:test';
import assert from 'node:assert/strict';
import { eightK, headline } from '../lib/eightk.mjs';

test('8-K card uses the filed purchase count', () => {
  const F8 = { latest: { filingDate: '2026-11-02', asOf: 'November 1, 2026', btcHeld: 849327, btcPurchased: 811, periodFrom: 'October 26, 2026', periodTo: 'November 1, 2026' },
    previous: { asOf: 'October 18, 2026', btcHeld: 848517 }, weeklyChangeBtc: 811, holdingsDiffBtc: 810 };
  const k = eightK(F8, 1.2);
  assert.equal(k.change, 811);
  assert.equal(k.changeLabel, 'October 26 – November 1');
  assert.equal(headline(k), 'SAYLOR BOUGHT 811 BTC.');
});

test('falls back to holdings diff when the filing has no purchase figure', () => {
  const k = eightK({ latest: { btcHeld: 10, filingDate: '2026-01-01' }, previous: { asOf: 'December 28, 2025' }, weeklyChangeBtc: 5 });
  assert.equal(k.change, 5);
  assert.equal(k.changeLabel, 'vs December 28');
});
