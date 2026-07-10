import test from 'node:test';
import assert from 'node:assert/strict';

import { DEFAULT_CONFIG } from '../src/data/rules';
import { PhpStanConfig } from '../src/types';
import {
  analyzeComposerDependencies,
  getCommunityRuleIncludePaths,
  getSortedCommunityRulePackages,
  recommendCommunityRulePackages,
  setCommunityRulePackageEnabled,
} from '../src/lib/communityRuleAdvisor';
import { getComposerCommand, getComposerPackages, getExportGuidanceBlocks } from '../src/lib/export';
import { resolveSelectedExtensions } from '../src/lib/phpstanSelections';
import { renderNeon } from '../src/lib/neon';
import { COMMUNITY_RULE_PACKAGES } from '../src/data/communityRulePackages';
import { EXTENSIONS_LIBRARY_BY_ID } from '../src/data/phpstanExtensionsLibrary';

function createConfig(): PhpStanConfig {
  return {
    ...DEFAULT_CONFIG,
    strictRules: {
      ...DEFAULT_CONFIG.strictRules,
    },
    extensions: {
      ...DEFAULT_CONFIG.extensions,
      customIncludes: [...DEFAULT_CONFIG.extensions.customIncludes],
      selectedExtensions: DEFAULT_CONFIG.extensions.selectedExtensions
        ? DEFAULT_CONFIG.extensions.selectedExtensions.map((extension) => ({ ...extension, selectedIncludes: [...extension.selectedIncludes] }))
        : undefined,
      communityPackages: DEFAULT_CONFIG.extensions.communityPackages
        ? DEFAULT_CONFIG.extensions.communityPackages.map((rulePackage) => ({ ...rulePackage }))
        : [],
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

test('package recommendation logic is deterministic for laravel and library contexts', () => {
  const laravelConfig = createConfig();
  laravelConfig.extensions.larastan = true;
  laravelConfig.level = '8';

  const laravelRecommendations = recommendCommunityRulePackages(laravelConfig, {
    activePresetId: 'laravel',
  });

  assert.equal(
    laravelRecommendations.find((entry) => entry.packageId === 'larastan-advisor')?.recommendation,
    'recommended'
  );
  assert.equal(
    laravelRecommendations.find((entry) => entry.packageId === 'shipmonk-rules')?.recommendation,
    'suggested'
  );

  const libraryConfig = createConfig();
  libraryConfig.level = 'max';

  const libraryRecommendations = recommendCommunityRulePackages(libraryConfig, {
    activePresetId: 'library',
  });

  assert.equal(
    libraryRecommendations.find((entry) => entry.packageId === 'ergebnis-rules')?.recommendation,
    'recommended'
  );
  assert.equal(
    libraryRecommendations.find((entry) => entry.packageId === 'unused-public')?.recommendation,
    'suggested'
  );
});

test('package sorting keeps stronger recommendations before weaker ones', () => {
  const config = createConfig();
  config.level = 'max';

  const sorted = getSortedCommunityRulePackages(config, {
    activePresetId: 'library',
  });

  const ergebnisIndex = sorted.findIndex((entry) => entry.rulePackage.id === 'ergebnis-rules');
  const spazeIndex = sorted.findIndex((entry) => entry.rulePackage.id === 'spaze-disallowed-calls');

  assert.ok(ergebnisIndex >= 0);
  assert.ok(spazeIndex >= 0);
  assert.ok(ergebnisIndex < spazeIndex);
});

test('composer command generation deduplicates linked and curated packages', () => {
  let config = createConfig();
  config.extensions.installationStrategy = 'hybrid';
  config = setCommunityRulePackageEnabled(config, 'larastan-advisor', true);
  config = setCommunityRulePackageEnabled(config, 'ergebnis-rules', true);

  const packages = getComposerPackages(config);

  assert.deepEqual(packages, [
    'phpstan/extension-installer',
    'larastan/larastan',
    'ergebnis/phpstan-rules',
  ]);
  assert.equal(
    getComposerCommand(config),
    'composer require --dev phpstan/extension-installer larastan/larastan ergebnis/phpstan-rules'
  );
});

test('enabled package export behavior adds only verified include paths', () => {
  let config = createConfig();
  config = setCommunityRulePackageEnabled(config, 'larastan-advisor', true);
  config = setCommunityRulePackageEnabled(config, 'type-coverage', true);

  const includePaths = getCommunityRuleIncludePaths(config);
  const neon = renderNeon(config, 'Rules Beyond Core');

  assert.deepEqual(includePaths, ['vendor/larastan/larastan/extension.neon']);
  assert.match(neon, /vendor\/larastan\/larastan\/extension\.neon/);
  assert.doesNotMatch(neon, /type-coverage\/config\/extension\.neon/);
});

test('dependency-based recommendation hints stay explicit', () => {
  const dependencyScan = analyzeComposerDependencies(`{
    "require": {
      "laravel/framework": "^12.0",
      "symfony/console": "^7.3",
      "doctrine/orm": "^3.5",
      "phpunit/phpunit": "^12.0",
      "phpstan/phpstan-strict-rules": "^2.0",
      "voku/phpstan-rules": "^1.0"
    }
  }`);

  assert.ok(dependencyScan);
  assert.equal(dependencyScan?.frameworks.laravel, true);
  assert.equal(dependencyScan?.frameworks.symfony, true);
  assert.equal(dependencyScan?.frameworks.doctrine, true);
  assert.equal(dependencyScan?.frameworks.phpunit, true);
  assert.equal(dependencyScan?.hasStrictRules, true);
  assert.ok(dependencyScan?.suggestedCommunityPackageIds.includes('larastan-advisor'));
  assert.ok(dependencyScan?.alreadyInstalledCommunityPackageIds.includes('voku-rules-advisor'));
});

test('dependency scan ignores non-object JSON roots', () => {
  assert.equal(analyzeComposerDependencies('null'), null);
  assert.equal(analyzeComposerDependencies('[]'), null);
  assert.equal(analyzeComposerDependencies('"composer.json"'), null);
});

test('legacy extension flags still enable mapped selections', () => {
  const config = createConfig();
  config.extensions.doctrine = true;
  config.extensions.selectedExtensions = [
    { id: 'doctrine', enabled: false, selectedIncludes: ['extension.neon'] },
  ];

  const selectedDoctrine = resolveSelectedExtensions(config.extensions).find((extension) => extension.id === 'doctrine');

  assert.equal(selectedDoctrine?.enabled, true);
});

test('community packages linked to an Extension Library entry cannot drift out of sync', () => {
  const linkedPackages = COMMUNITY_RULE_PACKAGES.filter((rulePackage) => rulePackage.linkedExtensionId);

  assert.ok(linkedPackages.length > 0, 'expected at least one linked community package to guard');

  for (const rulePackage of linkedPackages) {
    const extension = EXTENSIONS_LIBRARY_BY_ID[rulePackage.linkedExtensionId as string];

    assert.ok(extension, `linkedExtensionId "${rulePackage.linkedExtensionId}" must exist in EXTENSIONS_LIBRARY`);
    assert.equal(
      rulePackage.packageName,
      extension.composerPackage,
      `${rulePackage.id} composer package must match its linked Extension Library entry`
    );
    assert.equal(
      rulePackage.composerRequireDev,
      `composer require --dev ${extension.composerPackage}`,
      `${rulePackage.id} install command must match its linked Extension Library entry`
    );

    const expectedIncludes = extension.includes.map((file) => {
      const basePath = `vendor/${extension.composerPackage}`;
      return `${basePath}/${file}`;
    });
    assert.deepEqual(
      rulePackage.includes,
      expectedIncludes,
      `${rulePackage.id} include paths must match its linked Extension Library entry`
    );
  }
});

test('manual guidance is exported for packages without verified include paths', () => {
  let config = createConfig();
  config = setCommunityRulePackageEnabled(config, 'spaze-disallowed-calls', true);

  const blocks = getExportGuidanceBlocks(config);

  assert.equal(blocks.length, 1);
  assert.equal(blocks[0]?.packageName, 'spaze/phpstan-disallowed-calls');
  assert.match(blocks[0]?.lines.join('\n') ?? '', /Include path intentionally not generated/);
});
