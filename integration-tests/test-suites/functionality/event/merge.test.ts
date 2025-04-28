import { getCredentials } from "../../../_stub/data/setup";
import { getAuthToken, getAuthHeader } from "../../../utils/auth";
import { getMarketIntegrations, setupGameIntegrationForTest, setupMarketIntegrationForTest } from "../../../utils/data";

async function retryFetch(url, options, maxRetries = 3, delay = 500) {
  let lastResponse: any;
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      lastResponse = response;
      
      if (response.status === 200) {
        const data = await response.json();
        if (data.eventDetails && data.eventDetails.length > 0) {
          return { response, data };
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (error) {
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  if (lastResponse) {
    return { response: lastResponse, data: await lastResponse.json() };
  }
  throw lastError ?? new Error('Max retries reached');
}

describe('Merge', () => {
  describe('event details', () => {
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
      
      const { response, data: eventData } = await retryFetch(
        eventUrl, 
        {
          method: 'GET',
          headers: getAuthHeader(token)
        }
      );
      
      // Assert
      expect(response.status).toBe(200);
      expect(eventData.eventDetails[0]).toMatchObject({
        customEventDetailField: mergeEventDetails[0].customEventDetailField,
        specialData: mergeEventDetails[0].specialData
      });
    });
  });
  describe('markets', () => {
    it('should apply market merge from market integration', async () => {
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
      const { data: eventData } = await retryFetch(
        eventUrl, 
        {
          method: 'GET',
          headers: getAuthHeader(token)
        }
      );
      
      const eventDetails = eventData.eventDetails;
      const actualMarketEvent1 = eventDetails[0].markets[0];
      
      // Assert
      expect(actualMarketEvent1).toMatchObject({
        moreField: "example"
      });
    });

  });

  describe('selections', () => {
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
      const { data: eventData } = await retryFetch(eventUrl, {
        method: 'GET',
        headers: getAuthHeader(token)
      });
      const eventDetails = eventData.eventDetails;
  
      const actualMarketEvent1 = eventDetails[0].markets[0];
      const actualHomeSelection = actualMarketEvent1.selections.find((s: { name: string }) => s.name === "HOME");
      const actualAwaySelection = actualMarketEvent1.selections.find((s: { name: string }) => s.name === "AWAY");
      const actualInvalidSelection = actualMarketEvent1.selections.find((s: { name: string }) => s.name === "INVALID");
  
  
      // Assert
      expect(actualHomeSelection).toMatchObject(expectedHome);
      expect(actualAwaySelection).toMatchObject(expectedAway);
      expect(actualInvalidSelection).toBeUndefined();
    });
  });
});