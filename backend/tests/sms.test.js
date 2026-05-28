const smsService = require('../src/services/smsService');

describe('SMS Service', () => {
  describe('sendSms', () => {
    it('should skip sending if credentials not configured', async () => {
      const result = await smsService.sendSms('+254712345678', 'Test message');
      expect(result.status).toBe('skipped');
      expect(result.reason).toBe('No credentials');
    });
  });
});
