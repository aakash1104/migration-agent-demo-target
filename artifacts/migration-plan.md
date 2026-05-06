# Migration Plan

Generated: 2026-05-06T20:56:10.533Z

| File | Complexity | Reason |
|---|---|---|
| `src/lib/codemod-counterexample.ts` | `trivial` | simple formatting and date arithmetic usage |
| `src/lib/trivial.ts` | `trivial` | simple formatting and date arithmetic usage |
| `src/lib/medium.ts` | `mutation-aware` | chained/duration workflow likely to need care |
| `src/lib/hard.ts` | `timezone` | timezone/mutability-sensitive paths |