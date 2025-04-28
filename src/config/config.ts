
const config = () => ({
  database: {
    uri: process.env.DATABASE_URI,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    signOptions: {
      expireIn: process.env.JWT_EXPIREIN,
    },
  },
  cache: {
    ttl: process.env.DEFAULT_CACHE_TTL ?? 5000,
  },
  sentry: {
    dsn: process.env.SENTRY_DSN,
    environment: process.env.ENVIRONMENT,
    logIdentifier: 'marble-odds-feed',
  }
});

export default config;
