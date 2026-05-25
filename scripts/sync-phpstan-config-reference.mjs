import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_REF = process.env.PHPSTAN_CONFIG_REF || '2.2.x';
const refArg = process.argv.find((arg) => arg.startsWith('--ref='));
const ref = refArg ? refArg.slice('--ref='.length) : DEFAULT_REF;
const sourceUrl = `https://raw.githubusercontent.com/phpstan/phpstan/${ref}/website/src/config-reference.md`;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const outputPath = path.join(repoRoot, 'src', 'data', 'phpstanReference.generated.ts');

const response = await fetch(sourceUrl, {
  headers: {
    'User-Agent': 'PHPStanConfigurator-sync-script',
    Accept: 'text/plain',
  },
});

if (!response.ok) {
  throw new Error(`Failed to fetch PHPStan config reference from ${sourceUrl}: ${response.status} ${response.statusText}`);
}

const markdown = await response.text();
const entries = parseConfigReference(markdown);
const sourceHash = createHash('sha256').update(markdown).digest('hex');

await writeFile(outputPath, renderGeneratedFile({ entries, ref, sourceHash, sourceUrl }), 'utf8');
console.log(`Synced ${entries.length} PHPStan config reference entries from ${sourceUrl}`);

function parseConfigReference(markdown) {
  const lines = markdown.split(/\r?\n/);
  const entries = new Map();
  let currentSection = 'General';

  const ensureEntry = (key, partial) => {
    if (!key) {
      return;
    }

    const normalizedKey = key.trim();
    const existing = entries.get(normalizedKey) || {
      key: normalizedKey,
      section: currentSection,
      summary: `See PHPStan config reference section "${currentSection}".`,
    };

    entries.set(normalizedKey, {
      ...existing,
      ...partial,
      key: normalizedKey,
      section: partial.section || existing.section || currentSection,
      summary: partial.summary || existing.summary,
    });
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();
    const nextLine = lines[index + 1]?.trim() || '';

    if (trimmed && !trimmed.startsWith('#') && /^-+$/.test(nextLine)) {
      currentSection = trimmed;
      continue;
    }

    if (trimmed.startsWith('### `') && trimmed.endsWith('`')) {
      const keyMatch = trimmed.match(/^### `([^`]+)`$/);
      const key = keyMatch?.[1];
      if (!key) {
        continue;
      }
      const blockLines = [];
      let cursor = index + 1;
      while (cursor < lines.length) {
        const candidate = lines[cursor];
        const candidateTrimmed = candidate.trim();
        const candidateNext = lines[cursor + 1]?.trim() || '';
        if (candidateTrimmed.startsWith('### `')) {
          break;
        }
        if (candidateTrimmed && /^-+$/.test(candidateNext)) {
          break;
        }
        blockLines.push(candidate);
        cursor += 1;
      }

      ensureEntry(key, parseEntryBlock(blockLines, currentSection));
      continue;
    }

    if (trimmed.startsWith('Related config keys:')) {
      const relatedLines = [trimmed];
      let cursor = index + 1;
      while (cursor < lines.length) {
        const continuation = lines[cursor].trim();
        if (!continuation) {
          break;
        }
        if (continuation.startsWith('### `')) {
          break;
        }
        if (/^[A-Za-z].+$/.test(continuation) && /^-+$/.test(lines[cursor + 1]?.trim() || '')) {
          break;
        }
        relatedLines.push(continuation);
        cursor += 1;
      }

      const relatedText = relatedLines.join(' ');
      const keys = Array.from(relatedText.matchAll(/`([A-Za-z][A-Za-z0-9.]*)`/g), (match) => match[1]);
      for (const key of keys) {
        ensureEntry(key, {
          section: currentSection,
          summary: `See PHPStan config reference section "${currentSection}".`,
        });
      }
      continue;
    }

    for (const match of trimmed.matchAll(/`([A-Za-z][A-Za-z0-9.]*)`\s+(?:parameter|key)\b/g)) {
      ensureEntry(match[1], {
        section: currentSection,
      });
    }
  }

  return Array.from(entries.values()).sort((left, right) => left.key.localeCompare(right.key));
}

function parseEntryBlock(lines, section) {
  const block = lines.join('\n');
  const defaultValueMatch = block.match(/\*\*default\*\*:\s*`([^`]+)`/i);
  const availableInMatch = block.match(/Available in PHPStan\s+([^<\n]+)/i);
  const summaryParagraph = extractFirstParagraph(lines);

  const entry = {
    section,
    summary: summaryParagraph || `See PHPStan config reference section "${section}".`,
  };

  if (defaultValueMatch) {
    entry.defaultValue = defaultValueMatch[1].trim();
  }

  if (availableInMatch) {
    entry.availableIn = availableInMatch[1].trim();
  }

  return entry;
}

function extractFirstParagraph(lines) {
  const paragraph = [];
  let inFence = false;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    if (trimmed.startsWith('```')) {
      inFence = !inFence;
      if (paragraph.length > 0) {
        break;
      }
      continue;
    }

    if (inFence || !trimmed || trimmed.startsWith('<div') || trimmed.startsWith('</div') || trimmed.startsWith('**default**') || trimmed.startsWith('**example**')) {
      if (paragraph.length > 0) {
        break;
      }
      continue;
    }

    paragraph.push(trimmed);
  }

  return cleanupMarkdown(paragraph.join(' '));
}

function cleanupMarkdown(text) {
  return text
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function renderGeneratedFile({ entries, ref, sourceHash, sourceUrl }) {
  const serializedEntries = JSON.stringify(entries, null, 2);

  return `/**\n * @license\n * SPDX-License-Identifier: Apache-2.0\n *\n * This file is generated by scripts/sync-phpstan-config-reference.mjs.\n * Do not edit manually.\n */\n\nexport interface PhpStanReferenceEntry {\n  key: string;\n  section: string;\n  summary: string;\n  defaultValue?: string;\n  availableIn?: string;\n}\n\nexport const PHPSTAN_CONFIG_REFERENCE_META = {\n  ref: '${ref}',\n  sourceUrl: '${sourceUrl}',\n  sourceHash: '${sourceHash}',\n} as const;\n\nexport const PHPSTAN_CONFIG_REFERENCE = ${serializedEntries} as const satisfies readonly PhpStanReferenceEntry[];\n\nexport const PHPSTAN_CONFIG_REFERENCE_BY_KEY = Object.freeze(\n  Object.fromEntries(PHPSTAN_CONFIG_REFERENCE.map((entry) => [entry.key, entry])),\n) as Readonly<Record<string, PhpStanReferenceEntry>>;\n`;
}
