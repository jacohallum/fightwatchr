// scripts/espn-schema-dumper.ts

/* 
  Usage:
    npx ts-node scripts/espn-schema-dumper.ts <url> [url2 ...]
  
  Example:
    npx ts-node scripts/espn-schema-dumper.ts \
      "https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard?dates=20250101-20250131" \
      "https://sports.core.api.espn.com/v2/sports/mma/leagues/ufc/events/123456?lang=en&region=us"
  
  Redirect to a file if you want:
    npx ts-node scripts/espn-schema-dumper.ts "<url>" > espn-schema.json
*/

type TypeName = 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array';

type SchemaMap = Record<string, Set<TypeName>>;

function addType(schema: SchemaMap, path: string, type: TypeName) {
  const key = path || '<root>';
  if (!schema[key]) schema[key] = new Set<TypeName>();
  schema[key].add(type);
}

function collectSchema(value: unknown, path: string, schema: SchemaMap): void {
  if (value === null) {
    addType(schema, path, 'null');
    return;
  }

  const valueType = typeof value;

  if (valueType === 'string' || valueType === 'number' || valueType === 'boolean') {
    addType(schema, path, valueType);
    return;
  }

  if (Array.isArray(value)) {
    addType(schema, path, 'array');
    for (const item of value) {
      const itemPath = path ? `${path}[]` : '[]';
      collectSchema(item, itemPath, schema);
    }
    return;
  }

  if (valueType === 'object') {
    addType(schema, path, 'object');
    const obj = value as Record<string, unknown>;
    for (const [key, child] of Object.entries(obj)) {
      const childPath = path ? `${path}.${key}` : key;
      collectSchema(child, childPath, schema);
    }
  }
}

function schemaToPlain(schema: SchemaMap): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [path, types] of Object.entries(schema)) {
    out[path] = Array.from(types).sort().join(' | ');
  }
  return out;
}

async function dumpUrlSchema(url: string): Promise<Record<string, string> | null> {
  try {
    console.error(`Fetching ${url}...`);
    const res = await fetch(url);

    if (!res.ok) {
      console.error(`  HTTP ${res.status} ${res.statusText}`);
      return null;
    }

    const json = (await res.json()) as unknown;
    const schema: SchemaMap = {};
    collectSchema(json, '', schema);
    return schemaToPlain(schema);
  } catch (err) {
    console.error(`  Error fetching ${url}:`, err instanceof Error ? err.message : String(err));
    return null;
  }
}

async function main() {
  const urls = process.argv.slice(2);

  if (urls.length === 0) {
    console.error('Usage: ts-node scripts/espn-schema-dumper.ts <url> [url2 ...]');
    process.exit(1);
  }

  const result: Record<string, Record<string, string>> = {};

  for (const url of urls) {
    const schema = await dumpUrlSchema(url);
    if (schema) {
      result[url] = schema;
    }
  }

  // Print combined schema map to stdout
  console.log(JSON.stringify(result, null, 2));
}

main().catch(err => {
  console.error('Unexpected error:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
