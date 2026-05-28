describe('SMS Service', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.AT_API_KEY = '';
    process.env.AT_USERNAME = '';
  });

  afterEach(() => {
    delete process.env.AT_API_KEY;
    delete process.env.AT_USERNAME;
  });

  describe('sendSms', () => {
    it('should skip sending if credentials not configured', async () => {
      const smsService = require('../src/services/smsService');
      const result = await smsService.sendSms('+254712345678', 'Test message');
      expect(result.status).toBe('skipped');
      expect(result.reason).toBe('No credentials');
    });
  });
});
