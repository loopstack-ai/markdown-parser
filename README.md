# Loopstack Markdown Parser

A TypeScript/ESM module for parsing Markdown files according to a JSON schema structure. This parser maps structured Markdown content to JavaScript objects based on provided JSON schema definitions.

## Features

- Parse Markdown content into structured objects
- Validate extracted data against JSON schemas
- Support for nested object structures
- Handle arrays and lists in Markdown

## Installation

```bash
npm install @loopstack/markdown-parser
```

## Usage

### TypeScript

```typescript
import { MarkdownParser, SimpleJSONSchema } from '@loopstack/markdown-parser';

// Create a parser instance
const parser = new MarkdownParser();

// Define a schema for your markdown structure
const schema: SimpleJSONSchema = {
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
  const result = await parser.parse(markdown, schema);
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
import { MarkdownParser } from '@loopstack/markdown-parser';

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

#### `parse(markdownContent, schema)`

Parses markdown content according to a JSON schema and validates it against the schema.

- `markdownContent` (String): The markdown text to parse
- `schema` (SimpleJSONSchema): A JSON schema definition that describes the structure of the markdown content

Returns: A Promise that resolves to the parsed object structure.

#### `validate(object, schema)`

Validates an object against a JSON schema.

- `object` (any): The object to validate
- `schema` (SimpleJSONSchema): The JSON schema to validate against

Throws an error if validation fails.

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

## License

MIT