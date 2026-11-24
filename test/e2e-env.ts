// Loaded before every e2e suite (vitest `setupFiles`). Config loaders read process.env and
// dotenv never overrides variables that are already set, so these win over the local .env.

// Tests must never deliver real mail: the in-memory transport records it for assertions
process.env.MAIL_DRIVER = 'memory';
// @nestjs/mail validates the sender at boot; keep tests independent of the local .env sender
process.env.MAIL_FROM_ADDRESS = 'noreply@example.com';
