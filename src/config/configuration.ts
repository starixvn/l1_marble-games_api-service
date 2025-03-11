const config = {
  database: {
    uri: process.env.DATABASE_URI,
    dbName: 'marble-odds-feed',
  },
  matchConfigs: [
    {
      scoreRate: {
        '0-0': 0.111,
        '1-0': 0.1142,
        '0-1': 0.1142,
        '1-1': 0.16,
        '2-0': 0.0741,
        '0-2': 0.0741,
        '2-1': 0.0648,
        '1-2': 0.0648,
        '3-0': 0.037,
        '0-3': 0.037,
        '2-2': 0.0558,
        '3-1': 0.0372,
        '1-3': 0.0372,
        '4-0': 0.0093,
        '0-4': 0.0093,
      },
    },
  ],
  jwt: {
    secret: process.env.JWT_SECRET,
    signOptions: {
      expireIn: process.env.JWT_EXPIREIN,
    },
  },
  auth: {
    username: process.env.AUTH_USERNAME,
    password: process.env.AUTH_PASSWORD,
  },
};

export default () => config;
