// TypeScript CommonJS wrapper for unified + remark-parse
import type { Processor } from 'unified';
import type { Root } from 'mdast';

let unifiedPromise: Promise<any>;
let remarkParsePromise: Promise<any>;

function loadUnified(): Promise<any> {
  if (!unifiedPromise) {
    unifiedPromise = import('unified');
  }
  return unifiedPromise;
}

function loadRemarkParse(): Promise<any> {
  if (!remarkParsePromise) {
    remarkParsePromise = import('remark-parse');
  }
  return remarkParsePromise;
}

const remarkWrapper = {
  async createProcessor(): Promise<Processor> {
    const [unifiedMod, remarkParseMod] = await Promise.all([
      loadUnified(),
      loadRemarkParse()
    ]);

    const unified = unifiedMod.unified;
    const remarkParse = remarkParseMod.default || remarkParseMod.remarkParse;

    return unified().use(remarkParse);
  },

  async unified(): Promise<Processor> {
    const mod = await loadUnified();
    return mod.unified();
  },

  async remarkParse(): Promise<any> {
    const mod = await loadRemarkParse();
    return mod.default || mod.remarkParse;
  },

  async parseMarkdown(content: string): Promise<Root> {
    const processor = await this.createProcessor();
    return processor.parse(content) as Root;
  },
};

// CommonJS exports
module.exports = remarkWrapper;
module.exports.parse = remarkWrapper.parseMarkdown;

// TypeScript exports (for .d.ts generation)
export = remarkWrapper;