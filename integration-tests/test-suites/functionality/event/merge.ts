import { getAuthToken, getAuthHeader } from "../../../utils/auth";

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
  const eventId = 1;

  describe('event details', () => {
    it('should apply merge event details from mergeEventDetails of game integration document', async () => {
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
        customEventDetailField: "customEventDetailValue",
        specialData: { key: "value" }
      });
    });
  });

  describe('markets', () => {
    it('should apply market merge from market integration', async () => {
      // Act
      const baseUrl = global.__API_SERVICE__.getBaseUrl();
      const token = await getAuthToken(baseUrl);
      const eventUrl = `${baseUrl}/api/events?eventID=${eventId}`;
      
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
      const expectedHome = {
        selectionID: 1,
        column: 1,
        selectionNameKey: 'key1',
        selectionName: 'Display Name 1',
        selectionNameLongKey: 'long_key1',
        point: 0,
        price: 2.28,
        settlementStatus: 'W',
      };
  
      const expectedAway = {                                                                                                                                                           
        selectionID: 2,
        column: 2,
        selectionNameKey: 'key2',
        selectionName: 'Display Name 2',
        selectionNameLongKey: 'long_key2',
        point: 0,
        price: 2.28,
        settlementStatus: 'L',
      };
  
      // Act
      const baseUrl = global.__API_SERVICE__.getBaseUrl();
      const token = await getAuthToken(baseUrl);
      const eventUrl = `${baseUrl}/api/events?eventID=${eventId}`;
      
      const { data: eventData } = await retryFetch(eventUrl, {
        method: 'GET',
        headers: getAuthHeader(token)
      });
      
      const eventDetails = eventData.eventDetails;

      const actualMarketEvent1 = eventDetails[0].markets[0];
      const actualHomeSelection = actualMarketEvent1.selections.find((s: { selectionNameKey: string }) => s.selectionNameKey === "key1");
      const actualAwaySelection = actualMarketEvent1.selections.find((s: { selectionNameKey: string }) => s.selectionNameKey === "key2");
      const actualInvalidSelection = actualMarketEvent1.selections.find((s: { selectionNameKey: string }) => s.selectionNameKey === "key3");
  
      // Assert
      expect(actualHomeSelection).toMatchObject(expectedHome);
      expect(actualAwaySelection).toMatchObject(expectedAway);
      expect(actualInvalidSelection).toBeUndefined();
    });
  });
});