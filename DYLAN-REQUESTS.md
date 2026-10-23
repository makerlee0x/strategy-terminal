# Requests for stocktokenswap (Dylan)

1. **Raw numbers in /api/strategy-metrics.** Today it returns formatted strings ("$1.83M"), which we parse in `lib/parse.js`. Please add numeric fields alongside them, such as `marketCapUsd`, `volume24hUsd`, `mstrInLp`, `holders` and `priceUsd`.
2. **CORS / origin allowlist.** Our server proxy sends `Origin: https://www.strategycoin.io`. Browser swap needs strategycoin.io + www on the allowlist for prod.
3. **Quote without `user`.** Can `/api/swap/quote` accept an anonymous or placeholder `user`, so we can show indicative quotes before a wallet connects?
4. **Rate limits.** What limits apply to metrics, charts and swap, per IP or per origin?
5. **Holders.** What is the source and update frequency of the holder count?
