/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface StrictRules {
  treatPhpDocTypesAsCertain: boolean;
  bleedingEdge: boolean;
  reportUnmatchedIgnoredErrors?: boolean;
  reportIgnoresWithoutComments?: boolean;
  checkImplicitMixed?: boolean;
  checkBenevolentUnionTypes?: boolean;
}

export type InstallationStrategy = 'auto_installer' | 'manual_includes' | 'hybrid';

export type RulePackageCategory =
  | 'type-safety'
  | 'security'
  | 'architecture'
  | 'framework'
  | 'database'
  | 'testing'
  | 'complexity'
  | 'migration'
  | 'strictness';

export interface CommunityRuleSummary {
  ruleClass: string;
  title: string;
  problem: string;
  value: string;
  risk: string;
}

export interface CommunityRulePackage {
  id: string;
  packageName: string;
  displayName: string;
  category: RulePackageCategory;
  ruleCount: number;
  recommendedFor: string[];
  avoidWhen: string[];
  composerRequireDev: string;
  includes: string[];
  configurationHints: string[];
  highlightedRules: CommunityRuleSummary[];
  defaultRecommendation: 'off' | 'suggested' | 'recommended' | 'advanced';
  linkedExtensionId?: string;
}

export interface SelectedCommunityRulePackage {
  id: string;
  enabled: boolean;
}

export interface DependencyScanResult {
  packageNames: string[];
  detectedExtensionIds: string[];
  suggestedCommunityPackageIds: string[];
  alreadyInstalledCommunityPackageIds: string[];
  notes: string[];
  hasStrictRules: boolean;
  frameworks: {
    laravel: boolean;
    symfony: boolean;
    doctrine: boolean;
    phpunit: boolean;
  };
}

export interface CommunityRuleRecommendation {
  packageId: string;
  recommendation: 'off' | 'suggested' | 'recommended' | 'advanced';
  reasons: string[];
  alreadyInstalled: boolean;
}

export interface VokuParameters {
  checkForAssignments: boolean;
  checkYodaConditions: boolean;
  classesNotInIfConditions: string[];
}

export interface SidzParameters {
  ignoreMagicNumbers: number[];
  ignoreNumericStrings: boolean;
  preset: 'strict' | 'balanced' | 'legacy' | 'ai_hardening';
}


export interface SelectedExtension {
  id: string; // e.g., 'doctrine', 'symfony'
  enabled: boolean;
  selectedIncludes: string[]; // e.g., ['extension.neon', 'rules.neon']
}

export interface Extensions {
  doctrine: boolean;
  symfony: boolean;
  larastan: boolean;
  customIncludes: string[];
  installationStrategy?: InstallationStrategy;
  selectedExtensions?: SelectedExtension[];
  communityPackages?: SelectedCommunityRulePackage[];
  vokuParameters?: VokuParameters;
  sidzParameters?: SidzParameters;
}

export interface BaselineConfig {
  path: string;
  generateIfMissing: boolean;
  warningAboutStale: boolean;
}

export interface PreservedNeonBlock {
  key: string;
  lines: string[];
}

export interface ImportedNeonPreservation {
  parameterBlocks: PreservedNeonBlock[];
  topLevelBlocks: PreservedNeonBlock[];
}

export interface PhpStanConfig {
  level: string; // "0" - "10", or "max"
  targetVersion?: '1.x' | '2.x'; // Target PHPStan version
  phpVersion: string; // e.g. "80300" for 8.3 or "8.3" as a readable string
  paths: string[];
  excludes: string[];
  bootstrapFiles: string[];
  autoloadFiles: string[];
  strictRules: StrictRules;
  extensions: Extensions;
  baseline: BaselineConfig | null;
  importedRawBlocks?: ImportedNeonPreservation;
}

export interface Preset {
  id: string;
  name: string;
  level: string;
  strictness: "Low" | "Medium" | "High";
  target: string;
  description: string;
  config: PhpStanConfig;
  category: 'Security Focused' | 'Performance Focused' | 'Legacy Compatibility' | 'General';
}

export interface RuleMeta {
  id: string;
  name: string;
  category: "strictness" | "basic" | "extensions" | "general";
  description: string;
  whyItExists: string;
  defaultVal: boolean | string | number | string[];
}
