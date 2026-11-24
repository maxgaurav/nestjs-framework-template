// Loaded before every e2e suite (vitest `setupFiles`). Config loaders read process.env and
// dotenv never overrides variables that are already set, so these win over the local .env.

// Tests must never deliver real mail. Phase 07 switches this to the in-memory transport.
process.env.MAIL_DRIVER = 'log';
