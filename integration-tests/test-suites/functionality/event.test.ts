import { getCredentials } from "../../_stub/data/setup";
import { getAuthToken, getAuthHeader } from "../../utils/auth";
import { setupGameIntegrationForTest } from "../../utils/database-helper";

describe('Event - Using invalid token', () => {
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

describe('Event - With non existent event ID', () => {
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

describe('Event - merge event details', () => {
  it('should apply merge event details from mergeEventDetails of game integration document', async () => {
    // Arrange
    const operator = getCredentials()[0];
    const operatorId = operator.operatorId;
    const eventId = 1;
  
    
    const mergeEventDetails = [
      {
        customEventDetailField: "customEventDetailValue",
        specialData: { key: "value" }
      },
    ];
    
    await setupGameIntegrationForTest(
      operatorId,
      {},
      [],
      mergeEventDetails
    );
    
    // Act
    const baseUrl = global.__API_SERVICE__.getBaseUrl();
    const token = await getAuthToken(baseUrl);
    const eventUrl = `${baseUrl}/api/events?eventID=${eventId}`;
    
    const response = await fetch(eventUrl, {
      method: 'GET',
      headers: getAuthHeader(token)
    });
    
    // Assert
    expect(response.status).toBe(200);
    const eventData = await response.json();

    expect(eventData.eventDetails).toBeDefined();
    expect(eventData.eventDetails.length).toBeGreaterThan(0);
    expect(eventData.eventDetails[0].customEventDetailField).toBe(mergeEventDetails[0].customEventDetailField);
    expect(eventData.eventDetails[0].specialData).toEqual(mergeEventDetails[0].specialData);
  });
});

describe('Event - patch event details', () => {
  it('should apply patches from patches of game integration document', async () => {
    // Arrange
    const operator = getCredentials()[0];
    const operatorId = operator.operatorId;
    const eventId = 1;
    
    const mergeEvent = {
      streamServer: "https://streams.example.com"
    };
    
    const patches = [
      {
        "op": "jsonata",
        "path": "/eventDetails/0/goalInfo",
        "expression": "streamServer & '/' & eventDetails[0].goalInfo"
      }
    ];
    
    await setupGameIntegrationForTest(
      operatorId,
      mergeEvent,
      patches,
      []
    );
    
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
    console.log(eventData);
    console.log(eventData.eventDetails[0]);
    
    expect(eventData.eventDetails[0].goalInfo).toBe("https://streams.example.com/529722ee2e00df1acf61aa94f8194ab24f98ce7325c571f4efda68e57e6a24d2.json");
  });
});