describe('Marble Odd Feed API Test', () => { 
  require('./test-suites/functionality/healthcheck.test'); 
  require('./test-suites/functionality/auth.test');
  require('./test-suites/functionality/schedule.test');
  require('./test-suites/functionality/event.test');
});
