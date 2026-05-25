/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface StrictRules {
  treatPhpDocTypesAsCertain: boolean;
  bleedingEdge: boolean;
  reportUnmatchedIgnoredErrors?: boolean;
  checkImplicitMixed?: boolean;
  checkBenevolentUnionTypes?: boolean;
}

export type InstallationStrategy = 'auto_installer' | 'manual_includes' | 'hybrid';

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
  vokuParameters?: VokuParameters;
  sidzParameters?: SidzParameters;
}

export interface BaselineConfig {
  path: string;
  generateIfMissing: boolean;
  warningAboutStale: boolean;
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
