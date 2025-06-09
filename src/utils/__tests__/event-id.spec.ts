import { createEventId, extractGameId, extractRoundId } from '../event-id';

describe('event-id utility functions', () => {
  describe('createEventId', () => {
    it('should create event ID with valid gameId and roundId', () => {
      const gameId = 123;
      const roundId = 456;
      const eventId = createEventId(gameId, roundId);
      
      // Test that it returns a number and the round-trip works
      expect(typeof eventId).toBe('number');
      expect(extractGameId(eventId)).toBe(gameId);
      expect(extractRoundId(eventId)).toBe(roundId);
    });

    it('should create event ID with minimum values', () => {
      const gameId = 0;
      const roundId = 0;
      const eventId = createEventId(gameId, roundId);
      
      expect(eventId).toBe(0);
    });

    it('should create event ID with maximum valid gameId', () => {
      const gameId = 65535; // 2^16 - 1
      const roundId = 1000;
      const eventId = createEventId(gameId, roundId);
      
      expect(extractGameId(eventId)).toBe(gameId);
      expect(extractRoundId(eventId)).toBe(roundId);
    });

    it('should create event ID with maximum valid roundId', () => {
      const gameId = 100;
      const roundId = 4294967295; // 2^32 - 1
      const eventId = createEventId(gameId, roundId);
      
      expect(extractGameId(eventId)).toBe(gameId);
      expect(extractRoundId(eventId)).toBe(roundId);
    });

    it('should throw error when gameId is out of range', () => {
      const gameId = 65536; // 2^16
      const roundId = 100;
      
      expect(() => createEventId(gameId, roundId)).toThrow('gameId out of range');
    });

    it('should throw error when roundId is out of range', () => {
      const gameId = 100;
      const roundId = 4294967296; // 2^32
      
      expect(() => createEventId(gameId, roundId)).toThrow('roundId out of range');
    });

    it('should handle negative gameId (JavaScript behavior)', () => {
      const gameId = -1;
      const roundId = 100;
      
      // Negative numbers in JavaScript don't trigger the >= check
      // The function will still work, but may produce unexpected results
      expect(() => createEventId(gameId, roundId)).not.toThrow();
    });

    it('should handle negative roundId (JavaScript behavior)', () => {
      const gameId = 100;
      const roundId = -1;
      
      // Negative numbers in JavaScript don't trigger the >= check
      expect(() => createEventId(gameId, roundId)).not.toThrow();
    });
  });

  describe('extractGameId', () => {
    it('should extract gameId from event ID', () => {
      const originalGameId = 123;
      const originalRoundId = 456;
      const eventId = createEventId(originalGameId, originalRoundId);
      const gameId = extractGameId(eventId);
      
      expect(gameId).toBe(originalGameId);
    });

    it('should extract gameId from event ID with zero roundId', () => {
      const originalGameId = 123;
      const originalRoundId = 0;
      const eventId = createEventId(originalGameId, originalRoundId);
      const gameId = extractGameId(eventId);
      
      expect(gameId).toBe(originalGameId);
    });

    it('should extract gameId from event ID with zero gameId', () => {
      const originalGameId = 0;
      const originalRoundId = 456;
      const eventId = createEventId(originalGameId, originalRoundId);
      const gameId = extractGameId(eventId);
      
      expect(gameId).toBe(originalGameId);
    });

    it('should extract gameId from zero event ID', () => {
      const eventId = 0;
      const gameId = extractGameId(eventId);
      
      expect(gameId).toBe(0);
    });
  });

  describe('extractRoundId', () => {
    it('should extract roundId from event ID', () => {
      const originalGameId = 123;
      const originalRoundId = 456;
      const eventId = createEventId(originalGameId, originalRoundId);
      const roundId = extractRoundId(eventId);
      
      expect(roundId).toBe(originalRoundId);
    });

    it('should extract roundId from event ID with zero gameId', () => {
      const originalGameId = 0;
      const originalRoundId = 456;
      const eventId = createEventId(originalGameId, originalRoundId);
      const roundId = extractRoundId(eventId);
      
      expect(roundId).toBe(originalRoundId);
    });

    it('should extract roundId from event ID with zero roundId', () => {
      const originalGameId = 123;
      const originalRoundId = 0;
      const eventId = createEventId(originalGameId, originalRoundId);
      const roundId = extractRoundId(eventId);
      
      expect(roundId).toBe(originalRoundId);
    });

    it('should extract roundId from zero event ID', () => {
      const eventId = 0;
      const roundId = extractRoundId(eventId);
      
      expect(roundId).toBe(0);
    });
  });

  describe('round-trip functionality', () => {
    it('should maintain data integrity through create and extract operations', () => {
      const originalGameId = 12345;
      const originalRoundId = 98765;
      
      const eventId = createEventId(originalGameId, originalRoundId);
      const extractedGameId = extractGameId(eventId);
      const extractedRoundId = extractRoundId(eventId);
      
      expect(extractedGameId).toBe(originalGameId);
      expect(extractedRoundId).toBe(originalRoundId);
    });

    it('should work with edge case values', () => {
      const testCases = [
        { gameId: 0, roundId: 0 },
        { gameId: 65535, roundId: 4294967295 },
        { gameId: 1, roundId: 1 },
        { gameId: 32767, roundId: 2147483647 },
      ];

      testCases.forEach(({ gameId, roundId }) => {
        const eventId = createEventId(gameId, roundId);
        const extractedGameId = extractGameId(eventId);
        const extractedRoundId = extractRoundId(eventId);
        
        expect(extractedGameId).toBe(gameId);
        expect(extractedRoundId).toBe(roundId);
      });
    });
  });

  describe('bit manipulation edge cases', () => {
    it('should handle maximum values correctly', () => {
      const maxGameId = 65535; // 2^16 - 1
      const maxRoundId = 4294967295; // 2^32 - 1
      
      const eventId = createEventId(maxGameId, maxRoundId);
      
      expect(extractGameId(eventId)).toBe(maxGameId);
      expect(extractRoundId(eventId)).toBe(maxRoundId);
    });

    it('should handle bit boundaries correctly', () => {
      // Test powers of 2 to ensure bit manipulation is correct
      const testCases = [
        { gameId: 1, roundId: 1 },
        { gameId: 2, roundId: 2 },
        { gameId: 4, roundId: 4 },
        { gameId: 256, roundId: 256 },
        { gameId: 1024, roundId: 1024 },
      ];

      testCases.forEach(({ gameId, roundId }) => {
        const eventId = createEventId(gameId, roundId);
        expect(extractGameId(eventId)).toBe(gameId);
        expect(extractRoundId(eventId)).toBe(roundId);
      });
    });

    it('should handle specific bit patterns', () => {
      // Test specific patterns that might reveal bit manipulation issues
      const testCases = [
        { gameId: 255, roundId: 255 },      // 8-bit boundaries
        { gameId: 1023, roundId: 1023 },    // 10-bit boundaries  
        { gameId: 4095, roundId: 4095 },    // 12-bit boundaries
        { gameId: 16383, roundId: 16383 },  // 14-bit boundaries
      ];

      testCases.forEach(({ gameId, roundId }) => {
        const eventId = createEventId(gameId, roundId);
        expect(extractGameId(eventId)).toBe(gameId);
        expect(extractRoundId(eventId)).toBe(roundId);
      });
    });
  });
});
