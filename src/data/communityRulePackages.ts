/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CommunityRulePackage } from '../types';
import { EXTENSIONS_LIBRARY_BY_ID } from './phpstanExtensionsLibrary';
import { getExtensionIncludeBasePath } from '../lib/phpstanExtensions';

/**
 * For packages also toggled in the Extension Library, derive the composer
 * package name and include paths from that single source of truth instead of
 * hand-duplicating them here, so the two pickers can't drift out of sync.
 */
function requireLinkedExtension(extensionId: string) {
  const extension = EXTENSIONS_LIBRARY_BY_ID[extensionId];
  if (!extension) {
    throw new Error(`Unknown linkedExtensionId "${extensionId}": no matching entry in EXTENSIONS_LIBRARY.`);
  }
  return extension;
}

function linkedPackageName(extensionId: string): string {
  return requireLinkedExtension(extensionId).composerPackage;
}

function linkedIncludes(extensionId: string): string[] {
  const extension = requireLinkedExtension(extensionId);
  return extension.includes.map((file) => `${getExtensionIncludeBasePath(extensionId)}/${file}`);
}

export const COMMUNITY_RULE_PACKAGES: CommunityRulePackage[] = [
  {
    id: 'ergebnis-rules',
    packageName: 'ergebnis/phpstan-rules',
    displayName: 'Ergebnis Rules',
    category: 'strictness',
    ruleCount: 31,
    recommendedFor: ['libraries', 'modern codebases', 'strict teams'],
    avoidWhen: ['legacy projects with broad dynamic patterns', 'teams that are still adopting basic PHPStan levels'],
    composerRequireDev: 'composer require --dev ergebnis/phpstan-rules',
    includes: [],
    configurationHints: [
      'Manual include/configuration required because this advisor does not ship a verified include path for the package yet.',
      'Start with a narrow subset if phpstan/phpstan-strict-rules is already installed to avoid duplicate strictness noise.'
    ],
    highlightedRules: [
      {
        ruleClass: 'Ergebnis\\PHPStan\\Rules\\DeclareStrictTypesRule',
        title: 'Enforce strict types',
        problem: 'Files quietly rely on weak typing defaults.',
        value: 'Makes library boundaries and review expectations explicit.',
        risk: 'Can surface a lot of fixes in mixed legacy code.'
      },
      {
        ruleClass: 'Ergebnis\\PHPStan\\Rules\\Classes\\FinalRule',
        title: 'Prefer final classes',
        problem: 'Accidental inheritance grows unsupported extension points.',
        value: 'Keeps APIs intentional and easier to maintain.',
        risk: 'Needs careful exceptions for framework extension hooks.'
      },
      {
        ruleClass: 'Ergebnis\\PHPStan\\Rules\\PhpUnit\\NoErrorSuppressionRule',
        title: 'No silent suppression',
        problem: 'Error suppression hides real production mistakes.',
        value: 'Makes failures reviewable instead of magical.',
        risk: 'Can be noisy when old code still relies on suppression.'
      }
    ],
    defaultRecommendation: 'suggested'
  },
  {
    id: 'shipmonk-rules',
    packageName: 'shipmonk/phpstan-rules',
    displayName: 'ShipMonk Rules',
    category: 'type-safety',
    ruleCount: 37,
    recommendedFor: ['serious production apps', 'advanced PHPStan users', 'high-level codebases'],
    avoidWhen: ['very old projects without solid types', 'teams that are still below PHPStan level 8'],
    composerRequireDev: 'composer require --dev shipmonk/phpstan-rules',
    includes: [],
    configurationHints: [
      'Manual include/configuration required because this advisor does not ship a verified include path for the package yet.',
      'Treat it as a follow-up after core strictness and framework extensions are under control.'
    ],
    highlightedRules: [
      {
        ruleClass: 'ShipMonk\\PHPStan\\Rule\\ForbidNullSafeMethodCallOnNonNullableRule',
        title: 'Catch nullable misuse',
        problem: 'Code performs nullable operations where types should already be definite.',
        value: 'Removes defensive noise and exposes real type gaps.',
        risk: 'Older codebases can produce a large first wave of findings.'
      },
      {
        ruleClass: 'ShipMonk\\PHPStan\\Rule\\UnsafeArrayKeyRule',
        title: 'Unsafe array key checks',
        problem: 'Array lookups use keys with shaky guarantees.',
        value: 'Stops undefined-key bugs before runtime.',
        risk: 'Requires stronger array-shape modelling.'
      },
      {
        ruleClass: 'ShipMonk\\PHPStan\\Rule\\EnumMatchDefaultRule',
        title: 'Enum match default control',
        problem: 'Default branches hide newly added enum cases.',
        value: 'Makes enum exhaustiveness explicit.',
        risk: 'Can conflict with broad defensive coding styles.'
      }
    ],
    defaultRecommendation: 'advanced'
  },
  {
    id: 'spaze-disallowed-calls',
    packageName: 'spaze/phpstan-disallowed-calls',
    displayName: 'Spaze Disallowed Calls',
    category: 'security',
    ruleCount: 38,
    recommendedFor: ['security-sensitive projects', 'policy enforcement', 'teams with forbidden API lists'],
    avoidWhen: ['projects without clear call policies', 'teams expecting useful results without custom configuration'],
    composerRequireDev: 'composer require --dev spaze/phpstan-disallowed-calls',
    includes: [],
    configurationHints: [
      'Manual configuration required: define disallowed functions, methods, superglobals, or dynamic calls in your project parameters.',
      'Prefer starting with a small ban list so the signal stays actionable.'
    ],
    highlightedRules: [
      {
        ruleClass: 'Spaze\\PHPStan\\Rules\\Disallowed\\DisallowedFunctionRule',
        title: 'Disallow risky functions',
        problem: 'Teams accidentally keep using unsafe or deprecated helpers.',
        value: 'Lets security and platform rules live in static analysis.',
        risk: 'Needs explicit allow/deny lists to avoid becoming vague theater.'
      },
      {
        ruleClass: 'Spaze\\PHPStan\\Rules\\Disallowed\\DisallowedSuperglobalRule',
        title: 'Block superglobals',
        problem: 'Direct superglobal access bypasses validation and abstractions.',
        value: 'Pushes code toward safer request/input boundaries.',
        risk: 'Legacy code can light up quickly.'
      },
      {
        ruleClass: 'Spaze\\PHPStan\\Rules\\Disallowed\\DisallowedDynamicCallRule',
        title: 'Disallow dynamic calls',
        problem: 'Dynamic invocation hides what code is really executed.',
        value: 'Improves auditability and security review.',
        risk: 'Framework-heavy code may need tailored exceptions.'
      }
    ],
    defaultRecommendation: 'advanced'
  },
  {
    id: 'voku-rules-advisor',
    packageName: linkedPackageName('voku-rules'),
    displayName: 'voku Rules',
    category: 'type-safety',
    ruleCount: 13,
    recommendedFor: ['legacy modernization', 'condition-heavy code', 'null-safety cleanups'],
    avoidWhen: ['projects already overwhelmed by strict-rules findings', 'teams that only want core-level checks'],
    composerRequireDev: `composer require --dev ${linkedPackageName('voku-rules')}`,
    includes: linkedIncludes('voku-rules'),
    configurationHints: [
      'Optional voku parameter tuning is available in the extension library section after enabling the package.'
    ],
    highlightedRules: [
      {
        ruleClass: 'Voku\\PHPStan\\Rules\\Conditions\\WrongVariableNameInElseIfConditionRule',
        title: 'Validate conditions',
        problem: 'Condition branches compare the wrong values or variables.',
        value: 'Catches subtle review-resistant branching bugs.',
        risk: 'Can overlap with higher-level PHPStan and strict rule packs.'
      },
      {
        ruleClass: 'Voku\\PHPStan\\Rules\\Operators\\BinaryOperatorRule',
        title: 'Binary operator checks',
        problem: 'Comparisons and operators mix types unsafely.',
        value: 'Finds suspicious conditions and type-confused operations.',
        risk: 'May surface many legacy edge cases.'
      },
      {
        ruleClass: 'Voku\\PHPStan\\Rules\\Cast\\WrongCastRule',
        title: 'Wrong cast detection',
        problem: 'Casting hides invalid assumptions instead of fixing types.',
        value: 'Exposes incorrect coercions before runtime.',
        risk: 'Requires follow-up typing work in old code.'
      }
    ],
    defaultRecommendation: 'suggested',
    linkedExtensionId: 'voku-rules'
  },
  {
    id: 'staabm-dba',
    packageName: 'staabm/phpstan-dba',
    displayName: 'PHPStan DBA',
    category: 'database',
    ruleCount: 7,
    recommendedFor: ['DB-heavy applications', 'projects with raw SQL strings', 'PDO-heavy services'],
    avoidWhen: ['projects without database schema access', 'codebases with almost no SQL string analysis value'],
    composerRequireDev: 'composer require --dev staabm/phpstan-dba',
    includes: [],
    configurationHints: [
      'Manual configuration required: connect schema metadata or query analysis context before expecting useful SQL diagnostics.',
      'Use it where SQL strings are an important production risk, not just because it exists.'
    ],
    highlightedRules: [
      {
        ruleClass: 'Staabm\\PHPStanDba\\Rules\\SyntaxErrorInPreparedStatementRule',
        title: 'SQL syntax validation',
        problem: 'Broken SQL strings only fail at runtime.',
        value: 'Catches syntax issues during CI.',
        risk: 'Needs a database-aware setup to reach full value.'
      },
      {
        ruleClass: 'Staabm\\PHPStanDba\\Rules\\PdoStatementExecuteRule',
        title: 'PDO statement checks',
        problem: 'Prepared statements use invalid shapes or parameters.',
        value: 'Improves confidence in low-level DB calls.',
        risk: 'Extra setup cost for projects with thin DB usage.'
      },
      {
        ruleClass: 'Staabm\\PHPStanDba\\Rules\\ExplainQueryPlanRule',
        title: 'Query plan analyzer',
        problem: 'Expensive or invalid SQL hides in strings.',
        value: 'Surfaces risky queries earlier in review.',
        risk: 'Can become overkill outside DB-heavy applications.'
      }
    ],
    defaultRecommendation: 'advanced'
  },
  {
    id: 'larastan-advisor',
    packageName: linkedPackageName('larastan'),
    displayName: 'Larastan',
    category: 'framework',
    ruleCount: 18,
    recommendedFor: ['Laravel projects', 'Eloquent-heavy apps', 'teams using Artisan/config magic'],
    avoidWhen: ['non-Laravel codebases', 'framework-agnostic libraries'],
    composerRequireDev: `composer require --dev ${linkedPackageName('larastan')}`,
    includes: linkedIncludes('larastan'),
    configurationHints: [
      'Recommend only for Laravel codebases. This advisor reuses the existing Larastan extension toggle.'
    ],
    highlightedRules: [
      {
        ruleClass: 'Larastan\\Larastan\\Rules\\ModelRule',
        title: 'Model and relation checks',
        problem: 'Eloquent relationships and model properties stay too magical.',
        value: 'Gives Laravel projects practical static types.',
        risk: 'Not useful outside Laravel.'
      },
      {
        ruleClass: 'Larastan\\Larastan\\Rules\\ConfigRule',
        title: 'Config usage checks',
        problem: 'Config keys and return assumptions drift silently.',
        value: 'Tightens app configuration lookups.',
        risk: 'Needs a real Laravel app context.'
      },
      {
        ruleClass: 'Larastan\\Larastan\\Rules\\CommandRule',
        title: 'Command and translation checks',
        problem: 'Console and translation usage can hide invalid assumptions.',
        value: 'Improves framework-specific confidence where core PHPStan cannot.',
        risk: 'Framework-specific signal only.'
      }
    ],
    defaultRecommendation: 'recommended',
    linkedExtensionId: 'larastan'
  },
  {
    id: 'symplify-rules',
    packageName: 'symplify/phpstan-rules',
    displayName: 'Symplify Rules',
    category: 'framework',
    ruleCount: 92,
    recommendedFor: ['Symfony projects', 'Doctrine codebases', 'Rector-heavy maintenance'],
    avoidWhen: ['generic apps without Symfony/Doctrine context', 'teams that dislike opinionated framework rules'],
    composerRequireDev: 'composer require --dev symplify/phpstan-rules',
    includes: [],
    configurationHints: [
      'Manual include/configuration required because this advisor does not ship a verified include path for the package yet.',
      'Best used when Symfony, Doctrine, Rector, or PHPUnit conventions matter in the same repository.'
    ],
    highlightedRules: [
      {
        ruleClass: 'Symplify\\PHPStanRules\\Rules\\NoDebugFunctionRule',
        title: 'No debug leftovers',
        problem: 'dump(), var_dump(), and debugging leftovers slip into merges.',
        value: 'Keeps framework code cleaner before review.',
        risk: 'Opinionated for teams that intentionally allow local debug helpers.'
      },
      {
        ruleClass: 'Symplify\\PHPStanRules\\Rules\\Doctrine\\NoEntityManagerGetRepositoryRule',
        title: 'Doctrine repository discipline',
        problem: 'Direct service-locator repository access weakens architecture.',
        value: 'Pushes code toward more explicit boundaries.',
        risk: 'Framework rules can feel prescriptive.'
      },
      {
        ruleClass: 'Symplify\\PHPStanRules\\Rules\\PHPUnit\\NoMockOnlyTestRule',
        title: 'PHPUnit mock rules',
        problem: 'Tests drift into weak, mock-only assertions.',
        value: 'Helps test suites stay meaningful.',
        risk: 'Can be noisy if the suite relies heavily on mocking style.'
      }
    ],
    defaultRecommendation: 'advanced'
  },
  {
    id: 'slam-extensions',
    packageName: 'slam/phpstan-extensions',
    displayName: 'Slam Extensions',
    category: 'architecture',
    ruleCount: 14,
    recommendedFor: ['projects that want deterministic time handling', 'teams banning globals/static anti-patterns'],
    avoidWhen: ['codebases not ready to introduce abstractions for time or process access'],
    composerRequireDev: 'composer require --dev slam/phpstan-extensions',
    includes: [],
    configurationHints: [
      'Manual include/configuration required because this advisor does not ship a verified include path for the package yet.',
      'Expect follow-up refactors toward clock, filesystem, and process abstractions.'
    ],
    highlightedRules: [
      {
        ruleClass: 'Slam\\PHPStan\\NoDateTimeNowRule',
        title: 'No direct current time calls',
        problem: 'Code depends on global time directly.',
        value: 'Makes tests and deterministic services easier.',
        risk: 'Usually requires a clock abstraction rollout.'
      },
      {
        ruleClass: 'Slam\\PHPStan\\NoGlobalsRule',
        title: 'No globals in context',
        problem: 'Global state hides dependencies and side effects.',
        value: 'Improves architecture review and testability.',
        risk: 'Legacy apps can light up quickly.'
      },
      {
        ruleClass: 'Slam\\PHPStan\\UnsafeShellExecRule',
        title: 'Unsafe process/filesystem usage',
        problem: 'Direct shell or filesystem calls bypass safer wrappers.',
        value: 'Useful for security and deterministic automation.',
        risk: 'May require substantial wrapper adoption.'
      }
    ],
    defaultRecommendation: 'advanced'
  },
  {
    id: 'type-coverage',
    packageName: 'tomasvotruba/type-coverage',
    displayName: 'Type Coverage',
    category: 'migration',
    ruleCount: 5,
    recommendedFor: ['teams increasing typing gradually', 'CI ratchets', 'measurable migration work'],
    avoidWhen: ['teams looking for correctness without any threshold ownership'],
    composerRequireDev: 'composer require --dev tomasvotruba/type-coverage',
    includes: [],
    configurationHints: [
      'Manual configuration required: define thresholds that match your rollout plan.',
      'Use it as a ratchet, not a replacement for real correctness checks.'
    ],
    highlightedRules: [
      {
        ruleClass: 'TypeCoverage\\Rules\\ParameterTypeCoverageRule',
        title: 'Parameter coverage thresholds',
        problem: 'Typing work has no measurable target.',
        value: 'Lets teams ratchet toward fuller signatures.',
        risk: 'A bad threshold quickly becomes metric theater.'
      },
      {
        ruleClass: 'TypeCoverage\\Rules\\ReturnTypeCoverageRule',
        title: 'Return coverage thresholds',
        problem: 'Return types remain untracked during migration.',
        value: 'Makes refactoring progress visible in CI.',
        risk: 'Thresholds need ownership and iteration.'
      },
      {
        ruleClass: 'TypeCoverage\\Rules\\PropertyTypeCoverageRule',
        title: 'Property coverage thresholds',
        problem: 'Typed properties lag behind without pressure.',
        value: 'Encourages incremental modernization.',
        risk: 'Coverage numbers alone do not guarantee good design.'
      }
    ],
    defaultRecommendation: 'suggested'
  },
  {
    id: 'unused-public',
    packageName: 'tomasvotruba/unused-public',
    displayName: 'Unused Public',
    category: 'architecture',
    ruleCount: 5,
    recommendedFor: ['libraries', 'applications with bloated public APIs', 'refactoring passes'],
    avoidWhen: ['public libraries without reliable usage context', 'packages where public surface is intentionally broad'],
    composerRequireDev: 'composer require --dev tomasvotruba/unused-public',
    includes: [],
    configurationHints: [
      'Manual configuration required because public API analysis depends on reliable project usage context.',
      'Review findings carefully for packages consumed outside the repository.'
    ],
    highlightedRules: [
      {
        ruleClass: 'UnusedPublic\\Rules\\UnusedPublicMethodRule',
        title: 'Unused public methods',
        problem: 'Public APIs grow without real callers.',
        value: 'Finds safe cleanup candidates.',
        risk: 'False positives are possible for external consumers.'
      },
      {
        ruleClass: 'UnusedPublic\\Rules\\UnusedPublicPropertyRule',
        title: 'Unused public properties',
        problem: 'Public state stays open wider than needed.',
        value: 'Encourages narrower surfaces and better encapsulation.',
        risk: 'Framework reflection can require exceptions.'
      },
      {
        ruleClass: 'UnusedPublic\\Rules\\UnusedPublicConstantRule',
        title: 'Unused public constants',
        problem: 'Constants remain public without clear consumers.',
        value: 'Helps trim accidental API surface.',
        risk: 'Libraries need extra care before deleting symbols.'
      }
    ],
    defaultRecommendation: 'advanced'
  },
  {
    id: 'cognitive-complexity',
    packageName: 'tomasvotruba/cognitive-complexity',
    displayName: 'Cognitive Complexity',
    category: 'complexity',
    ruleCount: 3,
    recommendedFor: ['large classes', 'overloaded services', 'hard-to-review methods'],
    avoidWhen: ['teams without agreed thresholds', 'projects that treat metrics as truth instead of review prompts'],
    composerRequireDev: 'composer require --dev tomasvotruba/cognitive-complexity',
    includes: [],
    configurationHints: [
      'Manual configuration required: tune thresholds before using the metric as a CI gate.',
      'Use it to start discussions about complexity, not to automate style wars.'
    ],
    highlightedRules: [
      {
        ruleClass: 'CognitiveComplexity\\Rules\\MethodCognitiveComplexityRule',
        title: 'Method complexity',
        problem: 'Methods become harder to understand and review.',
        value: 'Surfaces refactor targets before they become sticky.',
        risk: 'Untuned thresholds create noisy dashboards.'
      },
      {
        ruleClass: 'CognitiveComplexity\\Rules\\ClassCognitiveComplexityRule',
        title: 'Class complexity',
        problem: 'Services absorb too many responsibilities.',
        value: 'Encourages smaller, reviewable units.',
        risk: 'Large orchestration classes may need explicit exceptions.'
      },
      {
        ruleClass: 'CognitiveComplexity\\Rules\\DependencyTreeRule',
        title: 'Dependency tree complexity',
        problem: 'Dependency graphs hide too much operational load.',
        value: 'Highlights classes that need design attention.',
        risk: 'Metric thresholds need careful calibration.'
      }
    ],
    defaultRecommendation: 'suggested'
  }
];
