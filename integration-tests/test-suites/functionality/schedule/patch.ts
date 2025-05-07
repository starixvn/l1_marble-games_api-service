import { getCredentials } from "../../../_stub/data/setup";
import { getAuthHeader, getAuthToken } from "../../../utils/auth";
import { setupGameIntegrationForTest } from "../../../utils/data";

describe('With Patch', () => {
  it('should apply add patch operation from game integration', async () => {
    // Arrange
    const credentials = getCredentials();
    const operatorId = credentials[0].operatorId;
    
    await setupGameIntegrationForTest(
      operatorId,
      {
      },
      [
        {
          "op": "add", 
          "path": "/test", 
          "value": "addedValue"
        }
      ]
    );

    const baseUrl = global.__API_SERVICE__.getBaseUrl();
    const token = await getAuthToken(baseUrl);
    const scheduleUrl = `${baseUrl}/api/schedule`;
    
    const fromDate = new Date("2025-03-13T00:00:00.000Z");
    const toDate = new Date("2025-03-14T00:00:00.000Z");

    const queryUrl = `${scheduleUrl}?fromDate=${fromDate.toISOString()}&toDate=${toDate.toISOString()}`;
    
    // Act
    const scheduleResponse = await fetch(queryUrl, {
      method: 'GET',
      headers: getAuthHeader(token)
    });
    
    const scheduleData = await scheduleResponse.json();
    const events = scheduleData;
    const event = events.find((e: { gameId: number }) => e.gameId === 1);

    // Assert
    expect(event.test).toBe("addedValue");
  });

  it('should apply jsonata patch operation from game integration', async () => {
    // Arrange
    const credentials = getCredentials();
    const operatorId = credentials[0].operatorId;

    await setupGameIntegrationForTest(
      operatorId,
      {
      },
      [
        {
          "op": "jsonata", 
          "path": "/eventName", 
          "expression": "eventNameAKey & ' v ' & eventNameBKey"
        }
      ]
    );

    const baseUrl = global.__API_SERVICE__.getBaseUrl();
    const token = await getAuthToken(baseUrl);
    const scheduleUrl = `${baseUrl}/api/schedule`;
    
    const fromDate = new Date("2025-03-13T00:00:00.000Z");
    const toDate = new Date("2025-03-14T00:00:00.000Z");

    const queryUrl = `${scheduleUrl}?fromDate=${fromDate.toISOString()}&toDate=${toDate.toISOString()}`;
    
    // Act  
    const scheduleResponse = await fetch(queryUrl, {
      method: 'GET',
      headers: getAuthHeader(token)
    });
    
    const scheduleData = await scheduleResponse.json();
    const events = scheduleData;
    const event = events.find((e: { gameId: number }) => e.gameId === 1);
    const expectedEventName = event.eventNameAKey + " v " + event.eventNameBKey;
    // Assert
    expect(event.eventName).toBe(expectedEventName);
  });
});