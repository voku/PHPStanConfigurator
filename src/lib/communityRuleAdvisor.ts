/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { COMMUNITY_RULE_PACKAGES } from '../data/communityRulePackages';
import {
  CommunityRulePackage,
  CommunityRuleRecommendation,
  DependencyScanResult,
  PhpStanConfig,
  SelectedCommunityRulePackage,
} from '../types';
import { resolveSelectedCommunityPackages, resolveSelectedExtensions } from './phpstanSelections';

const RECOMMENDATION_WEIGHT: Record<CommunityRuleRecommendation['recommendation'], number> = {
  off: 0,
  advanced: 1,
  suggested: 2,
  recommended: 3,
};

function promoteRecommendation(
  current: CommunityRuleRecommendation['recommendation'],
  target: CommunityRuleRecommendation['recommendation']
): CommunityRuleRecommendation['recommendation'] {
  return RECOMMENDATION_WEIGHT[target] > RECOMMENDATION_WEIGHT[current] ? target : current;
}

function normalizeLevel(level: string): number {
  if (level === 'max') {
    return 11;
  }

  return Number.parseInt(level, 10) || 0;
}

function matchesPackagePrefix(packageNames: string[], prefix: string): boolean {
  return packageNames.some((packageName) => packageName.startsWith(prefix));
}

export function analyzeComposerDependencies(input: string): DependencyScanResult | null {
  if (!input.trim()) {
    return null;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(input);
  } catch {
    return null;
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return null;
  }

  const parsedRecord = parsed as Record<string, unknown>;
  const require = typeof parsedRecord.require === 'object' && parsedRecord.require !== null ? parsedRecord.require as Record<string, string> : {};
  const requireDev = typeof parsedRecord['require-dev'] === 'object' && parsedRecord['require-dev'] !== null ? parsedRecord['require-dev'] as Record<string, string> : {};
  const packageNames = Array.from(new Set([...Object.keys(require), ...Object.keys(requireDev)])).sort();

  const frameworks = {
    laravel: packageNames.includes('laravel/framework'),
    symfony: matchesPackagePrefix(packageNames, 'symfony/'),
    doctrine: matchesPackagePrefix(packageNames, 'doctrine/'),
    phpunit: packageNames.includes('phpunit/phpunit'),
  };

  const alreadyInstalledCommunityPackageIds = COMMUNITY_RULE_PACKAGES
    .filter((rulePackage) => packageNames.includes(rulePackage.packageName))
    .map((rulePackage) => rulePackage.id);

  const suggestedCommunityPackageIds = Array.from(
    new Set([
      ...(frameworks.laravel ? ['larastan-advisor'] : []),
      ...((frameworks.symfony || frameworks.doctrine) ? ['symplify-rules'] : []),
      ...(frameworks.doctrine ? ['staabm-dba'] : []),
      ...(frameworks.phpunit ? ['symplify-rules', 'ergebnis-rules'] : []),
    ])
  );

  const notes: string[] = [];

  if (frameworks.laravel) {
    notes.push('Detected laravel/framework, so Larastan is a strong fit.');
  }
  if (frameworks.symfony) {
    notes.push('Detected symfony/* packages, so Symfony-oriented rules deserve priority.');
  }
  if (frameworks.doctrine) {
    notes.push('Detected doctrine/* packages, so Doctrine-aware rules and DBA checks are worth considering.');
  }
  if (frameworks.phpunit) {
    notes.push('Detected phpunit/phpunit, so PHPUnit-aware rules from Symplify and Ergebnis can help.');
  }
  if (packageNames.includes('phpstan/phpstan-strict-rules')) {
    notes.push('Detected phpstan/phpstan-strict-rules, so avoid layering extra strictness blindly.');
  }
  if (packageNames.includes('voku/phpstan-rules')) {
    notes.push('Detected voku/phpstan-rules, so mark it as already installed instead of recommending it again.');
  }

  return {
    packageNames,
    detectedExtensionIds: [
      ...(frameworks.doctrine ? ['doctrine'] : []),
      ...(frameworks.symfony ? ['symfony'] : []),
      ...(frameworks.laravel ? ['larastan'] : []),
      ...(frameworks.phpunit ? ['phpunit'] : []),
      ...(packageNames.includes('phpstan/phpstan-strict-rules') ? ['strict-rules'] : []),
      ...(packageNames.includes('phpstan/phpstan-deprecation-rules') ? ['deprecation-rules'] : []),
      ...(packageNames.includes('voku/phpstan-rules') ? ['voku-rules'] : []),
      ...(packageNames.includes('sidz/phpstan-rules') ? ['sidz-rules'] : []),
    ],
    suggestedCommunityPackageIds,
    alreadyInstalledCommunityPackageIds,
    notes,
    hasStrictRules: packageNames.includes('phpstan/phpstan-strict-rules'),
    frameworks,
  };
}

export function isCommunityRulePackageEnabled(config: PhpStanConfig, rulePackage: CommunityRulePackage): boolean {
  if (rulePackage.linkedExtensionId) {
    return resolveSelectedExtensions(config.extensions).some(
      (extension) => extension.id === rulePackage.linkedExtensionId && extension.enabled
    );
  }

  return resolveSelectedCommunityPackages(config.extensions).some(
    (selectedPackage) => selectedPackage.id === rulePackage.id && selectedPackage.enabled
  );
}

export function getEnabledCommunityRulePackages(config: PhpStanConfig): CommunityRulePackage[] {
  return COMMUNITY_RULE_PACKAGES.filter((rulePackage) => isCommunityRulePackageEnabled(config, rulePackage));
}

export function getCommunityRuleIncludePaths(config: PhpStanConfig): string[] {
  return Array.from(
    new Set(
      getEnabledCommunityRulePackages(config)
        .flatMap((rulePackage) => rulePackage.includes)
        .filter((includePath) => includePath.trim().length > 0)
    )
  );
}

function upsertSelection(
  currentSelections: SelectedCommunityRulePackage[],
  packageId: string,
  enabled: boolean
): SelectedCommunityRulePackage[] {
  const existing = currentSelections.find((selection) => selection.id === packageId);

  if (existing) {
    return currentSelections.map((selection) => (
      selection.id === packageId
        ? { ...selection, enabled }
        : selection
    ));
  }

  return [...currentSelections, { id: packageId, enabled }];
}

export function setCommunityRulePackageEnabled(
  config: PhpStanConfig,
  packageId: string,
  enabled: boolean
): PhpStanConfig {
  const rulePackage = COMMUNITY_RULE_PACKAGES.find((entry) => entry.id === packageId);

  if (!rulePackage) {
    return config;
  }

  if (rulePackage.linkedExtensionId) {
    const selectedExtensions = resolveSelectedExtensions(config.extensions).map((extension) => (
      extension.id === rulePackage.linkedExtensionId
        ? { ...extension, enabled }
        : extension
    ));

    return {
      ...config,
      extensions: {
        ...config.extensions,
        doctrine: rulePackage.linkedExtensionId === 'doctrine' ? enabled : config.extensions.doctrine,
        symfony: rulePackage.linkedExtensionId === 'symfony' ? enabled : config.extensions.symfony,
        larastan: rulePackage.linkedExtensionId === 'larastan' ? enabled : config.extensions.larastan,
        selectedExtensions,
      },
    };
  }

  return {
    ...config,
    extensions: {
      ...config.extensions,
      communityPackages: upsertSelection(resolveSelectedCommunityPackages(config.extensions), packageId, enabled),
    },
  };
}

export function recommendCommunityRulePackages(
  config: PhpStanConfig,
  context?: {
    activePresetId?: string;
    dependencyScan?: DependencyScanResult | null;
  }
): CommunityRuleRecommendation[] {
  const level = normalizeLevel(config.level);
  const presetId = context?.activePresetId ?? '';
  const dependencyScan = context?.dependencyScan ?? null;
  const enabledPaths = config.paths.map((path) => path.toLowerCase());
  const hasDatabasePath = enabledPaths.some((path) => path.includes('database') || path.includes('db'));
  const isLegacyPreset = presetId === 'legacy' || presetId === 'wordpress';
  const isLibraryPreset = presetId === 'library';
  const isCiGatePreset = presetId === 'cifast';

  return COMMUNITY_RULE_PACKAGES.map((rulePackage) => {
    let recommendation = rulePackage.defaultRecommendation;
    const reasons: string[] = [];
    const alreadyInstalled = dependencyScan?.alreadyInstalledCommunityPackageIds.includes(rulePackage.id) ?? false;

    if (alreadyInstalled) {
      reasons.push('Already present in composer dependencies.');
    }

    if (rulePackage.id === 'larastan-advisor' && (presetId === 'laravel' || config.extensions.larastan || dependencyScan?.frameworks.laravel)) {
      recommendation = 'recommended';
      reasons.push('Laravel was detected, so Larastan is the framework-specific choice.');
    }

    if (rulePackage.id === 'symplify-rules' && (config.extensions.symfony || config.extensions.doctrine || dependencyScan?.frameworks.symfony || dependencyScan?.frameworks.doctrine)) {
      recommendation = 'recommended';
      reasons.push('Symfony or Doctrine signals were detected.');
    }

    if (rulePackage.id === 'shipmonk-rules' && level >= 8) {
      recommendation = promoteRecommendation(recommendation, 'suggested');
      reasons.push('High PHPStan levels make ShipMonk findings more actionable.');
    }

    if (rulePackage.id === 'ergebnis-rules' && (config.level === 'max' || isLibraryPreset)) {
      recommendation = 'recommended';
      reasons.push('Library or max-level setups benefit from stricter API rules.');
    }

    if (rulePackage.id === 'unused-public' && (config.level === 'max' || isLibraryPreset || isCiGatePreset)) {
      recommendation = 'suggested';
      reasons.push('Public API cleanup is useful in library and CI gate setups.');
    }

    if (rulePackage.id === 'type-coverage' && (isLegacyPreset || isLibraryPreset || isCiGatePreset)) {
      recommendation = isCiGatePreset ? 'recommended' : 'suggested';
      reasons.push('Type coverage works well as a migration or CI ratchet.');
    }

    if (rulePackage.id === 'voku-rules-advisor' && isLegacyPreset) {
      recommendation = 'recommended';
      reasons.push('Legacy migration presets benefit from defensive condition checks.');
    }

    if (rulePackage.id === 'spaze-disallowed-calls' && (presetId === 'library' || config.strictRules.reportIgnoresWithoutComments)) {
      recommendation = 'advanced';
      reasons.push('Security-oriented setups may want explicit forbidden-call policies.');
    }

    if (rulePackage.id === 'staabm-dba' && (config.extensions.doctrine || dependencyScan?.frameworks.doctrine || hasDatabasePath)) {
      recommendation = promoteRecommendation(recommendation, 'suggested');
      reasons.push('Database-heavy signals were detected.');
    }

    if (rulePackage.id === 'cognitive-complexity' && isCiGatePreset) {
      recommendation = 'recommended';
      reasons.push('CI gate presets often benefit from calibrated complexity limits.');
    }

    if (rulePackage.id === 'symplify-rules' && dependencyScan?.frameworks.phpunit) {
      reasons.push('PHPUnit was detected, so Symplify PHPUnit rules may help.');
    }

    if (rulePackage.id === 'ergebnis-rules' && dependencyScan?.frameworks.phpunit) {
      reasons.push('PHPUnit was detected, so Ergebnis PHPUnit-focused rules may help.');
    }

    if (dependencyScan?.suggestedCommunityPackageIds.includes(rulePackage.id) && reasons.length === 0) {
      reasons.push('Detected dependencies suggest this package is relevant.');
    }

    if (dependencyScan?.hasStrictRules && ['ergebnis-rules', 'shipmonk-rules', 'voku-rules-advisor'].includes(rulePackage.id)) {
      recommendation = recommendation === 'recommended' ? 'suggested' : recommendation;
      reasons.push('phpstan/phpstan-strict-rules is already installed, so add extra strictness carefully.');
    }

    return {
      packageId: rulePackage.id,
      recommendation,
      reasons,
      alreadyInstalled,
    };
  });
}

export function getSortedCommunityRulePackages(
  config: PhpStanConfig,
  context?: {
    activePresetId?: string;
    dependencyScan?: DependencyScanResult | null;
  }
): Array<{
  rulePackage: CommunityRulePackage;
  recommendation: CommunityRuleRecommendation;
  enabled: boolean;
}> {
  const recommendations = recommendCommunityRulePackages(config, context);

  return COMMUNITY_RULE_PACKAGES
    .map((rulePackage) => {
      const recommendation = recommendations.find((entry) => entry.packageId === rulePackage.id);

      return {
        rulePackage,
        recommendation: recommendation ?? {
          packageId: rulePackage.id,
          recommendation: rulePackage.defaultRecommendation,
          reasons: [],
          alreadyInstalled: false,
        },
        enabled: isCommunityRulePackageEnabled(config, rulePackage),
      };
    })
    .sort((left, right) => {
      const recommendationDiff = RECOMMENDATION_WEIGHT[right.recommendation.recommendation] - RECOMMENDATION_WEIGHT[left.recommendation.recommendation];

      if (recommendationDiff !== 0) {
        return recommendationDiff;
      }

      if (left.enabled !== right.enabled) {
        return left.enabled ? -1 : 1;
      }

      return left.rulePackage.displayName.localeCompare(right.rulePackage.displayName);
    });
}

export function groupCommunityRulePackages(
  config: PhpStanConfig,
  context?: {
    activePresetId?: string;
    dependencyScan?: DependencyScanResult | null;
  }
): Array<{
  category: CommunityRulePackage['category'];
  entries: Array<{
    rulePackage: CommunityRulePackage;
    recommendation: CommunityRuleRecommendation;
    enabled: boolean;
  }>;
}> {
  const sortedPackages = getSortedCommunityRulePackages(config, context);
  const grouped = new Map<CommunityRulePackage['category'], typeof sortedPackages>();

  for (const entry of sortedPackages) {
    const entries = grouped.get(entry.rulePackage.category) ?? [];
    entries.push(entry);
    grouped.set(entry.rulePackage.category, entries);
  }

  return Array.from(grouped.entries()).map(([category, entries]) => ({
    category,
    entries,
  }));
}
