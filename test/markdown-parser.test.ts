// test/markdown-parser.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { MarkdownParser, SimpleJSONSchema } from '../src/markdown-parser';

describe('MarkdownParser', () => {
  let parser: MarkdownParser;

  beforeEach(() => {
    parser = new MarkdownParser();
  });

  describe('parseToObject', () => {
    it('should parse simple markdown', async () => {
      const markdown = `# Document

## Title
This is the title content.

## Description
This is a description.
`;

      const schema: SimpleJSONSchema = {
        type: 'object',
        properties: {
          Document: {
            type: 'object',
            properties: {
              Title: { type: 'string' },
              Description: { type: 'string' }
            },
            required: ['Title', 'Description']
          },
        },
        required: ['Document']
      };

      const result = await parser.parseToObject(markdown, schema);
      expect(result).toEqual({
        Document: {
          Title: 'This is the title content.',
          Description: 'This is a description.'
        }
      });
    });

    it('should parse paragraph markdown', async () => {
      const markdown = `# Document
## Description
This is a description
that spans

over multiple paragraphs.
`;

      const schema: SimpleJSONSchema = {
        type: 'object',
        properties: {
          Document: {
            type: 'object',
            properties: {
              Description: { type: 'string' }
            },
            required: ['Description']
          },
        },
        required: ['Document']
      };

      const result = await parser.parseToObject(markdown, schema);
      expect(result).toEqual({
        Document: {
          Description: 'This is a description\nthat spans\n\nover multiple paragraphs.'
        }
      });
    });

    it('should parse strong markdown', async () => {
      const markdown = `# Document
## Description
This is a description **with bold** and __more bold__ and _italic_ contents as well as **bold and _italic_ combined**. It even *emphasis* stuff.
`;

      const schema: SimpleJSONSchema = {
        type: 'object',
        properties: {
          Document: {
            type: 'object',
            properties: {
              Description: { type: 'string' }
            },
            required: ['Description']
          },
        },
        required: ['Document']
      };

      const result = await parser.parseToObject(markdown, schema);
      expect(result).toEqual({
        Document: {
          Description: 'This is a description with bold and more bold and italic contents as well as bold and italic combined. It even emphasis stuff.'
        }
      });
    });

    it('should handle inline code markdown', async () => {
      const markdown = `# Document
## Description
This is description with \`code\`
`;

      const schema: SimpleJSONSchema = {
        type: 'object',
        properties: {
          Document: {
            type: 'object',
            properties: {
              Description: { type: 'string' }
            },
            required: ['Description']
          },
        },
        required: ['Document']
      };

      const result = await parser.parseToObject(markdown, schema);
      expect(result).toEqual({
        Document: {
          Description: 'This is description with code'
        }
      });
    });

    it('should handle list markdown', async () => {
      const markdown = `# Document
## Description
This is description with

- multiple
- items
- in a list

## OrderedList
1. one
2. two
3. three
`;

      const schema: SimpleJSONSchema = {
        type: 'object',
        properties: {
          Document: {
            type: 'object',
            properties: {
              Description: { type: 'string' },
              OrderedList: { type: 'string' },
            },
            required: ['Description']
          },
        },
        required: ['Document']
      };

      const result = await parser.parseToObject(markdown, schema);
      expect(result).toEqual({
        Document: {
          Description: 'This is description with\n\n- multiple\n- items\n- in a list\n',
          OrderedList: '1. one\n2. two\n3. three\n',
        }
      });
    });

    it('should handle list markdown for array schema type', async () => {
      const markdown = `# Document

## OrderedList
1. one
2. two
3. three
`;

      const schema: SimpleJSONSchema = {
        type: 'object',
        properties: {
          Document: {
            type: 'object',
            properties: {
              OrderedList: {
                type: 'array',
                items: {
                  type: 'string',
                }
              },
            },
            required: ['OrderedList']
          },
        },
        required: ['Document']
      };

      const result = await parser.parseToObject(markdown, schema);
      expect(result).toEqual({
        Document: {
          OrderedList: ['one', 'two', 'three'],
        }
      });
    });

    it('should parse nested markdown', async () => {
      const markdown = `# Document

## Name
This is the name

## Details

### Title
This is the title

### Description
This is the description

## Info
Some info
`;

      const schema: SimpleJSONSchema = {
        type: 'object',
        properties: {
          Document: {
            type: 'object',
            properties: {
              Name: { type: 'string' },
              Details: {
                type: 'object',
                properties: {
                  Title: { type: 'string' },
                  Description: { type: 'string' }
                },
                required: ['Title', 'Description'],
              },
              Info: { type: 'string' },
            },
            required: ['Details', 'Info', 'Name']
          },
        },
        required: ['Document']
      };

      const result = await parser.parseToObject(markdown, schema);
      expect(result).toEqual({
        Document: {
          Name: 'This is the name',
          Details: {
            Title: 'This is the title',
            Description: 'This is the description',
          },
          Info: 'Some info'
        }
      });
    });

    it('should handle array of objects', async () => {
      const markdown = `# Document

## ArrayOfObjects

### Item 1

#### Name
one

### Item 2

#### Name
two

### Item 3

#### Name
three
`;

      const schema: SimpleJSONSchema = {
        type: 'object',
        properties: {
          Document: {
            type: 'object',
            properties: {
              ArrayOfObjects: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    Name: {
                      type: 'string',
                    }
                  },
                  required: ['Name'],
                }
              },
            },
            required: ['ArrayOfObjects']
          },
        },
        required: ['Document']
      };

      const result = await parser.parseToObject(markdown, schema);
      expect(result).toEqual({
        Document: {
          ArrayOfObjects: {
            'Item 1': {
              Name: 'one',
            },
            'Item 2': {
              Name: 'two',
            },
            'Item 3': {
              Name: 'three'
            },
          },
        }
      });
    });

    it('should handle array of text', async () => {
      const markdown = `# Document

## ArrayOfText

### Item 1
one

### Item 2
two

### Item 3
three
`;

      const schema: SimpleJSONSchema = {
        type: 'object',
        properties: {
          Document: {
            type: 'object',
            properties: {
              ArrayOfText: {
                type: 'array',
                items: {
                  type: 'string',
                }
              },
            },
            required: ['ArrayOfText']
          },
        },
        required: ['Document']
      };

      const result = await parser.parseToObject(markdown, schema);
      expect(result).toEqual({
        Document: {
          ArrayOfText: {
            'Item 1': 'one',
            'Item 2': 'two',
            'Item 3': 'three',
          },
        }
      });
    });

  });

  describe('reformatToMatchSchema', () => {
    it('should reformat an array of objects', async () => {
      const schema: SimpleJSONSchema = {
        type: 'object',
        properties: {
          Document: {
            type: 'object',
            properties: {
              ArrayOfObjects: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    Name: {
                      type: 'string',
                    }
                  },
                  required: ['Name'],
                }
              },
            },
            required: ['ArrayOfObjects']
          },
        },
        required: ['Document']
      };

      const obj = {
        Document: {
          ArrayOfObjects: {
            'Item 1': {
              Name: 'one',
            },
            'Item 2': {
              Name: 'two',
            },
            'Item 3': {
              Name: 'three'
            },
          },
        }
      };

      const result = parser.reformatToMatchSchema(obj, schema);

      expect(result).toEqual({
        Document: {
          ArrayOfObjects: [
            {
              Name: 'one',
            },
            {
              Name: 'two',
            },
            {
              Name: 'three'
            },
          ],
        }
      });
    });

    it('should reformat an array of text', async () => {
      const schema: SimpleJSONSchema = {
        type: 'object',
        properties: {
          Document: {
            type: 'object',
            properties: {
              ArrayOfText: {
                type: 'array',
                items: {
                  type: 'string',
                }
              },
            },
            required: ['ArrayOfText']
          },
        },
        required: ['Document']
      };

      const obj = {
        Document: {
          ArrayOfText: {
            'Item 1': 'one',
            'Item 2': 'two',
            'Item 3': 'three'
          },
        }
      };

      const result = parser.reformatToMatchSchema(obj, schema);

      expect(result).toEqual({
        Document: {
          ArrayOfText: ['one', 'two', 'three'],
        }
      });
    });
  });

  describe('parse', () => {
    it('should parse the readme example correctly', async () => {
      const markdown = `# Title
This is a product description.

# Description
More detailed information about the product.

# Features

## Feature 1

### Name
Feature 1

### Details
This is an amazing feature.

## Feature 2

### Name
Feature 2

### Details
Another great feature.`;

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

      const result = parser.parse(markdown, schema);

      expect(result).toEqual({
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
      });

    });

  });
});