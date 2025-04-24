import { getCredentials } from "../../_stub/data/setup";
import { getAuthToken, getAuthHeader } from "../../utils/auth";
import { setupGameIntegrationForTest } from "../../utils/data";


describe('Schedule - With time range - Using invalid token', () => {
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

describe('Schedule - With time range - Using valid token', () => {
  let token: string;
  let baseUrl: string;
  let scheduleUrl: string;
  let scheduleResponse: Response;
  let scheduleData: any[];
  let credentials: any[];
  
  beforeAll(async () => {
    credentials = getCredentials();
    
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
        {
          "op": "add", 
          "path": "/test", 
          "value": "addedValue"
        },
        {
          "op": "jsonata", 
          "path": "/eventName", 
          "expression": "eventNameAKey & ' v ' & eventNameBKey"
        }
      ]
    );
    
    // Arrange
    baseUrl = global.__API_SERVICE__.getBaseUrl();
    token = await getAuthToken(baseUrl);
    scheduleUrl = `${baseUrl}/api/schedule`;
    
    const fromDate = new Date("2025-03-13T00:00:00.000Z");
    const toDate = new Date("2025-03-14T00:00:00.000Z");
    
    // Act
    const queryUrl = `${scheduleUrl}?fromDate=${fromDate.toISOString()}&toDate=${toDate.toISOString()}`;
    
    scheduleResponse = await fetch(queryUrl, {
      method: 'GET',
      headers: getAuthHeader(token)
    });
    
    scheduleData = await scheduleResponse.json();
  });
  
  it('should return 200', async () => {
    // Assert
    expect(scheduleResponse.status).toBe(200);
  });
  
  it('should have no event with start time outside time range', async () => {
    // Assert
    const fromDate = new Date("2025-03-13T00:00:00.000Z");
    const toDate = new Date("2025-03-14T00:00:00.000Z");
    
    for (const event of scheduleData) {
      const eventStartTime = new Date(event.startTime);
      expect(eventStartTime >= fromDate && eventStartTime <= toDate).toBeTruthy();
    }
  });
  
  it('should apply merge', async () => {
    // Assert
    const events = scheduleData;
    expect(events.length).toBeGreaterThan(0);
    
    const event = events.find(e => e.gameId === 1);
    expect(event).toBeDefined();
    expect(event.testMege).toBe("ExampleValue");
    expect(event.productCode).toBe("SOCCER_MARBLE");
    expect(event.productTypeKey).toBe("MARBLE");
  });
  
  it('should not have eventDetails field', async () => {
    // Assert
    const events = scheduleData;
    expect(events.length).toBeGreaterThan(0);
    
    for (const event of events) {
      expect(event.eventDetails).toBeUndefined();
    }
  });
  
  it('should apply add operation patch', async () => {
    // Assert
    const events = scheduleData;
    expect(events.length).toBeGreaterThan(0);
    
    const event = events.find(e => e.gameId === 1);
    expect(event).toBeDefined();
    expect(event.test).toBe("addedValue");
  });
  
  it('should apply jsonata operation patch', async () => {
    // Assert
    const events = scheduleData;
    expect(events.length).toBeGreaterThan(0);
    
    const event = events.find(e => e.gameId === 1);
    expect(event).toBeDefined();
    expect(event.eventName).toBe(`${event.eventNameAKey} v ${event.eventNameBKey}`);
  });
});

describe('Schedule - Without time range', () => {
  it('should have no event with endtime in the past', async () => {
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
    expect(response.status).toBe(200);
    
    const events = await response.json();
    const now = new Date();
    
    for (const event of events) {
      const eventEndTime = new Date(event.endTime);
      expect(eventEndTime > now).toBeTruthy();
    }
  });
});
