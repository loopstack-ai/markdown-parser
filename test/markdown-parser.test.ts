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
          document: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' }
            },
            required: ['title', 'description']
          },
        },
        required: ['document']
      };

      const result = await parser.parseToObject(markdown, schema);
      expect(result).toEqual({
        document: {
          title: 'This is the title content.',
          description: 'This is a description.'
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
          document: {
            type: 'object',
            properties: {
              description: { type: 'string' }
            },
            required: ['description']
          },
        },
        required: ['document']
      };

      const result = await parser.parseToObject(markdown, schema);
      expect(result).toEqual({
        document: {
          description: 'This is a description\nthat spans\n\nover multiple paragraphs.'
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
          document: {
            type: 'object',
            properties: {
              description: { type: 'string' }
            },
            required: ['description']
          },
        },
        required: ['document']
      };

      const result = await parser.parseToObject(markdown, schema);
      expect(result).toEqual({
        document: {
          description: 'This is a description with bold and more bold and italic contents as well as bold and italic combined. It even emphasis stuff.'
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
          document: {
            type: 'object',
            properties: {
              description: { type: 'string' }
            },
            required: ['description']
          },
        },
        required: ['document']
      };

      const result = await parser.parseToObject(markdown, schema);
      expect(result).toEqual({
        document: {
          description: 'This is description with code'
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
          document: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              orderedList: { type: 'string' },
            },
            required: ['description']
          },
        },
        required: ['document']
      };

      const result = await parser.parseToObject(markdown, schema);
      expect(result).toEqual({
        document: {
          description: 'This is description with\n\n- multiple\n- items\n- in a list\n',
          orderedList: '1. one\n2. two\n3. three\n',
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
          document: {
            type: 'object',
            properties: {
              orderedList: {
                type: 'array',
                items: {
                  type: 'string',
                }
              },
            },
            required: ['orderedList']
          },
        },
        required: ['document']
      };

      const result = await parser.parseToObject(markdown, schema);
      expect(result).toEqual({
        document: {
          orderedList: ['one', 'two', 'three'],
        }
      });
    });

    it('should handle optional (null) values', async () => {
      const markdown = `# Document

## Description

## Title
This is the title content.
`;

      const schema: SimpleJSONSchema = {
        type: 'object',
        properties: {
          document: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: ['string', 'null'] }
            },
            required: ['title']
          },
        },
        required: ['document']
      };

      const result = await parser.parseToObject(markdown, schema);
      expect(result).toEqual({
        document: {
          title: 'This is the title content.',
          description: null
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
          document: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              details: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' }
                },
                required: ['title', 'description'],
              },
              info: { type: 'string' },
            },
            required: ['details', 'info', 'name']
          },
        },
        required: ['document']
      };

      const result = await parser.parseToObject(markdown, schema);
      expect(result).toEqual({
        document: {
          name: 'This is the name',
          details: {
            title: 'This is the title',
            description: 'This is the description',
          },
          info: 'Some info'
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
          document: {
            type: 'object',
            properties: {
              arrayOfObjects: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                    }
                  },
                  required: ['Name'],
                }
              },
            },
            required: ['arrayOfObjects']
          },
        },
        required: ['document']
      };

      const result = await parser.parseToObject(markdown, schema);
      expect(result).toEqual({
        document: {
          arrayOfObjects: {
            'item 1': {
              name: 'one',
            },
            'item 2': {
              name: 'two',
            },
            'item 3': {
              name: 'three'
            },
          },
        }
      });
    });

    it('should handle optional (null) values for array types', async () => {
      const markdown = `# Document

## ArrayOfObjects

## SomethingElse
text
`;

      const schema: SimpleJSONSchema = {
        type: 'object',
        properties: {
          document: {
            type: 'object',
            properties: {
              arrayOfObjects: {
                type: ['array', 'null'],
                items: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                    }
                  },
                  required: ['Name'],
                }
              },
              somethingElse: {
                type: 'string',
              },
            },
            required: ['arrayOfObjects']
          },
        },
        required: ['document']
      };

      const result = await parser.parseToObject(markdown, schema);
      expect(result).toEqual({
        document: {
          arrayOfObjects: null,
          somethingElse: 'text',
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
          document: {
            type: 'object',
            properties: {
              arrayOfText: {
                type: 'array',
                items: {
                  type: 'string',
                }
              },
            },
            required: ['arrayOfText']
          },
        },
        required: ['document']
      };

      const result = await parser.parseToObject(markdown, schema);
      expect(result).toEqual({
        document: {
          arrayOfText: {
            'item 1': 'one',
            'item 2': 'two',
            'item 3': 'three',
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
          document: {
            type: 'object',
            properties: {
              arrayOfObjects: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                    }
                  },
                  required: ['name'],
                }
              },
            },
            required: ['arrayOfObjects']
          },
        },
        required: ['document']
      };

      const obj = {
        document: {
          arrayOfObjects: {
            'Item 1': {
              name: 'one',
            },
            'Item 2': {
              name: 'two',
            },
            'Item 3': {
              name: 'three'
            },
          },
        }
      };

      const result = parser.reformatToMatchSchema(obj, schema);

      expect(result).toEqual({
        document: {
          arrayOfObjects: [
            {
              name: 'one',
            },
            {
              name: 'two',
            },
            {
              name: 'three'
            },
          ],
        }
      });
    });

    it('should reformat an array of text', async () => {
      const schema: SimpleJSONSchema = {
        type: 'object',
        properties: {
          document: {
            type: 'object',
            properties: {
              arrayOfText: {
                type: 'array',
                items: {
                  type: 'string',
                }
              },
            },
            required: ['arrayOfText']
          },
        },
        required: ['document']
      };

      const obj = {
        document: {
          arrayOfText: {
            'Item 1': 'one',
            'Item 2': 'two',
            'Item 3': 'three'
          },
        }
      };

      const result = parser.reformatToMatchSchema(obj, schema);

      expect(result).toEqual({
        document: {
          arrayOfText: ['one', 'two', 'three'],
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
          title: { type: 'string' },
          description: { type: 'string' },
          features: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                details: { type: 'string' }
              }
            }
          }
        },
        required: ['title']
      };

      const result = parser.parse(markdown, schema);

      expect(result).toEqual({
        title: 'This is a product description.',
        description: 'More detailed information about the product.',
        features: [
          {
            name: 'Feature 1',
            details: 'This is an amazing feature.'
          },
          {
            name: 'Feature 2',
            details: 'Another great feature.'
          }
        ]
      });

    });


    it('should parse and validate optional (null) values', async () => {
      const markdown = `# Document

## Description

## Title
This is the title content.
`;

      const schema: SimpleJSONSchema = {
        type: 'object',
        properties: {
          document: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: ['string', 'null'] }
            },
            required: ['title']
          },
        },
        required: ['document']
      };

      const result = parser.parse(markdown, schema);

      expect(result).toEqual({
        document: {
          title: 'This is the title content.',
          description: null
        }
      });
    });


    it('should parse and validate optional (null) values for array types', async () => {
      const markdown = `# Document

## ArrayOfObjects

## SomethingElse
test
`;

      const schema: SimpleJSONSchema = {
        type: 'object',
        properties: {
          document: {
            type: 'object',
            properties: {
              arrayOfObjects: {
                type: ['array', 'null'],
                items: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                    }
                  },
                  required: ['Name'],
                }
              },
              somethingElse: {
                type: 'string'
              },
            },
            required: ['arrayOfObjects']
          },
        },
        required: ['document']
      };

      const result = parser.parse(markdown, schema);
      expect(result).toEqual({
        document: {
          arrayOfObjects: null,
          somethingElse: 'test',
        }
      });
    });

  });
});