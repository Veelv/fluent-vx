// Schema type definitions

export type SchemaType = 'string' | 'number' | 'boolean' | 'object' | 'array';

export interface Schema {
  type: SchemaType;
  required?: boolean;
  properties?: Record<string, Schema>;
  items?: Schema;
  validate?: (value: any) => boolean;
}