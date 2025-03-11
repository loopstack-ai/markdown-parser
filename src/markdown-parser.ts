// src/markdown-parser.ts
import { set, get } from 'lodash';
import Ajv from 'ajv';
import { unified } from 'unified';
import remarkParse from 'remark-parse';

export interface JSONSchemaConfigType {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  items?: any;
  [key: string]: any;
}

export interface MarkdownNode {
  type: string;
  children?: MarkdownNode[];
  value?: string;
  depth?: number;
  [key: string]: any;
}

export class MarkdownParser {
  getValue(node: MarkdownNode): string {
    if (
      [
        'paragraph',
        'strong',
        'heading',
        'list',
        'listItem',
        'emphasis',
      ].includes(node.type)
    ) {
      return node.children
        ?.map((child) => this.getValue(child))
        .join(' ')
        .trim() || '';
    }

    if (['code', 'text', 'inlineCode'].includes(node.type)) {
      return node.value?.trim() || '';
    }

    throw new Error('Unexpected content type: ' + node.type);
  }

  traverseAndExtract(extracted: Record<string, any>, isArray: string[]): Record<string, any> {
    const newObject: Record<string, any> = {};
    const keys = Object.keys(extracted);

    for (const key of keys) {
      if (isArray.includes(key)) {
        newObject[key] = Object.values(extracted[key]).map((value) => {
          return this.traverseAndExtract(value as Record<string, any>, isArray);
        });
      } else if (
        typeof extracted[key] === 'object' &&
        !Array.isArray(extracted[key])
      ) {
        newObject[key] = this.traverseAndExtract(extracted[key] as Record<string, any>, isArray);
      } else {
        newObject[key] =
          typeof extracted[key] === 'string'
            ? extracted[key].trim()
            : extracted[key];
      }
    }

    return newObject;
  }

  extractObject(
    node: MarkdownNode,
    rootSchema: JSONSchemaConfigType,
    currentKey: string[] = [],
    currentSchema: JSONSchemaConfigType[] = [],
    currentDepth: number[] = [],
    isArray: string[] = [],
  ): Record<string, any> {
    const extracted: Record<string, any> = {};

    if (node.children) {
      if (node.children[0]?.type !== 'heading') {
        throw new Error('should start with a heading');
      }

      for (const child of node.children) {
        let key = currentKey[currentKey.length - 1];
        let schema = currentSchema[currentSchema.length - 1] ?? rootSchema;
        let depth = currentDepth[currentDepth.length - 1] ?? 0;

        if (child.type === 'heading') {
          if (child.depth && child.depth <= depth) {
            while (child.depth && child.depth <= depth) {
              currentKey.pop();
              currentSchema.pop();
              currentDepth.pop();
              key = currentKey[currentKey.length - 1];
              depth = currentDepth[currentDepth.length - 1];
              schema = currentSchema[currentSchema.length - 1];
            }
          }

          const newKey = child.children?.[0]?.value?.trim() || '';
          const propSchema = schema.properties?.[newKey];

          if (propSchema) {
            currentKey.push(newKey);
            currentSchema.push(propSchema);
            currentDepth.push(child.depth || 0);
            continue;
          }

          if (schema.type === 'array') {
            const itemSchema = schema.items;
            if (itemSchema && itemSchema.type === 'object') {
              isArray.push(key);
              currentKey.push(newKey);
              currentSchema.push(itemSchema);
              currentDepth.push(child.depth || 0);
              continue;
            } else {
              const current = get(extracted, currentKey) ?? [];
              current.push(this.getValue(child));
              set(extracted, currentKey, current);
              continue;
            }
          }
        }

        if (schema.type === 'array') {
          switch (child.type) {
            case 'paragraph':
            case 'code':
              const current = get(extracted, currentKey) ?? [];
              if (current.length > 0) {
                current[current.length - 1] =
                  current[current.length - 1] + '\n' + this.getValue(child);
                set(extracted, currentKey, current);
              }
              continue;
            case 'list':
              set(
                extracted,
                currentKey,
                child.children?.map((listItem: MarkdownNode) => {
                  const combined: string[] = [];
                  for (const child2 of listItem.children || []) {
                    combined.push(this.getValue(child2));
                  }

                  return combined.join('\n').trim();
                }) ?? [],
              );
              continue;
            default:
              break;
          }
        } else {
          switch (child.type) {
            case 'list':
              let currentL = get(extracted, currentKey) ?? '';
              currentL += (
                child.children?.map((listItem: MarkdownNode) => {
                  const combined: string[] = [];
                  for (const child2 of listItem.children || []) {
                    combined.push(this.getValue(child2));
                  }

                  return combined.join('\n').trim();
                }) ?? []
              ).join('\n');
              set(extracted, currentKey, currentL);
              continue;
            default:
              let current = get(extracted, currentKey) ?? '';
              current += this.getValue(child) + '\n';
              set(extracted, currentKey, current);
              continue;
          }
        }

        throw new Error(
          `Unexpected content type for section "${key}" in Markdown: ${schema.type}, ${child.type}`,
        );
      }
    }

    return this.traverseAndExtract(extracted, isArray);
  }

  validate(obj: any, schema: JSONSchemaConfigType): void {
    const ajv = new Ajv();
    const validate = ajv.compile(schema);
    if (!validate(obj)) {
      console.log(obj);
      console.log(validate.errors);
      throw new Error(`Result validation failed.`);
    }
  }

  convertSimpleMarkdownAst(nodes: any[]): any[] {
    return nodes.map(node => {
      const converted: any = { type: node.type };

      if (node.content) {
        converted.value = typeof node.content === 'string'
          ? node.content
          : this.convertSimpleMarkdownAst(node.content).map(n => n.value).join('');
      }

      if (node.items) {
        converted.children = this.convertSimpleMarkdownAst(node.items);
      }

      return converted;
    });
  }

  async parse(
    markdownContent: string,
    rootKey: string | undefined,
    schema: JSONSchemaConfigType,
  ): Promise<Record<string, any>> {
    const ast = unified()
      .use(remarkParse)
      .parse(markdownContent);

    const obj = this.extractObject(
      ast as unknown as MarkdownNode,
      schema,
      rootKey ? [rootKey] : [],
      rootKey ? [schema] : [],
      rootKey ? [0] : [],
    );

    this.validate(obj, schema);

    return obj;
  }
}

export default MarkdownParser;