import config from '../configuration';

describe('Config function', () => {
  beforeEach(() => {
    // Reset environment variables before each test
    process.env.DATABASE_URI = 'mongodb://localhost:27017/testdb';
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIREIN = '1h';
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.DATABASE_URI;
    delete process.env.JWT_SECRET;
    delete process.env.JWT_EXPIREIN;
  });

  it('should return the correct database config', () => {
    const result = config();
    expect(result.database).toEqual({
      uri: 'mongodb://localhost:27017/testdb',
      dbName: 'marble_odds_feed',
    });
  });

  it('should return the correct JWT config', () => {
    const result = config();
    expect(result.jwt).toEqual({
      secret: 'test-secret',
      signOptions: {
        expireIn: '1h',
      },
    });
  });

  it('should handle missing env variables gracefully', () => {
    delete process.env.DATABASE_URI;
    delete process.env.JWT_SECRET;
    delete process.env.JWT_EXPIREIN;

    const result = config();
    expect(result.database.uri).toBeUndefined();
    expect(result.jwt.secret).toBeUndefined();
    expect(result.jwt.signOptions.expireIn).toBeUndefined();
  });
});
