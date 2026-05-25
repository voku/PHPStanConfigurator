import test from 'node:test';
import assert from 'node:assert/strict';

import { renderNeon, parseNeon } from '../src/lib/neon';
import { DEFAULT_CONFIG, RULE_EXPLANATIONS } from '../src/data/rules';
import { PHPSTAN_CONFIG_REFERENCE_BY_KEY } from '../src/data/phpstanReference.generated';
import { getExtensionComposerPackage, getExtensionIncludeBasePath } from '../src/lib/phpstanExtensions';

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

test('extension helpers map renamed and nonstandard packages correctly', () => {
  assert.equal(getExtensionComposerPackage('larastan'), 'larastan/larastan');
  assert.equal(getExtensionIncludeBasePath('larastan'), 'vendor/larastan/larastan');
  assert.equal(getExtensionComposerPackage('psl'), 'php-standard-library/phpstan-extension');
  assert.equal(getExtensionIncludeBasePath('psl'), 'vendor/php-standard-library/phpstan-extension');
});

test('renderNeon uses current include paths for mapped extensions', () => {
  const config = createConfig();
  config.extensions.installationStrategy = 'manual_includes';
  config.extensions.selectedExtensions = [
    { id: 'larastan', enabled: true, selectedIncludes: ['extension.neon'] },
    { id: 'psl', enabled: true, selectedIncludes: ['extension.neon'] },
  ];

  const neon = renderNeon(config, 'Test Preset');

  assert.match(neon, /vendor\/larastan\/larastan\/extension\.neon/);
  assert.match(neon, /vendor\/php-standard-library\/phpstan-extension\/extension\.neon/);
});

test('renderNeon uses official bleeding edge include path and formats PHP 8.5', () => {
  const config = createConfig();
  config.phpVersion = '80500';
  config.strictRules.bleedingEdge = true;

  const neon = renderNeon(config, 'Test Preset');

  assert.match(neon, /phar:\/\/phpstan\.phar\/conf\/bleedingEdge\.neon/);
  assert.match(neon, /phpVersion: 80500 # 8\.5/);
});
