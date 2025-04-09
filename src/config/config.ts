const MAX_CACHE_TTL = 24 * 60 * 60 * 1000; // one day

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
});

export default config;
