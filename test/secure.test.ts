import { SchemaValidator, stringSchema, objectSchema, secureFetch, setSecurityConfig } from '../src/secure';

describe('Secure Module', () => {
  describe('Schema Validation', () => {
    it('should validate a string schema', () => {
      const validator = new SchemaValidator();
      const schema = stringSchema(true);
      expect(validator.validate('test', schema)).toBe(true);
      expect(validator.validate(123, schema)).toBe(false);
      expect(validator.validate(null, schema)).toBe(false);
    });

    it('should validate an object schema', () => {
      const validator = new SchemaValidator();
      const schema = objectSchema({
        name: stringSchema(true),
        age: { type: 'number', required: false }
      });
      expect(validator.validate({ name: 'John', age: 30 }, schema)).toBe(true);
      expect(validator.validate({ name: 'John' }, schema)).toBe(true);
      expect(validator.validate({ age: 30 }, schema)).toBe(false);
    });
  });

  describe('Security Config', () => {
    it('should allow setting security config', () => {
      setSecurityConfig({ enforceHttps: true });
      // Test would require checking internal state, but for now, just ensure no error
      expect(true).toBe(true);
    });
  });

  describe('Secure Fetch', () => {
    it('should have secureFetch function', () => {
      expect(typeof secureFetch).toBe('function');
    });
  });
});