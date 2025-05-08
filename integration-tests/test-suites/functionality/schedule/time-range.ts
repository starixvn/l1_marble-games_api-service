import { getAuthHeader, getAuthToken } from "../../../utils/auth";


describe('With time range', () => {
  it('should have no event with start time outside time range', async () => {
    // Arrange
    const baseUrl = global.__API_SERVICE__.getBaseUrl();
    const token = await getAuthToken(baseUrl);
    const scheduleUrl = `${baseUrl}/api/schedule`;
    
    const fromDate = new Date("2025-03-13T00:00:00.000Z");
    const toDate = new Date("2025-03-14T00:00:00.000Z");
    
    // Act
    const queryUrl = `${scheduleUrl}?fromDate=${fromDate.toISOString()}&toDate=${toDate.toISOString()}`;
    
    const scheduleResponse = await fetch(queryUrl, {
      method: 'GET',
      headers: getAuthHeader(token)
    });
    
    const scheduleData = await scheduleResponse.json();
    
    // Assert
    for (const event of scheduleData) {
      const eventStartTime = new Date(event.scheduleStartTs);
      expect(eventStartTime >= fromDate && eventStartTime <= toDate).toBeTruthy();
    }
  });
});

describe('Without time range', () => {
  it('should have no event with start time in the past', async () => {
    // Arrange
    const baseUrl = global.__API_SERVICE__.getBaseUrl();
    const token = await getAuthToken(baseUrl);
    const scheduleUrl = `${baseUrl}/api/schedule`;
    
    // Act
    const response = await fetch(scheduleUrl, {
      method: 'GET',
      headers: getAuthHeader(token)
    });
    
    // Assert
    const events = await response.json();
    const now = new Date();
    
    for (const event of events) {
      const eventStartTime = new Date(event.scheduleStartTs);
      expect(eventStartTime > now).toBeTruthy();
    }
  });
});