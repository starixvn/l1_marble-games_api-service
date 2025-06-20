import { getAuthTokenWithoutIntegration, getAuthHeader } from "../../../utils/auth";

describe(('Schedule'), () => {
  describe('Invalid auth token', () => {
    it('should return 401', async () => {
      // Arrange
      const baseUrl = global.__API_SERVICE__.getBaseUrl();
      const scheduleUrl = `${baseUrl}/api/schedule`;
      
      // Act
      const response = await fetch(scheduleUrl, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });
      
      // Assert
      expect(response.status).toBe(401);
    });
  });

  describe('Without game integration', () => {
    it('should empty array', async () => {
      // Arrange
      const baseUrl = global.__API_SERVICE__.getBaseUrl();
      const token = await getAuthTokenWithoutIntegration(baseUrl);
      const scheduleUrl = `${baseUrl}/api/schedule`;
      
      // Act
      const response = await fetch(scheduleUrl, {
        method: 'GET',
        headers: getAuthHeader(token)
      });
      
      // Assert
      const data = await response.json();
      expect(data).toEqual([]);
    });
  });

  require('./time-range');
  require('./merge');
  require('./patch');
})