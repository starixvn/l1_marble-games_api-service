describe(('Schedule'), () => {
  describe('Invalid auth token', () => {
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
  require('./time-range.test');
  require('./merge.test');
  require('./patch.test');
})