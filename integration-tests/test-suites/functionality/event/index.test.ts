import { getCredentials } from "../../../_stub/data/setup";
import { getAuthToken, getAuthHeader } from "../../../utils/auth";
import { getMarketIntegrations, setupGameIntegrationForTest, setupMarketIntegrationForTest } from "../../../utils/data";

describe(('Event'), () => {

  beforeAll(async () => {
    const operator = getCredentials()[0];
    const operatorId = operator.operatorId;
    
    const mergeEventDetails = [
      {
        customEventDetailField: "customEventDetailValue",
        specialData: { key: "value" }
      },
    ];

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
      mergeEventDetails
    );
    
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
    ];

    await setupMarketIntegrationForTest(marketIntegrationId.toString(), {
      moreField: "example"
    }, selections);
  });

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
  require('./merge.test');
  require('./patch.test');
});
