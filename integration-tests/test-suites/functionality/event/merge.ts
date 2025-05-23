import { getAuthToken, getAuthHeader } from "../../../utils/auth";

// Retry utility function to handle intermittent timing issues
const retryFetch = async (url: string, options: RequestInit, maxRetries = 3, delay = 1000) => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      
      // Verify the response has the expected structure
      if (data.eventDetails?.[0]?.customEventDetailField && 
          data.eventDetails[0].specialData &&
          data.eventDetails[0].markets?.length > 0) {
        return { response, data };
      }
      
      console.log(`Attempt ${attempt}: Response received but missing expected fields. Retrying...`);
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw new Error("All retry attempts failed: Missing expected fields in response");
      }
    } catch (error) {
      lastError = error as Error;
      console.log(`Attempt ${attempt} failed: ${error instanceof Error ? error.message : String(error)}`);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error("All retry attempts failed");
};

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
      expect(actualMarketEvent1).toBeDefined();
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
      
      const { data: eventData } = await retryFetch(
        eventUrl, 
        {
          method: 'GET',
          headers: getAuthHeader(token)
        }
      );
      
      const eventDetails = eventData.eventDetails;

      const actualMarketEvent1 = eventDetails[0].markets[0];
      expect(actualMarketEvent1).toBeDefined();
      expect(actualMarketEvent1.selections).toBeDefined();
      expect(Array.isArray(actualMarketEvent1.selections)).toBe(true);
      expect(actualMarketEvent1.selections.length).toBeGreaterThan(0);
      
      const actualHomeSelection = actualMarketEvent1.selections.find((s: { selectionNameKey: string }) => s.selectionNameKey === "key1");
      const actualAwaySelection = actualMarketEvent1.selections.find((s: { selectionNameKey: string }) => s.selectionNameKey === "key2");
      const actualInvalidSelection = actualMarketEvent1.selections.find((s: { selectionNameKey: string }) => s.selectionNameKey === "key3");
  
      // Assert
      expect(actualHomeSelection).toBeDefined();
      expect(actualAwaySelection).toBeDefined();
      expect(actualHomeSelection).toMatchObject(expectedHome);
      expect(actualAwaySelection).toMatchObject(expectedAway);
      expect(actualInvalidSelection).toBeUndefined();
    });
  });
});