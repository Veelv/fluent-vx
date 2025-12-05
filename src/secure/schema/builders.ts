// Schema builder helper functions

import { Schema } from './types';

// Helper functions to create schemas
export function stringSchema(required = false): Schema {
  return { type: 'string', required };
}

export function numberSchema(required = false): Schema {
  return { type: 'number', required };
}

export function booleanSchema(required = false): Schema {
  return { type: 'boolean', required };
}

export function objectSchema(properties: Record<string, Schema>, required = false): Schema {
  return { type: 'object', properties, required };
}

export function arraySchema(items: Schema, required = false): Schema {
  return { type: 'array', items, required };
}

export function customSchema(validate: (value: any) => boolean, required = false): Schema {
  return { type: 'string', validate, required }; // Type doesn't matter for custom
}