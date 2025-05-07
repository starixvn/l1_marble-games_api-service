import { getAuthToken, getAuthHeader } from "../../../utils/auth";

describe(('Event'), () => {

  describe('Invalid auth token', () => {
    it('should return 401', async () => {
      // Arrange
      const baseUrl = global.__API_SERVICE__.getBaseUrl();
      const eventUrl = `${baseUrl}/api/events?eventID=1`;
      
      // Act
      const response = await fetch(eventUrl, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });
      
      // Assert
      expect(response.status).toBe(401);
    });
  });

  describe('With non existent event ID', () => {
    it('should return 404', async () => {
      // Arrange
      const baseUrl = global.__API_SERVICE__.getBaseUrl();
      const token = await getAuthToken(baseUrl);
      const eventUrl = `${baseUrl}/api/events?eventID=999999`;
      
      // Act
      const response = await fetch(eventUrl, {
        method: 'GET',
        headers: getAuthHeader(token)
      });
      
      // Assert
      expect(response.status).toBe(404);
    });
  });
  require('./merge');
  require('./patch');
});
