// Schema validation logic

import { Schema, SchemaType } from './types';

export class SchemaValidator {
  validate(data: any, schema: Schema): boolean {
    return this.validateValue(data, schema);
  }

  private validateValue(value: any, schema: Schema): boolean {
    if (value == null) {
      return !schema.required;
    }

    switch (schema.type) {
      case 'string':
        return this.validateString(value);
      case 'number':
        return this.validateNumber(value);
      case 'boolean':
        return this.validateBoolean(value);
      case 'object':
        return this.validateObject(value, schema);
      case 'array':
        return this.validateArray(value, schema);
      default:
        return schema.validate ? schema.validate(value) : true;
    }
  }

  private validateString(value: any): boolean {
    return typeof value === 'string';
  }

  private validateNumber(value: any): boolean {
    return typeof value === 'number' && !isNaN(value);
  }

  private validateBoolean(value: any): boolean {
    return typeof value === 'boolean';
  }

  private validateObject(obj: any, schema: Schema): boolean {
    if (typeof obj !== 'object' || obj === null) return false;

    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (!this.validateValue(obj[key], propSchema)) {
          return false;
        }
      }
    }

    return true;
  }

  private validateArray(arr: any, schema: Schema): boolean {
    if (!Array.isArray(arr)) return false;

    if (schema.items) {
      for (const item of arr) {
        if (!this.validateValue(item, schema.items)) {
          return false;
        }
      }
    }

    return true;
  }
}