import { getAuthToken, getAuthHeader } from "../../../utils/auth";

describe('Patch', () => {
  describe('event details', () => {
    it('should apply patches from patches of game integration document', async () => {
      // Arrange
      const eventId = 1;

      // Act
      const baseUrl = global.__API_SERVICE__.getBaseUrl();
      const token = await getAuthToken(baseUrl);
      const eventUrl = `${baseUrl}/api/events?eventID=${eventId}`;
      
      const response = await fetch(eventUrl, {
        method: 'GET',
        headers: getAuthHeader(token)
      });
      
      // Assert
      const eventData = await response.json();
      
      expect(eventData.eventDetails[0].goalInfo).toBe("https://streams.example.com/529722ee2e00df1acf61aa94f8194ab24f98ce7325c571f4efda68e57e6a24d2.json");
    });
  });
})