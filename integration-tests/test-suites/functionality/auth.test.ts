import { getCredentials } from "../../_stub/data/setup";

describe('Auth', () => {
  describe('Login', () => {
    describe('With valid operator credential', () => {
      it('should return 200', async () => {

        // Arrange
        const credentials = getCredentials();
        if (credentials.length === 0) {
          console.warn('No credentials available, skipping test');
          return;
        } 
        const validCredential = credentials[0];
        const baseUrl = global.__API_SERVICE__.getBaseUrl();
        const loginUrl = `${baseUrl}/api/login`;
        
        // Act
        const response = await fetch(loginUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operatorId: validCredential.operatorId,
            password: validCredential.password,
          }),
        });
        
        // Assert
        expect(response.status).toBe(200);
      });

      it('should contains access token', async () => {
        // Arrange
        const credentials = getCredentials();
        if (credentials.length === 0) {
          console.warn('No credentials available, skipping test');
          return;
        }
        const validCredential = credentials[0];
        const baseUrl = global.__API_SERVICE__.getBaseUrl();
        const loginUrl = `${baseUrl}/api/login`;
        
        // Act
        const response = await fetch(loginUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operatorId: validCredential.operatorId,
            password: validCredential.password,
          }),
        });
        
        // Assert
        const responseData = await response.json();
        expect(responseData).toHaveProperty('access_token');
        expect(typeof responseData.access_token).toBe('string');
        expect(responseData.access_token.length).toBeGreaterThan(0);
      });
    });

    describe('With invalid operator credential', () => {
      const invalidCredential = {
        operatorId: 'invalid',
        password: 'invalid',
      }

      it('should return 401', async () => {
        // Arrange
        const baseUrl = global.__API_SERVICE__.getBaseUrl();
        const loginUrl = `${baseUrl}/api/login`;
        
        // Act
        const response = await fetch(loginUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(invalidCredential),
        });
        
        // Assert
        expect(response.status).toBe(401);
      });
    });
  });
});
