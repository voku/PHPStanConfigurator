/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Puzzle, Terminal, CheckCircle2, AlertCircle, Info, Settings, Check, 
  Compass, Code, Plus, Trash2, ChevronRight, Layers, ShieldAlert, Sparkles, BookOpen
} from 'lucide-react';
import { PhpStanConfig, SelectedExtension, InstallationStrategy, VokuParameters, SidzParameters } from '../types';
import { OFFICIAL_DOC_EXTENSION_PACKAGES, getExtensionComposerPackage, getExtensionIncludeBasePath } from '../lib/phpstanExtensions';

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

interface PhpStanExtensionLibraryProps {
  config: PhpStanConfig;
  onChangeConfig: (newConfig: PhpStanConfig | ((prev: PhpStanConfig) => PhpStanConfig)) => void;
  onAddToast: (msg: string, type: 'success' | 'info') => void;
  onHoverRule?: (rule: string | null) => void;
}

export function PhpStanExtensionLibrary({
  config,
  onChangeConfig,
  onAddToast,
  onHoverRule
}: PhpStanExtensionLibraryProps) {
  // Collapse state for extension cards
  const [expandedExtId, setExpandedExtId] = useState<string | null>(null);

  // Filter state for search
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [newCustomIncludeItem, setNewCustomIncludeItem] = useState('');
  const [newExcludedClassStr, setNewExcludedClassStr] = useState('');

  // Active general features reference category tabs
  const [activeRefTab, setActiveRefTab] = useState<'inference' | 'rule' | 'infrastructure'>('inference');

  // Safeguard values
  const installationStrategy = config.extensions.installationStrategy || 'hybrid';
  
  // Resolve or initialize active selectedExtensions with fallback merging
  const rawExtensions = config.extensions.selectedExtensions || [];
  const defaultExList = [
    { id: 'sidz-rules', enabled: false, selectedIncludes: ['rules.neon'] },
    { id: 'voku-rules', enabled: false, selectedIncludes: ['rules.neon'] },
    { id: 'strict-rules', enabled: false, selectedIncludes: ['rules.neon'] },
    { id: 'deprecation-rules', enabled: false, selectedIncludes: ['rules.neon'] },
    { id: 'doctrine', enabled: config.extensions.doctrine || false, selectedIncludes: ['extension.neon', 'rules.neon'] },
    { id: 'symfony', enabled: config.extensions.symfony || false, selectedIncludes: ['extension.neon', 'rules.neon'] },
    { id: 'larastan', enabled: config.extensions.larastan || false, selectedIncludes: ['extension.neon'] },
    { id: 'phpunit', enabled: false, selectedIncludes: ['extension.neon', 'rules.neon'] },
    { id: 'beberlei-assert', enabled: false, selectedIncludes: ['extension.neon'] },
    { id: 'webmozart-assert', enabled: false, selectedIncludes: ['extension.neon'] },
    { id: 'mockery', enabled: false, selectedIncludes: ['extension.neon'] },
    { id: 'psl', enabled: false, selectedIncludes: ['extension.neon'] },
    { id: 'nette', enabled: false, selectedIncludes: ['extension.neon'] },
    { id: 'dibi', enabled: false, selectedIncludes: ['extension.neon'] }
  ];

  const selectedExtensions = defaultExList.map(def => {
    const existing = rawExtensions.find(e => e.id === def.id);
    return existing ? { ...def, ...existing } : def;
  });

  // Resolve or initialize Voku parameters
  const vokuParams: VokuParameters = config.extensions.vokuParameters || {
    checkForAssignments: false,
    checkYodaConditions: false,
    classesNotInIfConditions: ['AbstractValueObject']
  };

  // Resolve or initialize Sidz parameters
  const sidzParams: SidzParameters = config.extensions.sidzParameters || {
    ignoreMagicNumbers: [0, 1],
    ignoreNumericStrings: false,
    preset: 'balanced'
  };

  // Check current parsed PHP version target to display warnings if needed
  const getPhpTargetDouble = (verCode: string): number => {
    const num = parseInt(verCode, 10);
    if (isNaN(num)) {
      const parsed = parseFloat(verCode);
      return isNaN(parsed) ? 8.2 : parsed;
    }
    const major = Math.floor(num / 10000);
    const minor = Math.floor((num % 10000) / 100);
    return major + (minor / 10);
  };

  const phpVersionDouble = getPhpTargetDouble(config.phpVersion);

  // Synchronise sub-settings to state properly
  const syncWithLegacyAndSet = (
    updatedExtensionsList: SelectedExtension[], 
    updatedStrategy?: InstallationStrategy,
    updatedVokuParams?: VokuParameters,
    updatedSidzParams?: SidzParameters
  ) => {
    const isDoctrineEnabled = updatedExtensionsList.find(e => e.id === 'doctrine')?.enabled || false;
    const isSymfonyEnabled = updatedExtensionsList.find(e => e.id === 'symfony')?.enabled || false;
    const isLarastanEnabled = updatedExtensionsList.find(e => e.id === 'larastan')?.enabled || false;

    onChangeConfig(prev => ({
      ...prev,
      extensions: {
        ...prev.extensions,
        doctrine: isDoctrineEnabled,
        symfony: isSymfonyEnabled,
        larastan: isLarastanEnabled,
        installationStrategy: updatedStrategy || installationStrategy,
        selectedExtensions: updatedExtensionsList,
        vokuParameters: updatedVokuParams || vokuParams,
        sidzParameters: updatedSidzParams || sidzParams
      }
    }));
  };

  const handleApplySidzPreset = (presetType: 'strict' | 'balanced' | 'legacy' | 'ai_hardening') => {
    let ignoreMagicNumbers: number[] = [0, 1];
    let ignoreNumericStrings = true;

    if (presetType === 'strict') {
      ignoreMagicNumbers = [0, 1];
      ignoreNumericStrings = true;
    } else if (presetType === 'balanced') {
      ignoreMagicNumbers = [0, 1, 100];
      ignoreNumericStrings = true;
    } else if (presetType === 'legacy') {
      ignoreMagicNumbers = [0, 1, 100, 200, 404, 500];
      ignoreNumericStrings = false;
    } else if (presetType === 'ai_hardening') {
      ignoreMagicNumbers = [0, 1];
      ignoreNumericStrings = true;
    }

    const nextSidz = {
      ignoreMagicNumbers,
      ignoreNumericStrings,
      preset: presetType
    };

    const updatedExtensionsList = selectedExtensions;
    syncWithLegacyAndSet(updatedExtensionsList, installationStrategy, vokuParams, nextSidz);
    onAddToast(`Applied preset Policy for Magic Number protection.`, 'success');
  };

  const isExcluded = (pattern: string) => {
    return (config.excludes || []).some(esc => esc.toLowerCase().includes(pattern.toLowerCase()));
  };

  const handleToggleExcludesPattern = (pattern: string) => {
    let currentExcludes = config.excludes || [];
    const hasIt = isExcluded(pattern);
    let nextExcludes: string[] = [];

    if (hasIt) {
      nextExcludes = currentExcludes.filter(esc => !esc.toLowerCase().includes(pattern.toLowerCase()));
      onAddToast(`Removed exclusion pattern matching "${pattern}"`, 'info');
    } else {
      nextExcludes = [...currentExcludes, pattern];
      onAddToast(`Added configuration exclusion path for "${pattern}"`, 'success');
    }

    onChangeConfig(prev => ({
      ...prev,
      excludes: nextExcludes
    }));
  };

  const handleStrategyChange = (strategy: InstallationStrategy) => {
    syncWithLegacyAndSet(selectedExtensions, strategy);
    onAddToast(`Installation strategy successfully changed to: ${
      strategy === 'auto_installer' ? 'Auto Installer via composer plugin' :
      strategy === 'manual_includes' ? 'Strict manual neon includes' : 'Hybrid automatic & explicit files override'
    }`, 'info');
  };

  const handleToggleExtension = (extId: string) => {
    const nextList = selectedExtensions.map(ext => {
      if (ext.id === extId) {
        return {
          ...ext,
          enabled: !ext.enabled
        };
      }
      return ext;
    });
    syncWithLegacyAndSet(nextList);

    const activeExt = nextList.find(e => e.id === extId);
    if (activeExt?.enabled) {
      onAddToast(`Activated extension: "${EXTENSIONS_LIBRARY.find(e => e.id === extId)?.name}" in configuration`, 'success');
    } else {
      onAddToast(`Deactivated extension: "${extId}"`, 'info');
    }
  };

  // Handle Doctrine/Symfony Partial include vs Rules toggle ("Enable Inference Only" / "Enable Rules Too")
  const handleSetExtensionLevel = (extId: string, files: string[]) => {
    const nextList = selectedExtensions.map(ext => {
      if (ext.id === extId) {
        return {
          ...ext,
          enabled: true, // Auto-enable if changing levels
          selectedIncludes: files
        };
      }
      return ext;
    });
    syncWithLegacyAndSet(nextList);
    onAddToast(`Inclusion level updated for "${extId}"`, 'success');
  };

  // Toggle specific files for manual mode override
  const handleToggleIncludeFile = (extId: string, file: string) => {
    const nextList = selectedExtensions.map(ext => {
      if (ext.id === extId) {
        const alreadyHas = ext.selectedIncludes.includes(file);
        return {
          ...ext,
          selectedIncludes: alreadyHas 
            ? ext.selectedIncludes.filter(f => f !== file)
            : [...ext.selectedIncludes, file]
        };
      }
      return ext;
    });
    syncWithLegacyAndSet(nextList);
  };

  // Voku parameter modifiers
  const handleSetVokuParam = (key: keyof VokuParameters, val: any) => {
    const nextParams = {
      ...vokuParams,
      [key]: val
    };
    syncWithLegacyAndSet(selectedExtensions, installationStrategy, nextParams);
  };

  const handleAddExcludedClass = () => {
    const trimmed = newExcludedClassStr.trim();
    if (!trimmed) return;
    if (vokuParams.classesNotInIfConditions.includes(trimmed)) {
      onAddToast('Class already excluded in config parameters.', 'info');
      return;
    }
    const nextParams = {
      ...vokuParams,
      classesNotInIfConditions: [...vokuParams.classesNotInIfConditions, trimmed]
    };
    syncWithLegacyAndSet(selectedExtensions, installationStrategy, nextParams);
    setNewExcludedClassStr('');
    onAddToast(`Excluded class "${trimmed}" successfully.`, 'success');
  };

  const handleRemoveExcludedClass = (cls: string) => {
    const nextParams = {
      ...vokuParams,
      classesNotInIfConditions: vokuParams.classesNotInIfConditions.filter(c => c !== cls)
    };
    syncWithLegacyAndSet(selectedExtensions, installationStrategy, nextParams);
    onAddToast(`Exclusion removed for class "${cls}"`, 'info');
  };

  // Custom User includes
  const handleAddCustomInclude = () => {
    const trimmed = newCustomIncludeItem.trim();
    if (!trimmed) return;

    if (config.extensions.customIncludes.includes(trimmed)) {
      onAddToast(`Custom path "${trimmed}" already included.`, 'info');
      return;
    }

    onChangeConfig(prev => ({
      ...prev,
      extensions: {
        ...prev.extensions,
        customIncludes: [...prev.extensions.customIncludes, trimmed]
      }
    }));
    setNewCustomIncludeItem('');
    onAddToast(`Custom include path registered: ${trimmed}`, 'success');
  };

  const handleRemoveCustomInclude = (indexToRemove: number) => {
    onChangeConfig(prev => ({
      ...prev,
      extensions: {
        ...prev.extensions,
        customIncludes: prev.extensions.customIncludes.filter((_, i) => i !== indexToRemove)
      }
    }));
    onAddToast(`Removed manual include override.`, 'info');
  };

  // Render browser filters
  const filteredExtensions = EXTENSIONS_LIBRARY.filter(ext => {
    if (selectedCategory === 'All') return true;
    if (selectedCategory === 'Official') return OFFICIAL_DOC_EXTENSION_PACKAGES.some(pkg => pkg === ext.composerPackage);
    if (selectedCategory === 'Framework') return ext.category === 'Framework';
    if (selectedCategory === 'Testing') return ext.category === 'Testing';
    if (selectedCategory === 'Database') return ext.category === 'Database';
    if (selectedCategory === 'Rule Packs') return ext.category === 'Rule Pack' || ext.category === 'AI Hardening';
    if (selectedCategory === 'Assertions') return ext.category === 'Assertion';
    return true;
  });

  return (
    <div id="phpstan-extension-library-custom-card" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-6">
      
      {/* 3. Title info */}
      <div className="flex items-center gap-1.5 pb-2.5 border-b border-slate-200 justify-between">
        <div className="flex items-center gap-2">
          <Puzzle className="w-4 h-4 text-indigo-600" />
          <h3 className="font-semibold text-xs font-mono uppercase tracking-wider text-slate-800">
            3. Extension Library & Static Analysis Capabilities
          </h3>
        </div>
        <a
          href="https://phpstan.org/user-guide/extension-library"
          target="_blank"
          rel="noreferrer"
          className="text-[10px] bg-slate-100/90 text-slate-700 font-bold px-2 py-0.5 rounded-full font-mono hover:text-indigo-700"
        >
          PHPStan docs reference
        </a>
      </div>

      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
        <p className="text-[11px] text-slate-600 leading-normal">
          PHPStan becomes more useful when extensions teach it about framework services, assertion libraries, mock objects, dynamic return types, and database abstractions.
        </p>
        <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
            Referenced by the official PHPStan extension library docs
          </div>
          <div className="flex flex-wrap gap-1.5">
            {OFFICIAL_DOC_EXTENSION_PACKAGES.map((pkg) => (
              <span
                key={pkg}
                className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-mono text-slate-700"
              >
                {pkg}
              </span>
            ))}
          </div>
        </div>

        {/* Dynamic Static Analysis Capabilities tab reference helper */}
        <div className="border border-slate-200/80 bg-white rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between border-b pb-1.5 border-slate-100">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
              Developer Learn Hub: Code Capabilities
            </span>
            <div className="flex gap-1 text-[9px] font-mono font-semibold">
              <button 
                type="button"
                onClick={() => setActiveRefTab('inference')}
                className={`px-2 py-0.5 rounded ${activeRefTab === 'inference' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-500 hover:text-slate-800'}`}
              >
                Type Inference
              </button>
              <button 
                type="button"
                onClick={() => setActiveRefTab('rule')}
                className={`px-2 py-0.5 rounded ${activeRefTab === 'rule' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-500 hover:text-slate-800'}`}
              >
                Rule Enforcement
              </button>
              <button 
                type="button"
                onClick={() => setActiveRefTab('infrastructure')}
                className={`px-2 py-0.5 rounded ${activeRefTab === 'infrastructure' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-500 hover:text-slate-800'}`}
              >
                Infrastructure
              </button>
            </div>
          </div>

          <div className="text-[10px] leading-relaxed text-slate-600 min-h-[44px]">
            {activeRefTab === 'inference' && (
              <div className="grid grid-cols-3 gap-2">
                <div className="p-1.5 border rounded border-indigo-50 text-indigo-950 bg-indigo-50/10">
                  <p className="font-bold">Dynamic Return Types</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">Calculates generic array shapes dynamically depending on actual string arguments.</p>
                </div>
                <div className="p-1.5 border rounded border-indigo-50 text-indigo-950 bg-indigo-50/10">
                  <p className="font-bold">Type-Specifying Classes</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">Tells analyzer that calling <code className="font-mono text-emerald-600">assertUUID($id)</code> guarantees its type thereafter.</p>
                </div>
                <div className="p-1.5 border rounded border-indigo-50 text-indigo-950 bg-indigo-50/10">
                  <p className="font-bold">Virtual Stub Files</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">Augments system third-party files mapping metadata without rewriting legacy composer vendors.</p>
                </div>
              </div>
            )}

            {activeRefTab === 'rule' && (
              <div className="grid grid-cols-3 gap-2">
                <div className="p-1.5 border rounded border-indigo-50 text-indigo-950 bg-indigo-50/10">
                  <p className="font-bold">Custom Analysis Rules</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">Verifies custom rules like condition parameters assignment errors (voku).</p>
                </div>
                <div className="p-1.5 border rounded border-indigo-50 text-indigo-950 bg-indigo-50/10">
                  <p className="font-bold">Restricted Usage</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">Protects architecture by blocking import files coupling rules locally.</p>
                </div>
                <div className="p-1.5 border rounded border-indigo-50 text-indigo-950 bg-indigo-50/10">
                  <p className="font-bold">Forbidden Class Names</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">Halts developers from instantiating direct native classes (e.g. DateTime) instead of custom wrappers.</p>
                </div>
              </div>
            )}

            {activeRefTab === 'infrastructure' && (
              <div className="grid grid-cols-2 gap-2">
                <div className="p-1.5 border rounded border-indigo-50 text-indigo-950 bg-indigo-50/10">
                  <p className="font-bold">Custom Error Formatters</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">Generates clean JUnit, GitHub Actions annotation lines, or GitLab-flavor output logs.</p>
                </div>
                <div className="p-1.5 border rounded border-indigo-50 text-indigo-950 bg-indigo-50/10">
                  <p className="font-bold">Cache Metadata Generators</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">Interferes cache lifecycle invalidated keys to prevent dynamic stale build errors locally.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Installation Strategy Block */}
      <div className="space-y-3 p-1">
        <div className="flex items-center gap-1.5">
          <Settings className="w-3.5 h-3.5 text-indigo-600" />
          <h4 className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wide">
            Extension activation mode
          </h4>
        </div>

        <p className="text-[11px] text-slate-500">
          PHPStan extensions can be loaded automatically via composer, or manually specified. The installer enables all functionality an extension offers. If you want partial activation (e.g. extension.neon without rules.neon), use manual mode.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Strategy: Auto installer */}
          <div
            onClick={() => handleStrategyChange('auto_installer')}
            className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer select-none ${
              installationStrategy === 'auto_installer'
                ? 'bg-indigo-50/60 border-indigo-500 ring-1 ring-indigo-500 text-indigo-950'
                : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <input
                  type="radio"
                  checked={installationStrategy === 'auto_installer'}
                  onChange={() => {}}
                  className="accent-indigo-600"
                />
                <span className="font-bold text-[11px] font-mono tracking-wider">
                  Automatic via phpstan/extension-installer
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">
                Uses the composer installer plugin to automatically register packages without any neon configuration layout changes.
              </p>
            </div>
          </div>

          {/* Strategy: Manual includes only */}
          <div
            onClick={() => handleStrategyChange('manual_includes')}
            className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer select-none ${
              installationStrategy === 'manual_includes'
                ? 'bg-indigo-50/60 border-indigo-500 ring-1 ring-indigo-500 text-indigo-950'
                : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <input
                  type="radio"
                  checked={installationStrategy === 'manual_includes'}
                  onChange={() => {}}
                  className="accent-indigo-600"
                />
                <span className="font-bold text-[11px] font-mono tracking-wider">
                  Manual Includes Only
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">
                Disables automated triggers. Demands explicit includes references inside the <code className="bg-white/85 border p-0.5 rounded font-mono text-[9px]">includes:</code> list for secure, manual fine-tuning.
              </p>
            </div>
          </div>

          {/* Strategy: Hybrid mode */}
          <div
            onClick={() => handleStrategyChange('hybrid')}
            className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer select-none ${
              installationStrategy === 'hybrid'
                ? 'bg-indigo-50/60 border-indigo-500 ring-1 ring-indigo-500 text-indigo-950'
                : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <input
                  type="radio"
                  checked={installationStrategy === 'hybrid'}
                  onChange={() => {}}
                  className="accent-indigo-600"
                />
                <span className="font-bold text-[11px] font-mono tracking-wider">
                  Hybrid Mode (Adaptive)
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">
                Runs automated checks but declares direct includes to prevent load order complications during hybrid upgrades.
              </p>
            </div>
          </div>
        </div>

        {/* CI Scripts events warning block */}
        {(installationStrategy === 'auto_installer' || installationStrategy === 'hybrid') && (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-[10.5px] font-sans flex items-start gap-2.5 shadow-xs">
            <span className="text-amber-600 text-xs mt-0.5 font-bold shrink-0">⚠️</span>
            <div className="space-y-0.5 leading-normal">
              <strong>Automatic extension activation requires Composer scripts.</strong>
              <p className="text-[10px] text-slate-700">
                Do not install dependencies with <code className="font-mono bg-amber-100/50 px-1 border border-amber-200 rounded">--no-scripts</code> options. The extension-installer plugin depends on Composer script events to generate the autoload definitions.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Detected Extensions & Resolver Section */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-rose-100/10 pb-2">
          <span className="text-xs font-bold text-slate-800 font-mono flex items-center gap-1.5 uppercase tracking-wide">
            <Puzzle className="w-4 h-4 text-indigo-600 animate-spin-slow" />
            Detected Extensions & Resolver
          </span>
          <span className="text-[9px] bg-indigo-100 text-indigo-700 font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider">
            PHPStan 2.x Extension System
          </span>
        </div>

        {/* Current Composer Signals Overview Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { name: 'Symfony', detected: config.extensions.symfony, desc: 'Container access & service types' },
            { name: 'Doctrine', detected: config.extensions.doctrine, desc: 'DQL, repositories & Entity inference' },
            { name: 'Laravel', detected: config.extensions.larastan, desc: 'Larastan relations' },
            { name: 'PHPUnit', detected: selectedExtensions.find(e => e.id === 'phpunit')?.enabled, desc: 'Testing mocks & assertions' }
          ].map((sig) => (
            <div key={sig.name} className={`p-2.5 rounded-lg border text-left flex flex-col justify-between ${sig.detected ? 'bg-emerald-50/75 border-emerald-300 text-emerald-950 shadow-xs' : 'bg-white border-slate-200 text-slate-500'}`}>
              <div>
                <span className="block text-[9px] font-mono uppercase font-bold tracking-wider text-slate-400">Dependency</span>
                <span className="font-bold text-xs flex items-center gap-1.5">
                  {sig.detected ? (
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  ) : (
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                  )}
                  {sig.name}
                </span>
                <span className="block text-[8px] leading-tight text-slate-400 mt-0.5">{sig.desc}</span>
              </div>
              <div className="mt-2.5">
                <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wide ${sig.detected ? 'bg-emerald-200 text-emerald-850' : 'bg-slate-100 text-slate-600'}`}>
                  {sig.detected ? 'Detected & Active' : 'Not Detected'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Active Extension Activations Panels grouped */}
        <div className="space-y-3.5 pt-1">
          {/* Group 1: Activated from composer.json */}
          <div>
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-2">
              Activated from composer.json
            </span>
            <div className="space-y-2">
              {[
                {
                  id: 'symfony',
                  name: 'phpstan/phpstan-symfony',
                  detected: config.extensions.symfony,
                  desc: 'Documents return-type support for container access, parameters, serializers, messenger handlers, and forms.'
                },
                {
                  id: 'doctrine',
                  name: 'phpstan/phpstan-doctrine',
                  detected: config.extensions.doctrine,
                  desc: 'Documents DQL and QueryBuilder validation, repository magic method support, field validation, and EntityRepository<MyEntity> inference.'
                }
              ].map((item) => {
                const isActive = selectedExtensions.find(e => e.id === item.id)?.enabled ?? false;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleToggleExtension(item.id)}
                    className={`p-3 rounded-lg border text-left transition-all flex items-start gap-3 cursor-pointer select-none ${
                      isActive
                        ? 'bg-indigo-50/50 border-indigo-400 text-indigo-950 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="mt-0.5">
                      {isActive ? (
                        <div className="w-4 h-4 rounded border border-indigo-600 bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                          ✓
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded border border-slate-300 bg-white" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[11px] font-mono">{item.name}</span>
                        {item.detected && (
                          <span className="text-[8px] bg-emerald-100 text-emerald-800 font-mono font-bold px-1.5 rounded uppercase py-0.2">
                            Detected via composer
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Group 2: Recommended */}
          <div>
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-2">
              Recommended Extensions
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                {
                  id: 'phpunit',
                  name: 'phpstan/phpstan-phpunit',
                  desc: 'Teaches PHPStan about mock return types and phpunit assertion results to avoid return-value warning mismatches.'
                },
                {
                  id: 'deprecation-rules',
                  name: 'phpstan/phpstan-deprecation-rules',
                  desc: 'Helps trace upstream legacy structures and API deprecations to future-proof current dependencies upgrade pathways.'
                }
              ].map((item) => {
                const isActive = selectedExtensions.find(e => e.id === item.id)?.enabled ?? false;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleToggleExtension(item.id)}
                    className={`p-3 rounded-lg border text-left transition-all flex items-start gap-3 cursor-pointer select-none ${
                      isActive
                        ? 'bg-indigo-50/50 border-indigo-400 text-indigo-950 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="mt-0.5">
                      {isActive ? (
                        <div className="w-4 h-4 rounded border border-indigo-600 bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                          ✓
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded border border-slate-300 bg-white" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <span className="font-bold text-[11px] font-mono block">{item.name}</span>
                      <p className="text-[10px] text-slate-500 leading-tight">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Group 3: Optional strictness packs */}
          <div>
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-2">
              Optional Strictness Packs
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                {
                  id: 'strict-rules',
                  name: 'phpstan/phpstan-strict-rules',
                  desc: 'Enforces safe rules like strict-comparison parameters & type safety.'
                },
                {
                  id: 'voku-rules',
                  name: 'voku/phpstan-rules',
                  desc: 'Forces assignments analysis, strict yoda condition handling and clean if loops.'
                },
                {
                  id: 'sidz-rules',
                  name: 'sidz/phpstan-rules',
                  desc: 'Prevents undocumented magic number usages and enforces explanatory constants.'
                }
              ].map((item) => {
                const isActive = selectedExtensions.find(e => e.id === item.id)?.enabled ?? false;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleToggleExtension(item.id)}
                    className={`p-3 rounded-lg border text-left transition-all flex items-start gap-2.5 cursor-pointer select-none ${
                      isActive
                        ? 'bg-indigo-50/50 border-indigo-400 text-indigo-950 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="mt-0.5">
                      {isActive ? (
                        <div className="w-4 h-4 rounded border border-indigo-600 bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          ✓
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded border border-slate-300 bg-white shrink-0" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <span className="font-bold text-[10px] font-mono block leading-snug break-all">{item.name}</span>
                      <p className="text-[9px] text-slate-500 leading-tight">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Group 4: Framework alternative */}
          <div>
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-2">
              Framework Alternative
            </span>
            <div>
              {[
                {
                  id: 'larastan',
                  name: 'larastan/larastan',
                  desc: 'Resolves Eloquent Model relations and dynamic Laravel Facades Magic Methods elegantly.'
                }
              ].map((item) => {
                const isActive = selectedExtensions.find(e => e.id === item.id)?.enabled ?? false;
                const isLaravelDetected = config.extensions.larastan;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (!isLaravelDetected) {
                        onAddToast('Larastan requires Laravel detection. Activate Laravel in Step 1 composer scan first!', 'info');
                      } else {
                        handleToggleExtension(item.id);
                      }
                    }}
                    className={`p-3 rounded-lg border text-left transition-all flex items-start gap-3 cursor-pointer select-none ${
                      isActive
                        ? 'bg-indigo-50/50 border-indigo-400 text-indigo-950 shadow-xs'
                        : isLaravelDetected
                          ? 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                          : 'bg-slate-100/70 border-slate-200 text-slate-400 opacity-65 cursor-not-allowed'
                    }`}
                  >
                    <div className="mt-0.5">
                      {isActive ? (
                        <div className="w-4 h-4 rounded border border-indigo-600 bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          ✓
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded border border-slate-300 bg-white shrink-0" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[11px] font-mono">{item.name}</span>
                        {!isLaravelDetected && (
                          <span className="text-[8px] bg-amber-100 text-amber-805 font-mono font-bold px-1.5 rounded py-0.2 uppercase">
                            Locked (Requires Laravel)
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal">{item.desc}</p>
                      <p className="text-[8.5px] text-slate-400 italic mt-1 leading-normal">
                        Note: Current Larastan docs require PHP 8.2+ and Laravel 11.15+ for Larastan 3.x.
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Extension Library Registry */}
      <div className="space-y-3">
        
        <div className="flex flex-wrap gap-1 bg-slate-50 border p-1 rounded-xl">
          {['All', 'Official', 'Framework', 'Testing', 'Database', 'Rule Packs', 'Assertions'].map((tab) => {
            const isActive = selectedCategory === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setSelectedCategory(tab)}
                className={`flex-1 min-w-[55px] py-1 text-center text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Extensions Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredExtensions.map((ext) => {
            const tracker = selectedExtensions.find(e => e.id === ext.id) || { id: ext.id, enabled: false, selectedIncludes: ext.includes };
            const isEnabled = tracker.enabled;

            // Check PHP incompatibility warning
            const isPhpIncompatible = phpVersionDouble < ext.minPhpVersion;

            return (
              <div
                key={ext.id}
                className={`rounded-xl border p-4.5 transition-all relative flex flex-col justify-between space-y-4 shadow-sm group ${
                  isEnabled 
                    ? 'bg-indigo-50/30 border-indigo-400' 
                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                }`}
              >
                
                {/* Meta details */}
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs font-sans">
                        {ext.name}
                      </h4>
                      
                      <span className="text-[9px] text-slate-400 font-mono">
                        composer Package: {ext.composerPackage}
                      </span>
                    </div>

                    {/* Enable slider */}
                    <button
                      type="button"
                      onClick={() => handleToggleExtension(ext.id)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isEnabled ? 'bg-indigo-600 font-bold' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          isEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>                  {/* Collapsible details grid toggle */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 mt-2">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${isEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                      <span className="font-mono text-[9px] font-bold uppercase tracking-wide">
                        {isEnabled ? 'Activated' : 'Disabled'}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setExpandedExtId(expandedExtId === ext.id ? null : ext.id)}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>{expandedExtId === ext.id ? 'Collapse details' : 'View details & tune'}</span>
                      <ChevronRight className={`w-3.5 h-3.5 transform transition-all ${expandedExtId === ext.id ? 'rotate-90' : ''}`} />
                    </button>
                  </div>

                  {expandedExtId === ext.id && (
                    <div className="space-y-4 pt-4 border-t border-slate-200 animate-fadeIn">
                      {/* Badges details layout */}
                      <div className="flex flex-wrap gap-1">
                        <span className="text-[9px] font-mono rounded-md px-2 py-0.5 bg-slate-100 border border-slate-200/50 text-slate-600">
                          Type: {ext.typeLabel}
                        </span>
                        <span className="text-[9px] font-mono rounded-md px-2 py-0.5 bg-slate-50 border border-slate-200/50 text-slate-500">
                          Impact: {ext.strictnessImpact} Strictness
                        </span>
                        {ext.tags.map((tag) => (
                          <span key={tag} className="text-[9px] font-mono rounded-md px-2 py-0.5 bg-indigo-50/50 text-indigo-700 border border-indigo-100">
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Description copy */}
                      <p className="text-[11px] text-slate-600 leading-relaxed font-sans font-normal pt-1">
                        {ext.description}
                      </p>

                      <div className="text-[10px] text-slate-550 bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 font-sans space-y-1">
                        <p><strong>Recommended For:</strong> {ext.recommendedFor}</p>
                        <p><strong>Strictness impact:</strong> {ext.strictnessImpact}</p>
                        {ext.risk && <p className="text-amber-700 font-medium"><strong>Risk Checklist:</strong> {ext.risk}</p>}
                      </div>

                      {/* Capability Details Matrix badge */}
                      <div className="bg-white border rounded-lg p-2.5 space-y-1">
                        <span className="text-[8px] font-mono text-indigo-600 block uppercase font-extrabold tracking-wider">
                          Extension System Capabilities:
                        </span>
                        <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono text-slate-500">
                          {ext.capabilities.typeInference.length > 0 && (
                            <div>
                              <p className="font-bold text-slate-700">Type Inference:</p>
                              {ext.capabilities.typeInference.map(c => (
                                <p key={c} className="text-[8px] pl-2 text-indigo-900">✓ {c}</p>
                              ))}
                            </div>
                          )}
                          {ext.capabilities.ruleEnforcement.length > 0 && (
                            <div>
                              <p className="font-bold text-slate-700">Rule Checks:</p>
                              {ext.capabilities.ruleEnforcement.map(c => (
                                <p key={c} className="text-[8px] pl-2 text-indigo-900">✓ {c}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                                    {/* EXCLUSIVE FOR DOCTRINE & SYMFONY: LEVEL SELECTOR TOGGLE (AUTO vs Rules file selection) */}
                      {(ext.id === 'doctrine' || ext.id === 'symfony') && (
                        <div className="p-2 border border-slate-200 rounded-lg space-y-1 bg-slate-50/30">
                          <p className="text-[9px] font-mono font-bold text-slate-600 uppercase">
                            Configuration Precision Level:
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-[9px] font-bold text-center">
                            <button
                              type="button"
                              className={`p-1 border rounded-md transition-colors cursor-pointer ${
                                tracker.selectedIncludes.length === 1 && tracker.selectedIncludes.includes('extension.neon')
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'bg-white text-slate-600 hover:border-slate-350 border-slate-200'
                              }`}
                              onClick={() => handleSetExtensionLevel(ext.id, ['extension.neon'])}
                            >
                              Enable Inference Only
                            </button>
                            <button
                              type="button"
                              className={`p-1 border rounded-md transition-colors cursor-pointer ${
                                tracker.selectedIncludes.includes('rules.neon')
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'bg-white text-slate-600 hover:border-slate-350 border-slate-200'
                              }`}
                              onClick={() => handleSetExtensionLevel(ext.id, ['extension.neon', 'rules.neon'])}
                            >
                              Enable Rules Too
                            </button>
                          </div>
                          <p className="text-[8px] text-slate-400 font-mono">
                            {tracker.selectedIncludes.includes('rules.neon') 
                               ? 'Includes rules.neon: Adds extra assertion and ORM parameters checks to the pipeline.' 
                               : 'extension.neon only: safe mode with zero unrequested rules exceptions.'}
                          </p>
                        </div>
                      )}

                      {/* Compatibility layer checklists matrix */}
                      <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 space-y-1 text-[10px]">
                        <span className="block text-[8px] font-mono uppercase tracking-wider font-extrabold text-slate-400">
                          Compatibility Matrix Checklist
                        </span>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px]">
                          <div className="flex items-center gap-1">
                            <span className="text-emerald-600 font-bold">✓</span>
                            <span>PHPStan version: Compatible</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {isPhpIncompatible ? (
                              <>
                                <span className="text-amber-500 font-bold">⚠</span>
                                <span className="text-amber-700 font-semibold">Requires PHP {ext.minPhpVersion}+</span>
                              </>
                            ) : (
                              <>
                                <span className="text-emerald-600 font-bold">✓</span>
                                <span>PHP version: Compatible ({phpVersionDouble})</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-indigo-600 font-semibold">✓</span>
                            <span>Auto Installer: Supported</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-indigo-600 font-semibold">✓</span>
                            <span>Manual includes: Supported</span>
                          </div>
                        </div>
                      </div>

                      {/* SPECIAL SECTION: voku/phpstan-rules ADVANCED PARAMETERS TUNING CONTROLS */}
                      {ext.id === 'voku-rules' && isEnabled && (
                        <div className="p-3 bg-white border border-slate-200 hover:border-slate-300 transition-colors rounded-xl space-y-3.5 shadow-sm" id="voku-parameters-card-editor">
                          <div className="flex items-center gap-1 pb-1 border-b border-dashed border-slate-200">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                            <h5 className="text-[10px] font-extrabold font-mono text-indigo-950 uppercase tracking-wide">
                              Configure optional voku parameters
                            </h5>
                          </div>

                          <div className="space-y-2 text-[10px]">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={vokuParams.checkForAssignments}
                                onChange={(e) => handleSetVokuParam('checkForAssignments', e.target.checked)}
                                className="rounded accent-indigo-600"
                              />
                              <div>
                                <span className="font-bold text-slate-800">checkForAssignments</span>
                                <p className="text-[8px] text-slate-400">Detects accidental variable assignment statements inside conditions. Prevent `if ($a = 5)` bugs!</p>
                              </div>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
                              <input
                                type="checkbox"
                                checked={vokuParams.checkYodaConditions}
                                onChange={(e) => handleSetVokuParam('checkYodaConditions', e.target.checked)}
                                className="rounded accent-indigo-600"
                              />
                              <div>
                                <span className="font-bold text-slate-800">checkYodaConditions</span>
                                <p className="text-[8px] text-slate-400">Demands Yoda ordering helper check configuration conditions.</p>
                              </div>
                            </label>

                            <div className="space-y-1.5 pt-1">
                               <span className="font-bold text-slate-800">classesNotInIfConditions</span>
                              <div className="flex gap-1">
                                <input
                                  type="text"
                                  value={newExcludedClassStr}
                                  onChange={(e) => setNewExcludedClassStr(e.target.value)}
                                  placeholder="e.g. AbstractValueObject"
                                  className="text-[9px] bg-slate-50 border rounded-md px-2 py-1 flex-1 text-slate-800 font-mono shadow-inner outline-none focus:ring-1 focus:ring-indigo-300"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddExcludedClass();
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={handleAddExcludedClass}
                                  className="p-1 px-2.5 bg-indigo-600 text-white font-bold text-[9px] rounded-md hover:bg-indigo-500 cursor-pointer"
                                >
                                  Add
                                </button>
                              </div>

                              {vokuParams.classesNotInIfConditions.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-1.5">
                                  {vokuParams.classesNotInIfConditions.map((cls) => (
                                    <div 
                                      key={cls}
                                      className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-full text-[9px] text-slate-700 font-mono"
                                    >
                                      <span>{cls}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveExcludedClass(cls)}
                                        className="text-slate-400 hover:text-rose-600 font-mono p-0.5"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SPECIAL SECTION: sidz/phpstan-rules ADVANCED PARAMETERS TUNING CONTROLS */}
                      {ext.id === 'sidz-rules' && isEnabled && (
                        <div className="p-3 bg-white border border-slate-200 hover:border-slate-300 transition-colors rounded-xl space-y-3.5 shadow-sm" id="sidz-parameters-card-editor">
                          <div className="flex items-center gap-1 pb-1 border-b border-dashed border-slate-200">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                            <h5 className="text-[10px] font-extrabold font-mono text-indigo-950 uppercase tracking-wide">
                              Configure Magic Number Protection Parameters
                            </h5>
                          </div>

                          <div className="space-y-3.5 text-[10px]">
                            <div className="space-y-1.5">
                              <span className="font-bold text-slate-800">Select Parameter Preset Policy:</span>
                              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                                {[
                                  { key: 'strict', label: 'Strict Domain Code' },
                                  { key: 'balanced', label: 'Balanced App Code' },
                                  { key: 'legacy', label: 'Legacy Migration' },
                                  { key: 'ai_hardening', label: 'AI Hardening' }
                                ].map((presetItem) => {
                                  const isSelected = sidzParams.preset === presetItem.key;
                                  return (
                                    <button
                                      key={presetItem.key}
                                      type="button"
                                      onClick={() => handleApplySidzPreset(presetItem.key as any)}
                                      className={`py-1 px-2 border rounded-md text-[9px] font-bold text-left transition-all ${
                                        isSelected
                                          ? 'bg-indigo-600 text-white border-indigo-600'
                                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                      }`}
                                    >
                                      {presetItem.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <span className="font-bold text-slate-800">sidzIgnoreMagicNumbers</span>
                              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-slate-50 border rounded-lg">
                                {sidzParams.ignoreMagicNumbers && sidzParams.ignoreMagicNumbers.map((num) => (
                                  <div
                                    key={num}
                                    className="flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 rounded-full text-[9px] text-slate-700 font-mono font-bold"
                                  >
                                    <span>{num}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextNums = (sidzParams.ignoreMagicNumbers || []).filter(n => n !== num);
                                        syncWithLegacyAndSet(selectedExtensions, installationStrategy, vokuParams, {
                                          ...sidzParams,
                                          ignoreMagicNumbers: nextNums
                                        });
                                      }}
                                      className="text-slate-500 hover:text-rose-600"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>

                              <div className="flex gap-1">
                                <input
                                  type="number"
                                  id="add-magic-num-input"
                                  placeholder="e.g. 100"
                                  className="text-[9px] bg-slate-50 border rounded-md px-2 py-1 flex-1 text-slate-800 font-mono shadow-inner outline-none focus:ring-1 focus:ring-indigo-300"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const inputVal = parseFloat((e.currentTarget as HTMLInputElement).value);
                                      if (!isNaN(inputVal)) {
                                        const nextNums = [...(sidzParams.ignoreMagicNumbers || []), inputVal].sort((a,b) => a - b);
                                        syncWithLegacyAndSet(selectedExtensions, installationStrategy, vokuParams, {
                                          ...sidzParams,
                                          ignoreMagicNumbers: nextNums
                                        });
                                        e.currentTarget.value = '';
                                      }
                                    }
                                  }}
                                />
                              </div>
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
                              <input
                                type="checkbox"
                                checked={sidzParams.ignoreNumericStrings || false}
                                onChange={(e) => {
                                  syncWithLegacyAndSet(selectedExtensions, installationStrategy, vokuParams, {
                                    ...sidzParams,
                                    ignoreNumericStrings: e.target.checked
                                  });
                                }}
                                className="rounded accent-indigo-600"
                              />
                              <div>
                                <span className="font-bold text-slate-850">sidzIgnoreNumericStrings</span>
                              </div>
                            </label>
                          </div>
                        </div>
                      )}

                      {/* Target configuration output preview based on active Mode */}
                      <div className="border-t border-dashed border-slate-200 pt-2.5 text-[10px]">
                        <span className="block text-[8px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                          Resolved Active Integration Configuration
                        </span>

                        <div className="mt-1 font-mono text-[9px] text-slate-500 space-y-1.5 p-2 bg-slate-50 rounded border border-slate-200">
                          <div>
                            <span className="font-bold text-slate-700">Shell Terminal Command:</span>
                            <div className="bg-slate-900 text-slate-300 p-1 rounded font-mono text-[8px] overflow-x-auto whitespace-nowrap mt-0.5">
                              composer require --dev {getExtensionComposerPackage(ext.id)}{installationStrategy === 'auto_installer' ? ' phpstan/extension-installer' : ''}
                            </div>
                          </div>

                          {installationStrategy === 'auto_installer' ? (
                            <div className="text-[8px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                              Resolved: Rules autoloaded automatically by extension-installer. (No includes lines required in NEON).
                            </div>
                          ) : (
                            <div>
                              <span className="font-bold text-slate-700">Manual includes lines in neon:</span>
                              <div className="text-[8px] text-indigo-700/90 font-semibold bg-indigo-50 px-1.5 py-1 rounded space-y-0.5 border border-indigo-100 mt-1">
                                {tracker.selectedIncludes.map((file) => {
                                  return (
                                    <div key={file}>
                                      - {getExtensionIncludeBasePath(ext.id)}/{file}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  )}
                </div>

                {/* Enabled Status indicator overlay */}
                {isEnabled && (
                  <div className="absolute top-3.5 right-11 px-2 py-0.5 text-[8px] bg-indigo-600 text-white rounded font-mono font-bold uppercase select-none shadow-sm">
                    Active
                  </div>
                )}
                
                {isPhpIncompatible && (
                  <div className="absolute top-3.5 right-11 px-2 py-0.5 text-[8px] bg-yellow-500 text-white rounded font-mono font-bold uppercase select-none shadow-sm flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    <span>PHP Incompatibility</span>
                  </div>
                )}

              </div>
            );
          })}
        </div>

      </div>

      {/* User Defined Manual Overrides Override Paths */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <label className="block text-xs font-bold text-slate-700 uppercase font-mono tracking-wide flex items-center gap-1.5">
          <Code className="w-4 h-4 text-slate-600" />
          Advanced Manual Includes Override
        </label>
        
        <p className="text-[10px] text-slate-400">
          Have an uncurated custom extension or local rule file? Add the relative directory filepath below to include them inside your finalized Neon build manually.
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            value={newCustomIncludeItem}
            onChange={(e) => setNewCustomIncludeItem(e.target.value)}
            placeholder="e.g. vendor/username/phpstan-custom-package/rules.neon"
            id="add-custom-include-field"
            className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-xs"
            onKeyDown={(e) => { 
              if (e.key === 'Enter') { 
                handleAddCustomInclude(); 
              } 
            }}
          />
          <button
            type="button"
            onClick={handleAddCustomInclude}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all border border-slate-300 cursor-pointer flex items-center justify-center shrink-0"
          >
            <Plus className="w-4.5 h-4.5" />
          </button>
        </div>

        {config.extensions.customIncludes.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="block text-[8px] font-mono uppercase tracking-wider text-slate-400 font-bold">
              User-defined Custom Inclusion Paths:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {config.extensions.customIncludes.map((inc, i) => (
                <div 
                  key={i} 
                  className="flex items-center gap-1 px-2.5 py-0.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[9px] text-slate-700 font-bold"
                >
                  <span>{inc}</span>
                  <button 
                    type="button"
                    onClick={() => handleRemoveCustomInclude(i)} 
                    className="text-slate-400 hover:text-rose-600 cursor-pointer font-extrabold text-sm pl-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
