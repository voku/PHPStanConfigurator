import test from 'node:test';
import assert from 'node:assert/strict';

import { renderNeon, parseNeon } from '../src/lib/neon';
import { DEFAULT_CONFIG, RULE_EXPLANATIONS } from '../src/data/rules';
import { PHPSTAN_CONFIG_REFERENCE_BY_KEY } from '../src/data/phpstanReference.generated';

function createConfig() {
  return {
    ...DEFAULT_CONFIG,
    strictRules: {
      ...DEFAULT_CONFIG.strictRules,
    },
    extensions: {
      ...DEFAULT_CONFIG.extensions,
      customIncludes: [...DEFAULT_CONFIG.extensions.customIncludes],
      vokuParameters: DEFAULT_CONFIG.extensions.vokuParameters
        ? {
            ...DEFAULT_CONFIG.extensions.vokuParameters,
            classesNotInIfConditions: [...DEFAULT_CONFIG.extensions.vokuParameters.classesNotInIfConditions],
          }
        : undefined,
      sidzParameters: DEFAULT_CONFIG.extensions.sidzParameters
        ? {
            ...DEFAULT_CONFIG.extensions.sidzParameters,
            ignoreMagicNumbers: [...DEFAULT_CONFIG.extensions.sidzParameters.ignoreMagicNumbers],
          }
        : undefined,
    },
    paths: [...DEFAULT_CONFIG.paths],
    excludes: [...DEFAULT_CONFIG.excludes],
    bootstrapFiles: [...DEFAULT_CONFIG.bootstrapFiles],
    autoloadFiles: [...DEFAULT_CONFIG.autoloadFiles],
    baseline: DEFAULT_CONFIG.baseline ? { ...DEFAULT_CONFIG.baseline } : null,
  };
}

test('renderNeon and parseNeon round-trip reportIgnoresWithoutComments', () => {
  const config = createConfig();
  config.strictRules.reportIgnoresWithoutComments = true;

  const neon = renderNeon(config, 'Test Preset');

  assert.match(neon, /reportIgnoresWithoutComments: true/);

  const parsed = parseNeon(neon);

  assert.equal(parsed.strictRules?.reportIgnoresWithoutComments, true);
});

test('synced PHPStan reference is keyed for reportIgnoresWithoutComments and feeds rule explanations', () => {
  const reference = PHPSTAN_CONFIG_REFERENCE_BY_KEY.reportIgnoresWithoutComments;

  assert.ok(reference);
  assert.equal(reference.defaultValue, 'false');
  assert.equal(reference.availableIn, '2.1.41');
  assert.match(reference.summary, /@phpstan-ignore/);

  const explanation = RULE_EXPLANATIONS.reportIgnoresWithoutComments;

  assert.ok(explanation);
  assert.match(explanation.rationale, /Default: false\./);
  assert.match(explanation.rationale, /Available in PHPStan 2\.1\.41\./);
});
