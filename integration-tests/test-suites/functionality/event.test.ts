import { getCredentials } from "../../_stub/data/setup";
import { getAuthToken, getAuthHeader } from "../../utils/auth";
import { getMarketIntegrations, setupGameIntegrationForTest, setupMarketIntegrationForTest } from "../../utils/data";

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
        "expression": "streamServer & '/' & eventDetails[0].goalInfo & '.json'"
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
    
    expect(eventData.eventDetails[0].goalInfo).toBe("https://streams.example.com/529722ee2e00df1acf61aa94f8194ab24f98ce7325c571f4efda68e57e6a24d2.json");
  });
});

describe('Event - merge with market integration', () => {
  it('should should apply market merge from market integration', async () => {
    // Arrange
    const eventId = 1;
    const baseUrl = global.__API_SERVICE__.getBaseUrl();
    const token = await getAuthToken(baseUrl);
    const eventUrl = `${baseUrl}/api/events?eventID=${eventId}`;

    const operator = getCredentials()[0];
    const operatorId = operator.operatorId;
    const marketIntegration = await getMarketIntegrations(operatorId);
    const marketIntegrationId = marketIntegration[0]._id;

    await setupMarketIntegrationForTest(marketIntegrationId.toString(), {
      moreField: "example"
    }, []);
    // Act
    const response = await fetch(eventUrl, {
      method: 'GET',
      headers: getAuthHeader(token)
    });
    const eventData = await response.json();
    const eventDetails = eventData.eventDetails;

    const actualMarketEvent1 = eventDetails[0].markets[0];
    
    // Assert
    expect(actualMarketEvent1.moreField).toBe("example");
  })
});

describe('Event - merge with market selections integration', () => {
  it('should apply market selections merge from market selections integration', async () => {
    // Arrange
    const eventId = 1;
    const baseUrl = global.__API_SERVICE__.getBaseUrl();
    const token = await getAuthToken(baseUrl);
    const eventUrl = `${baseUrl}/api/events?eventID=${eventId}`;

    const operator = getCredentials()[0];
    const operatorId = operator.operatorId;
    const marketIntegration = await getMarketIntegrations(operatorId);
    const marketIntegrationId = marketIntegration[0]._id;

    const selections = [
      {
        selectionID: 1,
        column: 1,
        name: "HOME",
        selectionNameKey: "key1",
        selectionName: "Display Name 1",
        selectionNameLongKey: "long_key1"
      },
      {
        selectionID: 2,
        column: 2,
        name: "AWAY",
        selectionNameKey: "key2",
        selectionName: "Display Name 2",
        selectionNameLongKey: "long_key2"
      },
      {
        selectionID: 3,
        column: 2,
        name: "INVALID",
        selectionNameKey: "key3",
        selectionName: "Display Name 3",
        selectionNameLongKey: "long_key3"
      }
    ]

    await setupMarketIntegrationForTest(marketIntegrationId.toString(), {
    },selections);

    const expectedHome = {
      selectionID: 1,
      column: 1,
      name: 'HOME',
      selectionNameKey: 'key1',
      selectionName: 'Display Name 1',
      selectionNameLongKey: 'long_key1',
      point: 0,
      price: 2.28,
      settlementStatus: 'W',
    }

    const expectedAway = {                                                                                                                                                           
      selectionID: 2,
      column: 2,
      name: 'AWAY',
      selectionNameKey: 'key2',
      selectionName: 'Display Name 2',
      selectionNameLongKey: 'long_key2',
      point: 0,
      price: 2.28,
      settlementStatus: 'L',
    }

    // Act
    const response = await fetch(eventUrl, {
      method: 'GET',
      headers: getAuthHeader(token)
    });
    const eventData = await response.json();
    const eventDetails = eventData.eventDetails;

    const actualMarketEvent1 = eventDetails[0].markets[0];
    const actualHomeSelection = actualMarketEvent1.selections.find((s: { name: string }) => s.name === "HOME");
    const actualAwaySelection = actualMarketEvent1.selections.find((s: { name: string }) => s.name === "AWAY");
    const actualInvalidSelection = actualMarketEvent1.selections.find((s: { name: string }) => s.name === "INVALID");


    // Assert
    expect(actualHomeSelection).toMatchObject(expectedHome);
    expect(actualAwaySelection).toMatchObject(expectedAway);
    expect(actualInvalidSelection).toBeUndefined();
  })
});
