import { getCredentials } from "../../_stub/data/setup";
import { getAuthToken } from "../../utils/auth";

describe(('Login'), () => {
  describe('With valid operator credential', () => {
    it('should return 200', async () => {
      // Arrange
      const credentials = getCredentials();
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
    
    it('should work with utility function', async () => {
      // Arrange
      const baseUrl = global.__API_SERVICE__.getBaseUrl();
      
      // Act
      let token: string;
        // Assert
        token = await getAuthToken(baseUrl);
        expect(typeof token).toBe('string');
        expect(token.length).toBeGreaterThan(0);

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