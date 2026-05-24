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
  { level: '1', title: 'Level 1: Basic Structure', desc: 'Possibly undefined variables, unknown magic methods, incorrect property accesses.', strictnessLabel: 'Basic syntax checks', color: 'text-slate-600' },
  { level: '2', title: 'Level 2: Strict Calls', desc: 'Unknown classes/methods in helper docs. Enforces annotations accuracy. Great first goal!', strictnessLabel: 'Standard API checks', color: 'text-emerald-600' },
  { level: '3', title: 'Level 3: Return & Assign Mismatch', desc: 'Return types, property assignment types, and parameter checks on arrays/iterables.', strictnessLabel: 'Type assignment verified', color: 'text-emerald-700' },
  { level: '4', title: 'Level 4: Unreachable & Dead Code', desc: 'Unreachable code blocks, always-true/false comparisons, dead catch blocks.', strictnessLabel: 'Dead branch checked', color: 'text-indigo-600' },
  { level: '5', title: 'Level 5: Strict Call Argument Types', desc: 'Checks type safety of values passed to functions and methods strictly against signatures.', strictnessLabel: 'Strict argument checks', color: 'text-indigo-700' },
  { level: '6', title: 'Level 6: Missing Type Annotations', desc: 'Enforces adding missing type hints for iterables/arrays (e.g. string[] instead of array).', strictnessLabel: 'Missing iterable check', color: 'text-indigo-700' },
  { level: '7', title: 'Level 7: Union Mismatches', desc: 'Partially null or invalid method calls on union types (e.g. calling method on User|null).', strictnessLabel: 'Union type verified', color: 'text-amber-600' },
  { level: '8', title: 'Level 8: Nullable access checks', desc: 'Reports method calls and property access on nullable values. Recommended default for maintained application code.', strictnessLabel: 'Nullable access checks', color: 'text-rose-600' },
  { level: '9', title: 'Level 9: Mixed Types Banished', desc: 'Explicitly forbids "mixed" types. Everything must be structural. The ultimate code shield.', strictnessLabel: 'Mixed types banished', color: 'text-rose-700 font-semibold' },
  { level: '10', title: 'Level 10: Full Strictness', desc: 'Enforces strict typing on all method results, variables, list values, check array values are not empty, and complete generics checks.', strictnessLabel: 'Maximum type strictness', color: 'text-red-600 font-extrabold' },
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
    checkMissingIterableValueType: true,
    checkGenericClassInNonGenericObjectType: true,
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
        checkMissingIterableValueType: true,
        checkGenericClassInNonGenericObjectType: true,
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
        checkMissingIterableValueType: true,
        checkGenericClassInNonGenericObjectType: true,
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
        checkMissingIterableValueType: true,
        checkGenericClassInNonGenericObjectType: true,
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
    description: 'Extremely strict layout for libraries and public interfaces. Enforces explicit typing and turns on bleedingEdge to ensure long-term static resilience.',
    config: {
      level: '9',
      targetVersion: '2.x',
      phpVersion: '80400',
      paths: ['src'],
      excludes: ['vendor', 'tests/fixtures'],
      bootstrapFiles: [],
      autoloadFiles: [],
      strictRules: {
        checkMissingIterableValueType: true,
        checkGenericClassInNonGenericObjectType: true,
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
        checkMissingIterableValueType: false,
        checkGenericClassInNonGenericObjectType: false,
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
        checkMissingIterableValueType: false,
        checkGenericClassInNonGenericObjectType: false,
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
    description: 'Enforces phpstan level max with bleedingEdge enabled. Best for pipelines validating merge requests before deploy. Strict, secure, and aggressive ruleset.',
    config: {
      level: 'max',
      targetVersion: '2.x',
      phpVersion: '80400',
      paths: ['src', 'tests'],
      excludes: ['vendor', 'bootstrap/cache', 'storage'],
      bootstrapFiles: [],
      autoloadFiles: [],
      strictRules: {
        checkMissingIterableValueType: true,
        checkGenericClassInNonGenericObjectType: true,
        treatPhpDocTypesAsCertain: true,
        bleedingEdge: true,
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
    rationale: 'PHPStan has levels 0 to 9. Level 0 is lax (only crashes), Level 8/9 is extremely strict. Progressing through levels ensures your code has no structural dead-ends or unexpected type drifts.',
    trades: 'Higher levels require complete type-hinting of variables, docs, and union parameters which might require refactoring some legacy arrays.',
  },
  checkMissingIterableValueType: {
    summary: 'Enforces specifying types within array traversables.',
    rationale: 'Instead of accepting a raw "array", it forces you to declare "array<string, User>" or similar. This lets PHPStan know exactly what is inside the array during loops.',
    trades: 'Requires writing detailed PHPDoc notations for nested lists or structures.',
  },
  checkGenericClassInNonGenericObjectType: {
    summary: 'Flags non-generic usage of generic classes.',
    rationale: 'If a class is defined as UserRepository<User>, using UserRepository on its own without defining context is flagged.',
    trades: 'If dependencies are poorly configured, this can generate noise, but it makes class interactions extremely robust.',
  },
  treatPhpDocTypesAsCertain: {
    summary: 'Trusts docblock type-declarations unconditionally.',
    rationale: 'If comments say "@var User $user", PHPStan treats $user as a User. Turning this off tells PHPStan to verify if the comment is actually true.',
    trades: 'Disabling this causes checks on whether you over-asserted types that PHP can\'t natively restrict, which is useful to detect incorrect typing in older dependencies.',
  },
  bleedingEdge: {
    summary: 'Enables upcoming rules and experimental features before next major release.',
    rationale: 'PHPStan is constantly improving. BleedingEdge loads the next version\'s features immediately so you are ahead of breaking changes.',
    trades: 'Updates to PHPStan may occasionally introduce fresh errors in your codebase due to strict rules.',
  },
  bootstrapFiles: {
    summary: 'File loaded before indexer parsing.',
    rationale: 'Allows defining constants, loading custom helper macros, or setting global container references so PHPStan doesn\'t fail with "Unknown constant/function".',
    trades: 'Cannot contain code executed synchronously, only helper bootstraps.',
  },
  autoloadFiles: {
    summary: 'Files registered for composer autoload bypass.',
    rationale: 'Tells PHPStan where custom procedural PHP blocks or global mock wrappers lie in case Composer is not fully used.',
    trades: 'Legacy helper - usually bootstrapFiles or a custom autoloader mapping is preferred today.',
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
    rationale: 'Keeps your configuration file clean. If you use ignoreErrors to suppress issues, PHPStan will alert you if an ignored line gets refactored and no longer generates that error.',
    trades: 'Can create minor noise in active refactoring, but maintains pristine rules files.',
  },
  checkImplicitMixed: {
    summary: 'Flags implicit mixed types from missing type hints.',
    rationale: 'Ensures strict type checking where types cannot be resolved due to missing return signatures or undefined arguments, forcing strong schema assertions.',
    trades: 'Extremely strict, may require significant type definition work on medium-sized legacy codebases.',
  },
  checkBenevolentUnionTypes: {
    summary: 'Enforces strict checking on benevolent union types.',
    rationale: 'Benevolent union types are loose type wrappers (e.g., from native php internal functions). Enforcing checks prevents assumptions and uncovers hidden bugs.',
    trades: 'Increases typing strictness on built-in function returns.',
  },
};
