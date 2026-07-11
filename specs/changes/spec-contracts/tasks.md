# Tasks: spec-contracts

Red before green, always. One criterion at a time; a test you didn't watch
fail proves nothing.

- [x] RED — failing test for the first acceptance criterion (ERR_MODULE_NOT_FOUND, the right reason)
- [x] GREEN — least code that passes (test/spec-contracts.mjs 10/10)
- [x] REFACTOR — earn the design on green (pure functions, no CLI coupling)
- [x] VERIFY — whole suite + one end-to-end walk; verdict: proven (npm test 24 suites green; spec init/check e2e in tmp + this repo)
- [x] REFLECT — round-close: growth-ledger row; archive this change
