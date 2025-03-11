# Markdown Schema Parser

A modern TypeScript/ESM module for parsing Markdown files according to a JSON schema structure. This parser maps structured Markdown content to JavaScript objects based on provided JSON schema definitions.

## Features

- Parse Markdown content into structured objects
- Validate extracted data against JSON schemas
- Support for nested object structures
- Handle arrays and lists in Markdown
- TypeScript support with full type definitions
- Simple and intuitive API

## Installation

```bash
npm install markdown-schema-parser
```

## Usage

### TypeScript

```typescript
import { MarkdownParser, JSONSchemaConfigType } from 'markdown-schema-parser';

// Create a parser instance
const parser = new MarkdownParser();

// Define a schema for your markdown structure
const schema: JSONSchemaConfigType = {
  type: 'object',
  properties: {
    Title: { type: 'string' },
    Description: { type: 'string' },
    Features: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          Name: { type: 'string' },
          Details: { type: 'string' }
        }
      }
    }
  },
  required: ['Title']
};

// Markdown content to parse
const markdown = `# Title
This is a product description.

# Description
More detailed information about the product.

# Features
## Name
Feature 1

## Details
This is an amazing feature.

## Name
Feature 2

## Details
Another great feature.
`;

// Parse the markdown content
async function parseMarkdown() {
  const result = await parser.parse(markdown, undefined, schema);
  console.log(result);
}

parseMarkdown();
/* Output:
{
  Title: 'This is a product description.',
  Description: 'More detailed information about the product.',
  Features: [
    {
      Name: 'Feature 1',
      Details: 'This is an amazing feature.'
    },
    {
      Name: 'Feature 2',
      Details: 'Another great feature.'
    }
  ]
}
*/
```

### JavaScript

```javascript
import { MarkdownParser } from 'markdown-schema-parser';

// Create a parser instance
const parser = new MarkdownParser();

// Define a schema for your markdown structure
const schema = {
  type: 'object',
  properties: {
    Title: { type: 'string' },
    Description: { type: 'string' }
  },
  required: ['Title']
};

// Parse the markdown content
const result = await parser.parse(markdown, undefined, schema);
```

## API

### `MarkdownParser` Class

#### `parse(markdownContent, rootKey, schema)`

Parses markdown content according to a JSON schema.

- `markdownContent` (String): The markdown text to parse
- `rootKey` (String, optional): A root key to use for the resulting object
- `schema` (JSONSchemaConfigType): A JSON schema definition that describes the structure of the markdown content

Returns: A Promise that resolves to the parsed object structure.

#### `validate(object, schema)`

Validates an object against a JSON schema.

- `object` (any): The object to validate
- `schema` (JSONSchemaConfigType): The JSON schema to validate against

Throws an error if validation fails.

### Types

#### `JSONSchemaConfigType`

Represents a JSON Schema configuration.

```typescript
interface JSONSchemaConfigType {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  items?: any;
  [key: string]: any;
}
```

#### `MarkdownNode`

Represents a node in the Markdown AST.

```typescript
interface MarkdownNode {
  type: string;
  children?: MarkdownNode[];
  value?: string;
  depth?: number;
  [key: string]: any;
}
```

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### Coverage

```bash
npm run test:coverage
```

## License

MIT