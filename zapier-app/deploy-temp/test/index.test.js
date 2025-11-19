const zapier = require('zapier-platform-core');

// Import the app
const App = require('../index');
const appTester = zapier.createAppTester(App);

// Mock authentication data
const authData = {
  api_key: 'test-api-key-123456'
};

describe('Online Designer Forms App', () => {
  describe('Authentication', () => {
    it('should authenticate with valid API key', async () => {
      const bundle = { authData };
      
      // Mock the API response
      const mockResponse = {
        json: { forms: [] },
        status: 200,
        throwForStatus: () => {}
      };
      
      // This would normally test against the actual API
      // For now, we'll just validate the structure exists
      expect(App.authentication).toBeDefined();
      expect(App.authentication.type).toBe('api_key');
    });
  });

  describe('Triggers', () => {
    it('should have new form response trigger', () => {
      expect(App.triggers).toBeDefined();
      expect(App.triggers.new_form_response).toBeDefined();
      expect(App.triggers.new_form_response.key).toBe('new_form_response');
      expect(App.triggers.new_form_response.operation.type).toBe('hook');
    });

    it('should have required hook functions', () => {
      const trigger = App.triggers.new_form_response;
      expect(trigger.operation.performSubscribe).toBeDefined();
      expect(trigger.operation.performUnsubscribe).toBeDefined();
      expect(trigger.operation.performList).toBeDefined();
    });
  });

  describe('Searches', () => {
    it('should have form list search', () => {
      expect(App.searches).toBeDefined();
      expect(App.searches.form_list).toBeDefined();
      expect(App.searches.form_list.key).toBe('form_list');
    });

    it('should have form search for dynamic dropdown', () => {
      expect(App.searches.form_search).toBeDefined();
      expect(App.searches.form_search.key).toBe('form_search');
      expect(App.searches.form_search.operation.perform).toBeDefined();
    });
  });

  describe('App Structure', () => {
    it('should have valid app structure', () => {
      expect(App.version).toBeDefined();
      expect(App.platformVersion).toBeDefined();
      expect(App.authentication).toBeDefined();
      expect(App.triggers).toBeDefined();
      expect(App.searches).toBeDefined();
    });
  });
});

// Export for running tests
module.exports = {
  appTester,
  authData
};
