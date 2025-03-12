const config = {
  database: {
    uri: process.env.DATABASE_URI,
    dbName: 'marble-odds-feed',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    signOptions: {
      expireIn: process.env.JWT_EXPIREIN,
    },
  },
};

export default () => config;
