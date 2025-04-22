const MAX_CACHE_TTL = 5 * 1000; // 5 seconds

const config = () => ({
  database: {
    uri: process.env.DATABASE_URI,
    dbName: 'marble_odds_feed',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    signOptions: {
      expireIn: process.env.JWT_EXPIREIN,
    },
  },
  cache: {
    ttl: MAX_CACHE_TTL,
  },
  sentry: {
    dsn: process.env.SENTRY_DSN,
    environment: process.env.ENVIRONMENT,
    logIdentifier: 'marble-odds-feed',
  }
});

export default config;
