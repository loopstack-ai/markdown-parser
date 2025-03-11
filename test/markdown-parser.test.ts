// test/markdown-parser.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { MarkdownParser, type MarkdownNode, type JSONSchemaConfigType } from '../src/markdown-parser';

describe('MarkdownParser', () => {
  let parser: MarkdownParser;

  beforeEach(() => {
    parser = new MarkdownParser();
  });

  describe('getValue', () => {
    it('should get value from text node', () => {
      const node: MarkdownNode = { type: 'text', value: 'test text' };
      expect(parser.getValue(node)).toBe('test text');
    });

    it('should get value from paragraph node', () => {
      const node: MarkdownNode = {
        type: 'paragraph',
        children: [
          { type: 'text', value: 'test' },
          { type: 'text', value: 'paragraph' }
        ]
      };
      expect(parser.getValue(node)).toBe('test paragraph');
    });

    it('should throw error for unknown node type', () => {
      const node: MarkdownNode = { type: 'unknown' };
      expect(() => parser.getValue(node)).toThrow('Unexpected content type: unknown');
    });
  });

  describe('traverseAndExtract', () => {
    it('should handle simple objects', () => {
      const extracted = { name: 'test', value: 123 };
      expect(parser.traverseAndExtract(extracted, [])).toEqual(extracted);
    });

    it('should handle nested objects', () => {
      const extracted = {
        user: {
          name: ' John ',
          age: 30
        }
      };
      expect(parser.traverseAndExtract(extracted, [])).toEqual({
        user: {
          name: 'John',
          age: 30
        }
      });
    });

    it('should handle arrays', () => {
      const extracted = {
        users: {
          '0': { name: ' Alice ' },
          '1': { name: ' Bob ' }
        }
      };
      expect(parser.traverseAndExtract(extracted, ['users'])).toEqual({
        users: [
          { name: 'Alice' },
          { name: 'Bob' }
        ]
      });
    });
  });

  describe('parse', () => {
    it('should parse simple markdown with basic schema', async () => {
      const markdown = `# Title
This is the title content.

## Description
This is a description.
`;

      const schema: JSONSchemaConfigType = {
        type: 'object',
        properties: {
          Title: { type: 'string' },
          Description: { type: 'string' }
        },
        required: ['Title', 'Description']
      };

      const result = await parser.parse(markdown, undefined, schema);
      expect(result).toEqual({
        Title: 'This is the title content.',
        Description: 'This is a description.'
      });
    });

    it('should parse markdown with lists', async () => {
      const markdown = `# Features
- Feature 1
- Feature 2
- Feature 3
`;

      const schema: JSONSchemaConfigType = {
        type: 'object',
        properties: {
          Features: { type: 'string' }
        },
        required: ['Features']
      };

      const result = await parser.parse(markdown, undefined, schema);
      expect(result).toEqual({
        Features: 'Feature 1\nFeature 2\nFeature 3'
      });
    });

    it('should parse markdown with arrays', async () => {
      const markdown = `# Items
## Item1
First item

## Item2
Second item
`;

      const schema: JSONSchemaConfigType = {
        type: 'object',
        properties: {
          Items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                Item1: { type: 'string' },
                Item2: { type: 'string' }
              }
            }
          }
        }
      };

      const result = await parser.parse(markdown, undefined, schema);
      expect(result).toEqual({
        Items: [
          {
            Item1: 'First item',
            Item2: 'Second item'
          }
        ]
      });
    });

    it('should validate extracted object against schema', async () => {
      const markdown = `# Title
Content
`;

      const schema: JSONSchemaConfigType = {
        type: 'object',
        properties: {
          Title: { type: 'string' },
          Required: { type: 'string' }
        },
        required: ['Required']
      };

      await expect(parser.parse(markdown, undefined, schema)).rejects.toThrow('Result validation failed');
    });
  });
});