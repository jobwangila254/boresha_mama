const { calculateEDD, calculateGestationalWeek, calculateRiskLevel } = require('../src/controllers/pregnancyController');

describe('Pregnancy Calculations', () => {
  describe('calculateEDD', () => {
    it('should calculate EDD as 280 days from LMP', () => {
      const edd = calculateEDD('2026-01-01');
      expect(edd).toBe('2026-10-08');
    });
  });

  describe('calculateGestationalWeek', () => {
    it('should return correct trimester for first trimester', () => {
      const result = calculateGestationalWeek(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      expect(result.trimester).toBe(1);
    });
  });

  describe('calculateRiskLevel', () => {
    it('should return high risk for previous miscarriage', () => {
      const level = calculateRiskLevel({}, ['previous_miscarriage']);
      expect(level).toBe('high');
    });

    it('should return medium risk for anemia', () => {
      const level = calculateRiskLevel({}, ['anemia']);
      expect(level).toBe('medium');
    });

    it('should return low risk for no risk factors', () => {
      const level = calculateRiskLevel({}, []);
      expect(level).toBe('low');
    });

    it('should prioritize high risk over medium', () => {
      const level = calculateRiskLevel({}, ['anemia', 'hypertension']);
      expect(level).toBe('high');
    });
  });
});
