/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PhpStanConfig, Preset } from '../types';

export const PHP_VERSIONS = [
  { value: '80400', label: 'PHP 8.4 (80400)' },
  { value: '80300', label: 'PHP 8.3 (80300)' },
  { value: '80200', label: 'PHP 8.2 (80200)' },
  { value: '80100', label: 'PHP 8.1 (80100)' },
  { value: '80000', label: 'PHP 8.0 (80000)' },
  { value: '70400', label: 'PHP 7.4 (70400)' },
  { value: '70300', label: 'PHP 7.3 (70300)' },
];

export const PHPSTAN_LEVEL_GUARDS = [
  { level: '0', title: 'Level 0: Sanity Check', desc: 'Basic checks, unknown classes, unknown functions, missing arguments, incorrect counts.', strictnessLabel: 'Minimal checks', color: 'text-slate-500' },
  { level: '1', title: 'Level 1: Basic Structure', desc: 'Possibly undefined variables, unknown magic methods, and unknown magic properties on classes with __call and __get.', strictnessLabel: 'Basic syntax checks', color: 'text-slate-600' },
  { level: '2', title: 'Level 2: Strict Calls', desc: 'Checks unknown methods on all expressions and starts validating PHPDoc types.', strictnessLabel: 'Standard API checks', color: 'text-emerald-600' },
  { level: '3', title: 'Level 3: Return & Assign Mismatch', desc: 'Reports return type mismatches and invalid types assigned to properties.', strictnessLabel: 'Type assignment verified', color: 'text-emerald-700' },
  { level: '4', title: 'Level 4: Unreachable & Dead Code', desc: 'Unreachable code blocks, always-true/false comparisons, dead catch blocks.', strictnessLabel: 'Dead branch checked', color: 'text-indigo-600' },
  { level: '5', title: 'Level 5: Strict Call Argument Types', desc: 'Checks type safety of values passed to functions and methods strictly against signatures.', strictnessLabel: 'Strict argument checks', color: 'text-indigo-700' },
  { level: '6', title: 'Level 6: Missing Type Hints', desc: 'Reports missing typehints so parameters, returns, and properties become explicit.', strictnessLabel: 'Missing typehints reported', color: 'text-indigo-700' },
  { level: '7', title: 'Level 7: Union Mismatches', desc: 'Partially null or invalid method calls on union types (e.g. calling method on User|null).', strictnessLabel: 'Union type verified', color: 'text-amber-600' },
  { level: '8', title: 'Level 8: Nullable access checks', desc: 'Reports method calls and property access on nullable values. Recommended default for maintained application code.', strictnessLabel: 'Nullable access checks', color: 'text-rose-600' },
  { level: '9', title: 'Level 9: Explicit Mixed Strictness', desc: 'Be strict about explicit mixed: the only safe operation is passing it to another mixed.', strictnessLabel: 'Explicit mixed locked down', color: 'text-rose-700 font-semibold' },
  { level: '10', title: 'Level 10: Implicit Mixed Strictness', desc: 'Adds level-10 checks for implicit mixed too, not just explicitly declared mixed.', strictnessLabel: 'Maximum type strictness', color: 'text-red-600 font-extrabold' },
];

export const DEFAULT_CONFIG: PhpStanConfig = {
  level: '6',
  targetVersion: '2.x',
  phpVersion: '80300',
  paths: ['src', 'app'],
  excludes: ['vendor', 'var', 'tests/tmp'],
  bootstrapFiles: [],
  autoloadFiles: [],
  strictRules: {
    treatPhpDocTypesAsCertain: true,
    bleedingEdge: false,
    reportUnmatchedIgnoredErrors: true,
    checkImplicitMixed: false,
    checkBenevolentUnionTypes: false,
  },
  extensions: {
    doctrine: false,
    symfony: false,
    larastan: false,
    customIncludes: [],
    vokuParameters: {
      checkForAssignments: false,
      checkYodaConditions: false,
      classesNotInIfConditions: ['AbstractValueObject']
    },
    sidzParameters: {
      ignoreMagicNumbers: [0, 1],
      ignoreNumericStrings: false,
      preset: 'balanced'
    }
  },
  baseline: null,
};

export const PRESETS: Preset[] = [
  {
    id: 'laravel',
    name: 'Laravel Enterprise App',
    level: '6',
    strictness: 'Medium',
    category: 'General',
    target: 'Laravel, OctoberCMS',
    description: 'Designed specifically for Laravel codebases. Integrates Larastan, scans app, config, and database directories, excludes cache/storage files safely, and enforces standard rules.',
    config: {
      level: '6',
      targetVersion: '2.x',
      phpVersion: '80200',
      paths: ['app', 'config', 'database', 'routes'],
      excludes: ['bootstrap/cache', 'storage'],
      bootstrapFiles: [],
      autoloadFiles: [],
      strictRules: {
        treatPhpDocTypesAsCertain: true,
        bleedingEdge: false,
      },
      extensions: {
        doctrine: false,
        symfony: false,
        larastan: true,
        customIncludes: [],
      },
      baseline: null,
    },
  },
  {
    id: 'symfony',
    name: 'Symfony DDD Engine',
    level: '8',
    strictness: 'High',
    category: 'Performance Focused',
    target: 'Symfony MVC / API Platform',
    description: 'Highly integrated setup for Symfony and Doctrine. Enforces static type alignment, registers container parameters and database schemas, and scans src and tests.',
    config: {
      level: '8',
      targetVersion: '2.x',
      phpVersion: '80300',
      paths: ['src', 'tests'],
      excludes: ['var', 'vendor'],
      bootstrapFiles: [],
      autoloadFiles: [],
      strictRules: {
        treatPhpDocTypesAsCertain: true,
        bleedingEdge: false,
      },
      extensions: {
        doctrine: true,
        symfony: true,
        larastan: false,
        customIncludes: [],
      },
      baseline: null,
    },
  },
  {
    id: 'modern',
    name: 'Modern Web Application',
    level: '8',
    strictness: 'Medium',
    category: 'General',
    target: 'Generic App / API',
    description: 'Recommended default for maintained application code. Strong nullable access checks, moderate strictness, and handles generic return validation.',
    config: {
      level: '8',
      targetVersion: '2.x',
      phpVersion: '80300',
      paths: ['src', 'app'],
      excludes: ['vendor', 'var', 'tests/tmp'],
      bootstrapFiles: [],
      autoloadFiles: [],
      strictRules: {
        treatPhpDocTypesAsCertain: true,
        bleedingEdge: false,
      },
      extensions: {
        doctrine: false,
        symfony: false,
        larastan: false,
        customIncludes: [],
      },
      baseline: null,
    },
  },
  {
    id: 'library',
    name: 'Reusable Package / Library',
    level: '9',
    strictness: 'High',
    category: 'Security Focused',
    target: 'Open-Source Library',
    description: 'Extremely strict layout for libraries and public interfaces. Keeps PHPDoc trust explicit and includes Bleeding Edge for earlier PHPStan 2.x checks.',
    config: {
      level: '9',
      targetVersion: '2.x',
      phpVersion: '80400',
      paths: ['src'],
      excludes: ['vendor', 'tests/fixtures'],
      bootstrapFiles: [],
      autoloadFiles: [],
      strictRules: {
        treatPhpDocTypesAsCertain: true,
        bleedingEdge: true,
      },
      extensions: {
        doctrine: false,
        symfony: false,
        larastan: false,
        customIncludes: ['vendor/phpstan/phpstan-strict-rules/rules.neon'],
      },
      baseline: null,
    },
  },
  {
    id: 'wordpress',
    name: 'Legacy CMS / WordPress',
    level: '2',
    strictness: 'Low',
    category: 'Legacy Compatibility',
    target: 'Drupal, WordPress, PrestaShop',
    description: 'Tailored for loose frameworks, dynamic hooks, and legacy systems. Disables strict annotations and ignores complex type mismatch exceptions to keep warnings manageable.',
    config: {
      level: '2',
      targetVersion: '2.x',
      phpVersion: '80100',
      paths: ['src', 'web/modules'],
      excludes: ['vendor', 'web/sites/default/files'],
      bootstrapFiles: [],
      autoloadFiles: [],
      strictRules: {
        treatPhpDocTypesAsCertain: false,
        bleedingEdge: false,
      },
      extensions: {
        doctrine: false,
        symfony: false,
        larastan: false,
        customIncludes: [],
      },
      baseline: null,
    },
  },
  {
    id: 'legacy',
    name: 'Legacy Migration Baseline',
    level: '3',
    strictness: 'Low',
    category: 'Legacy Compatibility',
    target: 'Incremental Restructure',
    description: 'Adoption step 1: Low-noise baseline config. Ideal for importing old systems with active debt and gradually scaling up static rules checks without breaking execution.',
    config: {
      level: '3',
      targetVersion: '2.x',
      phpVersion: '80000',
      paths: ['src'],
      excludes: ['vendor', 'cache', 'temp'],
      bootstrapFiles: [],
      autoloadFiles: [],
      strictRules: {
        treatPhpDocTypesAsCertain: false,
        bleedingEdge: false,
      },
      extensions: {
        doctrine: false,
        symfony: false,
        larastan: false,
        customIncludes: [],
      },
      baseline: {
        path: 'phpstan-baseline.neon',
        generateIfMissing: true,
        warningAboutStale: true
      },
    },
  },
  {
    id: 'cifast',
    name: 'Bulletproof CI Build-Gate',
    level: 'max',
    strictness: 'High',
    category: 'Performance Focused',
    target: 'Continuous Integration Guard',
    description: 'Enforces phpstan level max with Bleeding Edge included. Best for pipelines validating merge requests before deploy. Strict and aggressive by design.',
    config: {
      level: 'max',
      targetVersion: '2.x',
      phpVersion: '80400',
      paths: ['src', 'tests'],
      excludes: ['vendor', 'bootstrap/cache', 'storage'],
      bootstrapFiles: [],
      autoloadFiles: [],
      strictRules: {
        treatPhpDocTypesAsCertain: true,
        bleedingEdge: true,
        checkImplicitMixed: true,
      },
      extensions: {
        doctrine: false,
        symfony: false,
        larastan: false,
        customIncludes: [],
      },
      baseline: null,
    },
  }
];

export const RULE_EXPLANATIONS: Record<string, { summary: string; rationale: string; trades: string }> = {
  level: {
    summary: 'The main knob for static testing strictness.',
    rationale: 'PHPStan 2.x has levels 0 to 10, and max is an alias for the highest available level. Progressing through the levels raises the strictness step by step so you can adopt stronger analysis without losing track of why new findings appear.',
    trades: 'Higher levels demand more complete typing, and max can become stricter automatically when you upgrade PHPStan.',
  },
  treatPhpDocTypesAsCertain: {
    summary: 'Controls whether PHPDoc types are treated as certain.',
    rationale: 'PHPStan 2.x treats PHPDoc and native types as equally certain by default. Setting this to false relaxes some checks, which is useful for public libraries or projects that do not want to trust every caller-facing PHPDoc.',
    trades: 'Turning it off can reduce false positives around consumer code, but it also gives up some precision when your PHPDoc is already accurate.',
  },
  bleedingEdge: {
    summary: 'Includes PHPStan’s Bleeding Edge ruleset.',
    rationale: 'In PHPStan 2.x, Bleeding Edge is enabled by including the dedicated bleedingEdge.neon file. It previews rules, behaviour changes, bug fixes, and performance improvements that are planned for the next major release.',
    trades: 'You get new analysis improvements sooner, but upgrades can surface fresh findings earlier than on the stable defaults.',
  },
  bootstrapFiles: {
    summary: 'Files executed before PHPStan starts analysing code.',
    rationale: 'Use bootstrapFiles for runtime initialization that PHPStan needs, like a custom autoloader, class aliases, constants, or PHAR loading. These files are actually executed by PHP before analysis begins.',
    trades: 'Because they run at analysis time, bootstrap files should stay deterministic and limited to setup code.',
  },
  autoloadFiles: {
    summary: 'Extra files scanned through PHPStan’s scanFiles option.',
    rationale: 'scanFiles lets PHPStan discover symbols from standalone files that are outside analysed paths or Composer autoloading. This is useful for global functions, constants, or helper definitions that should be known during analysis.',
    trades: 'These files are parsed for symbols, not executed like bootstrapFiles, so runtime setup still belongs in bootstrapFiles.',
  },
  baseline: {
    summary: 'A baseline file to suppress existing technical debt.',
    rationale: 'Allows you to adopt deep strictness checks (e.g. Level 8) today without having to resolve 1200 existing errors at once. PHPStan logs current errors in baseline.neon and ignores them so you can focus on writing pristine code going forward.',
    trades: 'Baseline errors become state, and you must review the baseline to keep it from rotting or expanding.',
  },
  sidzIgnoreMagicNumbers: {
    summary: 'Spares raw numbers from magic number analysis checks.',
    rationale: 'Specifies which common raw numbers (like 0, 1, or offset indices) are safe to use in business statements. Prevents cluttering code with constants for trivial counts or standard unit loops.',
    trades: 'Sparing too many numbers defeats the purpose of the policy, allowing raw constants to hide domain rules or thresholds.',
  },
  sidzIgnoreNumericStrings: {
    summary: 'Ignores numeric string literals during magic checks.',
    rationale: 'Enables skipping raw numeric string evaluations like "3.14" or "100" in comparisons or parameter triggers, preventing warnings on numeric payload strings.',
    trades: 'Allows developers to write naked strings representing domain values, potentially bypassing strict constants checks.',
  },
  reportUnmatchedIgnoredErrors: {
    summary: 'Reports ignored errors that no longer occur in the code.',
    rationale: 'Keeps ignoreErrors tidy by flagging patterns that no longer match any reported error. This is part of normal PHPStan 2.x configuration and helps prevent stale suppressions from silently piling up.',
    trades: 'Large refactors can temporarily surface cleanup work, but the config stays honest.',
  },
  checkImplicitMixed: {
    summary: 'Enables level-10-style checks for implicit mixed.',
    rationale: 'PHPStan 2.x level 10 reports implicit mixed, not just explicit mixed. This switch lets you opt into that stricter behaviour even when you are not otherwise running level 10.',
    trades: 'Expect more findings in code that still relies on missing type declarations.',
  },
  checkBenevolentUnionTypes: {
    summary: 'Strictly checks benevolent union types like array-key.',
    rationale: 'Benevolent union types stay lenient even at the highest core level. Enabling this option tightens those checks so PHPStan reports unsafe assumptions around array keys and similar helper types.',
    trades: 'It improves precision, but can add findings in code that depended on PHPStan’s usual leniency here.',
  },
};
