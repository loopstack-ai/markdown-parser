import { set, get } from 'lodash';
import Ajv from 'ajv';
import { Heading, List, ListItem, Literal, Node, Parent, Root } from 'mdast';
import remark from './utils/remark-wrapper';

export interface SimpleJSONSchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  items?: any;
}

class ContextDto {
  tree: {
    path: string;
    schema: SimpleJSONSchema;
    depth: number;
  }[];

  result: Record<string, any>;

  constructor(schema: SimpleJSONSchema) {
    this.tree = [
      {
        path: 'root',
        schema: schema,
        depth: 0,
      },
    ];

    this.result = {};
  }

  getCurrentContext() {
    return this.tree[this.tree.length - 1];
  }

  getCurrentDepth() {
    return this.getCurrentContext().depth;
  }

  getCurrentSchema() {
    return this.getCurrentContext().schema;
  }

  getPropertySchema(name: string) {
    return this.getCurrentSchema()?.properties?.[name];
  }

  getArrayItemSchema() {
    return this.getCurrentSchema().items;
  }

  getPropertyPath() {
    // exclude the root key
    return this.tree.slice(1).map((item) => item.path);
  }

  addValue(value: string[] | string) {
    const path = this.getPropertyPath();
    const current = get(this.result, path);

    let newValue: any;
    if (Array.isArray(value)) {
      newValue = null === current ? value : [...current, ...value];
    } else {
      newValue = null === current ? value : `${current}\n\n${value}`;
    }
    set(this.result, path, newValue);
  }

  addProperty(path: string, depth: number, schema: SimpleJSONSchema) {
    this.tree.push({
      path,
      depth,
      schema,
    });

    const objectPath = this.getPropertyPath();
    set(this.result, objectPath, null);
  }

  goLevelUp() {
    this.tree.pop();
  }
}

export class MarkdownParser {
  private parseList(node: List): string[] {
    return node.children.map((item, index) => this.parseArrayItemType(item));
  }

  private parseChildValue(node: Parent): string {
    return node.children
      .map((item, index) => this.parseStringType(item, index, node))
      .join('');
  }

  private parseLiteralValue(node: Literal): string {
    return node.value;
  }

  private parseArrayItemType(node: Node): string {
    switch (node.type) {
      case 'listItem':
        return this.parseChildValue(node as ListItem);
    }

    throw new Error('Unexpected array item type: ' + node.type);
  }

  private parseValue<T>(node: Node, type: string): T {
    switch (type) {
      case 'array':
        return this.parseArrayType(node) as T;
      case 'string':
        return this.parseStringType(node) as T;
      case 'number':
        return Number(this.parseStringType(node)) as T;
      case 'boolean':
        return ('true' === this.parseStringType(node).toLowerCase()) as T;
      case 'null':
        return null as T;
    }

    throw new Error(`Unknown schema type ${type}`);
  }

  private parseArrayType(node: Node): string[] {
    switch (node.type) {
      case 'list':
        return this.parseList(node as List);
    }

    throw new Error('Unexpected array type: ' + node.type);
  }

  private parseStringType(
    node: Node,
    index: number = 0,
    parent?: Parent,
  ): string {
    switch (node.type) {
      case 'text':
      case 'inlineCode':
      case 'code':
      case 'html':
      case 'yaml':
        return this.parseLiteralValue(node as Literal);
      case 'paragraph':
      case 'strong':
      case 'italic':
      case 'emphasis':
      case 'footnote':
      case 'footnoteDefinition':
      case 'link':
      case 'linkReference':
      case 'list':
        return this.parseChildValue(node as Parent);
      case 'delete':
      case 'thematicBreak':
        return '';
      case 'break':
        return '\n';
      case 'listItem':
        const parentNode = parent as List;
        const prefix = parentNode.ordered ? (index + 1).toString() + '.' : '-';
        return `${prefix} ${this.parseChildValue(node as ListItem)}\n`;
    }

    throw new Error('Unexpected content type: ' + node.type);
  }

  lowerCaseFirst (str: string) {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  private reduceAstToObject(node: Root, context: ContextDto) {
    const children = [...node.children];
    while (children.length) {
      const item = children.shift()!;

      switch (item.type) {
        case 'heading':
          // reduce current depth until at item level
          while (item.depth <= context.getCurrentDepth()) {
            context.goLevelUp();
          }

          // get the heading name as property name
          // make sure its lower case first
          const propertyName =
            this.lowerCaseFirst(this.parseChildValue(item as Heading) ?? 'Object');

          // try to get the schema from property definition
          const propertySchema = context.getPropertySchema(propertyName);
          if (propertySchema) {
            context.addProperty(propertyName, item.depth, propertySchema);
            continue;
          }

          // try to get the schema from array items definition
          const itemSchema = context.getArrayItemSchema();
          if (itemSchema) {
            context.addProperty(propertyName, item.depth, itemSchema);
            continue;
          }

          throw new Error(`Heading element ${propertyName} has no schema definition.`);
        default:
          // other elements that are not structural (headings) will be parsed and merged to current object path
          const value = this.parseValue<any>(
            item,
            context.getCurrentSchema().type,
          );
          context.addValue(value);
      }
    }

    return context.result;
  }

  private async getAst(content: string): Promise<Root> {
    return await remark.parseMarkdown(content);
  }

  /**
   * Converts an object to match a JSON schema, reformatting object properties
   * that are defined as arrays in the schema.
   */
  reformatToMatchSchema(obj: any, schema: SimpleJSONSchema): any {
    if (!obj) return obj;

    // If schema indicates an array but obj is an object, reformat and process each item
    if (
      schema.type === 'array' &&
      typeof obj === 'object' &&
      !Array.isArray(obj)
    ) {
      return Object.keys(obj).map((key) => {
        const value = obj[key];
        if (schema.items) {
          return this.reformatToMatchSchema(value, schema.items);
        }
        return value;
      });
    }

    // If both obj and schema are objects, process each property
    if (
      schema.type === 'object' &&
      typeof obj === 'object' &&
      !Array.isArray(obj)
    ) {
      const result: Record<string, any> = {};
      if (schema.properties) {
        Object.keys(schema.properties).forEach((propName) => {
          if (obj[propName] !== undefined) {
            result[propName] = this.reformatToMatchSchema(
              obj[propName],
              schema.properties![propName],
            );
          }
        });
      }

      return result;
    }

    // If schema is array and obj is already an array, process each item
    if (schema.type === 'array' && Array.isArray(obj) && schema.items) {
      return obj.map((item) => this.reformatToMatchSchema(item, schema.items!));
    }

    // For primitive types or when no further processing is needed
    return obj;
  }

  async parseToObject<T>(content: string, schema: SimpleJSONSchema): Promise<T> {
    const ast = await this.getAst(content);
    const context = new ContextDto(schema);
    const obj = this.reduceAstToObject(ast, context);
    return obj as T;
  }

  async parse<T>(content: string, schema: SimpleJSONSchema): Promise<T> {
    const parsedObject = await this.parseToObject(content, schema);
    const result = this.reformatToMatchSchema(parsedObject, schema);
    this.validate(result, schema);
    return result as T;
  }

  validate(obj: any, schema: SimpleJSONSchema): void {
    const ajv = new Ajv({
      strict: false,
    });
    const validate = ajv.compile(schema);
    if (!validate(obj)) {
      console.log(obj);
      console.log(validate.errors);
      throw new Error(`Result validation failed.`);
    }
  }
}

export default MarkdownParser;
