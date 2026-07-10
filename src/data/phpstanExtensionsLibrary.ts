/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PhpStanExtension {
  id: string;
  name: string;
  composerPackage: string;
  category: 'Official' | 'Framework' | 'Rule Pack' | 'Testing' | 'Database' | 'Assertion' | 'AI Hardening';
  typeLabel: string;
  includes: string[]; // files inside package e.g. ['extension.neon', 'rules.neon']
  tags: string[];
  strictnessImpact: 'None' | 'Low' | 'Medium' | 'High';
  target: string;
  description: string;
  recommendedFor: string;
  risk?: string;
  minPhpVersion: number; // e.g. 8.2 or 7.4
  supportsExtensionInstaller: boolean;
  capabilities: {
    typeInference: string[];
    ruleEnforcement: string[];
    infrastructure: string[];
  };
}

export const EXTENSIONS_LIBRARY: PhpStanExtension[] = [
  {
    id: 'sidz-rules',
    name: 'sidz / phpstan-rules',
    composerPackage: 'sidz/phpstan-rules',
    category: 'AI Hardening',
    typeLabel: '3rd party rule pack',
    includes: ['rules.neon'],
    tags: ['magic-numbers', 'ai-generated-code', 'constants', 'code-quality', 'rule-pack'],
    strictnessImpact: 'Medium',
    target: 'AI Output Hardening & Magic Number Detection',
    description: 'Prevents undocumented numeric literals from spreading through generated or manually written code. Catches unexplained raw numbers confidently.',
    recommendedFor: 'AI-generated code review gates, legacy cleanup, library code, business logic with domain thresholds, CI pipelines where constants should explain intent.',
    risk: 'Can be noisy in tests, fixtures, migrations and low-level numeric code.',
    minPhpVersion: 7.4,
    supportsExtensionInstaller: true,
    capabilities: {
      typeInference: [],
      ruleEnforcement: [
        'Ignored number threshold validation',
        'Numeric strings verification support',
        'Prevents naked parameters (such as $timeout = 1250)'
      ],
      infrastructure: []
    }
  },
  {
    id: 'voku-rules',
    name: 'voku / phpstan-rules',
    composerPackage: 'voku/phpstan-rules',
    category: 'Rule Pack',
    typeLabel: '3rd party rule pack',
    includes: ['rules.neon'],
    tags: ['voku', 'conditions', 'defensive-php', 'rule-pack'],
    strictnessImpact: 'Medium',
    target: 'Condition safety and defensive checks',
    description: 'Adds opinionated rule checks for suspicious conditions, comparisons, operator mix-ups, and assignments inside conditions.',
    recommendedFor: 'Teams that want extra review pressure around conditions, comparisons, and defensive control-flow checks.',
    minPhpVersion: 8.2,
    supportsExtensionInstaller: true,
    capabilities: {
      typeInference: ['Operator Type Compatibility Checks'],
      ruleEnforcement: ['Unsafe/Redundant Conditions', 'Assignments Inside Conditions', 'Yoda Comparison Enforcements'],
      infrastructure: []
    }
  },
  {
    id: 'strict-rules',
    name: 'phpstan/phpstan-strict-rules',
    composerPackage: 'phpstan/phpstan-strict-rules',
    category: 'Official',
    typeLabel: 'Official rule pack',
    includes: ['rules.neon'],
    tags: ['strictness', 'correctness', 'official'],
    strictnessImpact: 'High',
    target: 'strict greenfield projects and absolute safety',
    description: 'Enables additional, extremely strict, opinionated, compile-time rules to rule out style and safety exceptions.',
    recommendedFor: 'Libraries, clean greenfield projects, and highly compliant teams willing to fix and refactor deep dynamic structures.',
    risk: 'Extremely high strictness impact. Will immediately flag standard dynamic attributes usage.',
    minPhpVersion: 7.4,
    supportsExtensionInstaller: true,
    capabilities: {
      typeInference: [],
      ruleEnforcement: ['Method Call Strictness', 'Explicit Variable Assignment validations', 'Strict Comparison Checks'],
      infrastructure: []
    }
  },
  {
    id: 'doctrine',
    name: 'phpstan/phpstan-doctrine',
    composerPackage: 'phpstan/phpstan-doctrine',
    category: 'Database',
    typeLabel: 'Framework extension',
    includes: ['extension.neon', 'rules.neon'],
    tags: ['database', 'orm', 'annotations'],
    strictnessImpact: 'Medium',
    target: 'Doctrine DBAL & ORM relationships mappings',
    description: 'Provides type inference and return-type resolution for query builders, entity annotations, entity repositories, and active associations.',
    recommendedFor: 'Symfony MVC platforms or modern full-stack setups utilizing Doctrine ORM wrapper components.',
    minPhpVersion: 8.0,
    supportsExtensionInstaller: true,
    capabilities: {
      typeInference: ['Query Builder Return Type Inference', 'Entity Attribute mapping checks'],
      ruleEnforcement: ['Repository Signature Verification'],
      infrastructure: []
    }
  },
  {
    id: 'symfony',
    name: 'phpstan/phpstan-symfony',
    composerPackage: 'phpstan/phpstan-symfony',
    category: 'Framework',
    typeLabel: 'Framework extension',
    includes: ['extension.neon', 'rules.neon'],
    tags: ['symfony', 'mvc', 'dependency-injection'],
    strictnessImpact: 'Medium',
    target: 'Symfony DIC parameters validation',
    description: 'Significantly improves Dependency Injection Container (DIC) awareness, validating parameter definitions and lookup return instances.',
    recommendedFor: 'Symfony full-stack frameworks and service bundle controllers compile-safety.',
    minPhpVersion: 8.0,
    supportsExtensionInstaller: true,
    capabilities: {
      typeInference: ['Container Return Instance Awareness', 'Controller Argument Resolving'],
      ruleEnforcement: ['Compiler Passes validation', 'Routing parameters integrity'],
      infrastructure: []
    }
  },
  {
    id: 'larastan',
    name: 'larastan/larastan',
    composerPackage: 'larastan/larastan',
    category: 'Framework',
    typeLabel: 'Framework extension',
    includes: ['extension.neon'],
    tags: ['laravel', 'facades', 'eloquent'],
    strictnessImpact: 'Medium',
    target: 'Laravel models relationship type checks',
    description: 'Resolves Eloquent Model relations and dynamic Facades Magic Methods elegantly without the need for fake placeholder suppressions.',
    recommendedFor: 'Laravel applications seeking concrete typing definitions for database relations and magic facade queries.',
    minPhpVersion: 8.2,
    supportsExtensionInstaller: true,
    capabilities: {
      typeInference: ['Eloquent Relationship Return Types', 'Magic Facade Method Analysis'],
      ruleEnforcement: ['Dynamic Scope Signature Validation'],
      infrastructure: []
    }
  },
  {
    id: 'deprecation-rules',
    name: 'phpstan/phpstan-deprecation-rules',
    composerPackage: 'phpstan/phpstan-deprecation-rules',
    category: 'Official',
    typeLabel: 'Official rule pack',
    includes: ['rules.neon'],
    tags: ['deprecations', 'maintenance', 'official'],
    strictnessImpact: 'Low',
    target: 'upstream deprecated entities detection',
    description: 'Helps trace upstream legacy structures and API deprecations to future-proof current dependencies upgrade pathways.',
    recommendedFor: 'Upgrading older codebases and deprecation audits inside microservice environments.',
    minPhpVersion: 7.2,
    supportsExtensionInstaller: true,
    capabilities: {
      typeInference: [],
      ruleEnforcement: ['Deprecated Class Usage Warning', 'Deprecated Method Call Audits'],
      infrastructure: []
    }
  },
  {
    id: 'phpunit',
    name: 'phpstan/phpstan-phpunit',
    composerPackage: 'phpstan/phpstan-phpunit',
    category: 'Testing',
    typeLabel: 'Testing extension',
    includes: ['extension.neon', 'rules.neon'],
    tags: ['testing', 'assertions', 'mocks'],
    strictnessImpact: 'Low',
    target: 'PHPUnit assertions and mock returns verification',
    description: 'Teaches PHPStan about mock objects types and phpunit assertion results to avoid return-value warning mismatches.',
    recommendedFor: 'Robust continuous integration flows verifying PHPUnit test suites and dynamic class mocks behavior.',
    minPhpVersion: 7.3,
    supportsExtensionInstaller: true,
    capabilities: {
      typeInference: ['Mock Object Typings', 'Assert Assertion Post-Conditions'],
      ruleEnforcement: ['Assertion Type Safety validations'],
      infrastructure: []
    }
  },
  {
    id: 'beberlei-assert',
    name: 'phpstan/phpstan-beberlei-assert',
    composerPackage: 'phpstan/phpstan-beberlei-assert',
    category: 'Assertion',
    typeLabel: 'Official assertion extension',
    includes: ['extension.neon'],
    tags: ['assertions', 'runtime-guards', 'official'],
    strictnessImpact: 'Low',
    target: 'beberlei/assert guard awareness',
    description: 'Teaches PHPStan which beberlei/assert guards refine types, so runtime assertions also improve static analysis.',
    recommendedFor: 'Projects using beberlei/assert to validate inputs or narrow types before deeper domain logic.',
    minPhpVersion: 7.4,
    supportsExtensionInstaller: true,
    capabilities: {
      typeInference: ['Assertion-based Type Narrowing'],
      ruleEnforcement: [],
      infrastructure: []
    }
  },
  {
    id: 'webmozart-assert',
    name: 'phpstan/phpstan-webmozart-assert',
    composerPackage: 'phpstan/phpstan-webmozart-assert',
    category: 'Assertion',
    typeLabel: 'Official assertion extension',
    includes: ['extension.neon'],
    tags: ['assertions', 'runtime-guards', 'official'],
    strictnessImpact: 'Low',
    target: 'webmozart/assert guard awareness',
    description: 'Adds static understanding for webmozart/assert checks so assertions narrow values, arrays, and class strings correctly.',
    recommendedFor: 'Projects that rely on webmozart/assert for validation-heavy application services or shared packages.',
    minPhpVersion: 7.4,
    supportsExtensionInstaller: true,
    capabilities: {
      typeInference: ['Assertion-based Type Narrowing'],
      ruleEnforcement: [],
      infrastructure: []
    }
  },
  {
    id: 'mockery',
    name: 'phpstan/phpstan-mockery',
    composerPackage: 'phpstan/phpstan-mockery',
    category: 'Testing',
    typeLabel: 'Official testing extension',
    includes: ['extension.neon'],
    tags: ['testing', 'mockery', 'official'],
    strictnessImpact: 'Low',
    target: 'Mockery test doubles',
    description: 'Improves static analysis for Mockery expectations, fluent test doubles, and generated mock return types.',
    recommendedFor: 'Test suites that use Mockery instead of, or alongside, PHPUnit-native mocks.',
    minPhpVersion: 7.4,
    supportsExtensionInstaller: true,
    capabilities: {
      typeInference: ['Mockery Expectation Type Inference'],
      ruleEnforcement: [],
      infrastructure: []
    }
  },
  {
    id: 'psl',
    name: 'php-standard-library/phpstan-extension',
    composerPackage: 'php-standard-library/phpstan-extension',
    category: 'Official',
    typeLabel: 'Official library extension',
    includes: ['extension.neon'],
    tags: ['psl', 'utility-library', 'official'],
    strictnessImpact: 'Low',
    target: 'azjezz/psl helper functions',
    description: 'Adds PHPStan knowledge for PSL collection, string, filesystem, and math helpers so utility calls retain accurate types.',
    recommendedFor: 'Codebases built on azjezz/psl that want utility helpers to stay fully typed in analysis.',
    minPhpVersion: 8.1,
    supportsExtensionInstaller: true,
    capabilities: {
      typeInference: ['PSL Helper Return Types'],
      ruleEnforcement: [],
      infrastructure: []
    }
  },
  {
    id: 'nette',
    name: 'phpstan/phpstan-nette',
    composerPackage: 'phpstan/phpstan-nette',
    category: 'Framework',
    typeLabel: 'Official framework extension',
    includes: ['extension.neon'],
    tags: ['nette', 'framework', 'official'],
    strictnessImpact: 'Medium',
    target: 'Nette framework services and DI',
    description: 'Brings Nette-specific container, presenter, and framework service awareness into PHPStan analysis.',
    recommendedFor: 'Nette applications that depend on framework DI, presenters, and generated service wiring.',
    minPhpVersion: 8.1,
    supportsExtensionInstaller: true,
    capabilities: {
      typeInference: ['Container and Service Resolution'],
      ruleEnforcement: [],
      infrastructure: []
    }
  },
  {
    id: 'dibi',
    name: 'phpstan/phpstan-dibi',
    composerPackage: 'phpstan/phpstan-dibi',
    category: 'Database',
    typeLabel: 'Official database extension',
    includes: ['extension.neon'],
    tags: ['database', 'dibi', 'official'],
    strictnessImpact: 'Low',
    target: 'Dibi database abstraction',
    description: 'Adds type support for Dibi database abstractions, result sets, and fluent query usage.',
    recommendedFor: 'Projects using dibi/dibi for database access and query building.',
    minPhpVersion: 8.1,
    supportsExtensionInstaller: true,
    capabilities: {
      typeInference: ['Database Result Type Inference'],
      ruleEnforcement: [],
      infrastructure: []
    }
  }
];

export const EXTENSIONS_LIBRARY_BY_ID: Readonly<Record<string, PhpStanExtension>> = Object.freeze(
  Object.fromEntries(EXTENSIONS_LIBRARY.map((extension) => [extension.id, extension])),
);
