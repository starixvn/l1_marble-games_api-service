describe('Marble Odd Feed API Test', () => { 
  require('./test-suites/functionality/healthcheck.test'); 
  require('./test-suites/functionality/login.test');
  require('./test-suites/functionality/schedule/index.test');
  require('./test-suites/functionality/event/index.test');
});
