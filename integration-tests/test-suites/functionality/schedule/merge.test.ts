import { getCredentials } from "../../../_stub/data/setup";
import { getAuthHeader, getAuthToken } from "../../../utils/auth";
import { setupGameIntegrationForTest } from "../../../utils/data";

describe('With merge event', () => {
  beforeAll(async () => {
    const credentials = getCredentials();
    
    const operatorId = credentials[0].operatorId;
    
    await setupGameIntegrationForTest(
      operatorId,
      {
        productCode: "SOCCER_MARBLE",
        productTypeKey: "MARBLE",
        productName: "PinGoal Soccer Speed Max",
        streamServer: "https://example.com",
        videoExtension: "mp4",
        testMege: "ExampleValue",
        eventDetails: "should Not appear"
      },
      [
      ]
    );
  });

  it("should apply merge event from game integration", async () => {
    // Arrange
    const baseUrl = global.__API_SERVICE__.getBaseUrl();
    const token = await getAuthToken(baseUrl);
    const scheduleUrl = `${baseUrl}/api/schedule`;
    
    const fromDate = new Date("2025-03-13T00:00:00.000Z");
    const toDate = new Date("2025-03-14T00:00:00.000Z")
    
    // Act
    const queryUrl = `${scheduleUrl}?fromDate=${fromDate.toISOString()}&toDate=${toDate.toISOString()}`;
    
    const scheduleResponse = await fetch(queryUrl, {
      method: 'GET',
      headers: getAuthHeader(token)
    });
    
    const scheduleData = await scheduleResponse.json();
    // Assert
    const events = scheduleData;
    expect(events.length).toBeGreaterThan(0);
    
    const event = events.find((e: { gameId: number }) => e.gameId === 1);
    expect(event).toBeDefined();
    expect(event.testMege).toBe("ExampleValue");
    expect(event.productCode).toBe("SOCCER_MARBLE");
    expect(event.productTypeKey).toBe("MARBLE");
  });

  it("should not contain eventDetails", async () => {
    // Arrange
    const baseUrl = global.__API_SERVICE__.getBaseUrl();
    const token = await getAuthToken(baseUrl);
    const scheduleUrl = `${baseUrl}/api/schedule`;
    
    const fromDate = new Date("2025-03-13T00:00:00.000Z");
    const toDate = new Date("2025-03-14T00:00:00.000Z")
    
    // Act
    const queryUrl = `${scheduleUrl}?fromDate=${fromDate.toISOString()}&toDate=${toDate.toISOString()}`;
    
    const scheduleResponse = await fetch(queryUrl, {
      method: 'GET',
      headers: getAuthHeader(token)
    });
    
    const scheduleData = await scheduleResponse.json();
    
    // Assert
    const events = scheduleData;
    expect(events.length).toBeGreaterThan(0);
    
    const event = events.find((e: { gameId: number }) => e.gameId === 1);
    expect(event.eventDetails).toBeUndefined();
  })
})