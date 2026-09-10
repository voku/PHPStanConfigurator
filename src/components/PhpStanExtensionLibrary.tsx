/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Puzzle, 
  Settings, 
  BookOpen, 
  ExternalLink, 
  Plus, 
  Code, 
  ShieldAlert, 
  Sliders, 
  Sparkles, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  PackageCheck, 
  ChevronDown, 
  SlidersHorizontal,
  Filter
} from 'lucide-react';
import { 
  PhpStanConfig, 
  SelectedExtension, 
  InstallationStrategy, 
  VokuParameters, 
  SidzParameters,
  DependencyScanResult,
  CommunityRulePackage
} from '../types';
import { EXTENSIONS_LIBRARY, EXTENSIONS_LIBRARY_BY_ID, PhpStanExtension } from '../data/phpstanExtensionsLibrary';
import { COMMUNITY_RULE_PACKAGES } from '../data/communityRulePackages';
import { 
  OFFICIAL_DOC_EXTENSION_PACKAGES, 
  getExtensionComposerPackage, 
  getExtensionIncludeBasePath 
} from '../lib/phpstanExtensions';
import { 
  groupCommunityRulePackages, 
  setCommunityRulePackageEnabled, 
  isCommunityRulePackageEnabled 
} from '../lib/communityRuleAdvisor';
import { resolveSelectedExtensions } from '../lib/phpstanSelections';

interface PhpStanExtensionLibraryProps {
  config: PhpStanConfig;
  activePresetId?: string;
  dependencyScan?: DependencyScanResult | null;
  onChangeConfig: (newConfig: PhpStanConfig | ((prev: PhpStanConfig) => PhpStanConfig)) => void;
  onAddToast: (msg: string, type: 'success' | 'info') => void;
  onHoverRule?: (rule: string | null) => void;
}

const CATEGORY_LABELS: Record<CommunityRulePackage['category'], string> = {
  'architecture': 'Architecture',
  'complexity': 'Complexity',
  'database': 'Database',
  'framework': 'Framework',
  'migration': 'Migration',
  'security': 'Security',
  'strictness': 'Strictness',
  'testing': 'Testing',
  'type-safety': 'Type Safety',
};

const RECOMMENDATION_STYLES = {
  off: 'bg-slate-100 text-slate-600 border-slate-200',
  advanced: 'bg-amber-50 text-amber-700 border-amber-200',
  suggested: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  recommended: 'bg-emerald-50 text-emerald-700 border-emerald-200',
} as const;

export function PhpStanExtensionLibrary({
  config,
  activePresetId = '',
  dependencyScan = null,
  onChangeConfig,
  onAddToast,
  onHoverRule
}: PhpStanExtensionLibraryProps) {
  // Navigation & Category Filter
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'catalog' | 'advisor'>('catalog');
  
  // Collapsible optional sections
  const [isActivationModeOpen, setIsActivationModeOpen] = useState<boolean>(false);
  const [isLearnHubOpen, setIsLearnHubOpen] = useState<boolean>(false);
  const [isCustomIncludesOpen, setIsCustomIncludesOpen] = useState<boolean>(config.extensions.customIncludes.length > 0);
  
  // Expanded card drawers for extra rules / parameters
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  
  // Dynamic static analysis capabilities tab
  const [activeRefTab, setActiveRefTab] = useState<'inference' | 'rule' | 'infrastructure'>('inference');

  // New custom inclusion path state
  const [newCustomIncludeItem, setNewCustomIncludeItem] = useState('');

  // Resolved extensions
  const selectedExtensions = resolveSelectedExtensions(config.extensions);
  const installationStrategy: InstallationStrategy = config.extensions.installationStrategy || 'hybrid';

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

  // Target PHP Version helper
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

  // Synchronise sub-settings to state
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

  // Toggle card details expansion
  const toggleCardDrawer = (id: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Unified Toggle for any package (Extension or Community Rule)
  const handleToggleExtension = (extId: string) => {
    // Check if there is a linked community package
    const linkedCommunity = COMMUNITY_RULE_PACKAGES.find(p => p.linkedExtensionId === extId);
    if (linkedCommunity) {
      const isCurrentlyEnabled = isCommunityRulePackageEnabled(config, linkedCommunity);
      onChangeConfig(prev => setCommunityRulePackageEnabled(prev, linkedCommunity.id, !isCurrentlyEnabled));
      onAddToast(`${!isCurrentlyEnabled ? 'Enabled' : 'Disabled'} ${EXTENSIONS_LIBRARY_BY_ID[extId]?.name || linkedCommunity.displayName}`, !isCurrentlyEnabled ? 'success' : 'info');
      return;
    }

    const isCurrentlyEnabled = selectedExtensions.some(e => e.id === extId && e.enabled);
    const willEnable = !isCurrentlyEnabled;

    const nextSelected = selectedExtensions.map(ext => {
      if (ext.id !== extId) return ext;
      return {
        ...ext,
        enabled: willEnable,
        selectedIncludes: willEnable 
          ? (ext.selectedIncludes.length > 0 ? ext.selectedIncludes : [...(EXTENSIONS_LIBRARY_BY_ID[extId]?.includes || [])])
          : ext.selectedIncludes
      };
    });

    syncWithLegacyAndSet(nextSelected, installationStrategy, vokuParams, sidzParams);
    onAddToast(`${willEnable ? 'Enabled' : 'Disabled'} ${EXTENSIONS_LIBRARY_BY_ID[extId]?.name || extId}`, willEnable ? 'success' : 'info');
  };

  const handleToggleCommunityPackage = (packageId: string, currentEnabled: boolean) => {
    onChangeConfig(prev => setCommunityRulePackageEnabled(prev, packageId, !currentEnabled));
    const rulePackage = COMMUNITY_RULE_PACKAGES.find(p => p.id === packageId);
    onAddToast(`${!currentEnabled ? 'Enabled' : 'Disabled'} ${rulePackage?.displayName || packageId}`, !currentEnabled ? 'success' : 'info');
  };

  const handleStrategyChange = (newStrategy: InstallationStrategy) => {
    syncWithLegacyAndSet(selectedExtensions, newStrategy, vokuParams, sidzParams);
    onAddToast(`Extension activation mode changed to ${newStrategy.replace('_', ' ')}`, 'info');
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

    const nextSidz: SidzParameters = {
      ignoreMagicNumbers,
      ignoreNumericStrings,
      preset: presetType
    };

    syncWithLegacyAndSet(selectedExtensions, installationStrategy, vokuParams, nextSidz);
    onAddToast(`Applied preset Policy for Magic Number protection.`, 'success');
  };

  const isExcluded = (pattern: string) => {
    return (config.excludes || []).some(esc => esc.toLowerCase().includes(pattern.toLowerCase()));
  };

  const handleToggleExcludesPattern = (pattern: string) => {
    const currentExcludes = config.excludes || [];
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

  // Grouped community packages for Advisor View
  const groupedPackages = groupCommunityRulePackages(config, {
    activePresetId,
    dependencyScan,
  });

  // Calculate total active count (extensions + unlinked community packages)
  const activeExtensionCount = selectedExtensions.filter(e => e.enabled).length;
  const activeCommunityExtraCount = (config.extensions.communityPackages || []).filter(cp => cp.enabled).length;
  const totalActivePackages = activeExtensionCount + activeCommunityExtraCount;

  // Standalone community packages that are not in EXTENSIONS_LIBRARY
  const standaloneCommunityPackages = COMMUNITY_RULE_PACKAGES.filter(
    pkg => !pkg.linkedExtensionId
  );

  // Render browser filters for catalog
  const filteredExtensions = EXTENSIONS_LIBRARY.filter(ext => {
    const isEnabled = selectedExtensions.some(e => e.id === ext.id && e.enabled);
    if (selectedCategory === 'Active') return isEnabled;
    if (selectedCategory === 'All') return true;
    if (selectedCategory === 'Official') return OFFICIAL_DOC_EXTENSION_PACKAGES.some(pkg => pkg === ext.composerPackage) || ext.category === 'Official';
    if (selectedCategory === 'Framework') return ext.category === 'Framework';
    if (selectedCategory === 'Testing') return ext.category === 'Testing';
    if (selectedCategory === 'Database') return ext.category === 'Database';
    if (selectedCategory === 'Rule Packs') return ext.category === 'Rule Pack' || ext.category === 'AI Hardening';
    if (selectedCategory === 'Assertions') return ext.category === 'Assertion';
    return true;
  });

  const filteredStandaloneCommunity = standaloneCommunityPackages.filter(pkg => {
    const isEnabled = isCommunityRulePackageEnabled(config, pkg);
    if (selectedCategory === 'Active') return isEnabled;
    if (selectedCategory === 'All') return true;
    if (selectedCategory === 'Official') return false;
    if (selectedCategory === 'Rule Packs') return true;
    if (selectedCategory === 'Framework') return pkg.category === 'framework';
    if (selectedCategory === 'Testing') return pkg.category === 'testing';
    if (selectedCategory === 'Database') return pkg.category === 'database';
    return true;
  });

  return (
    <div id="phpstan-extension-library-custom-card" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
      
      {/* 3. Title info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Puzzle className="w-4 h-4 text-indigo-600" />
          <h3 className="font-semibold text-xs font-mono uppercase tracking-wider text-slate-800">
            3. Extensions & Extra Rules
          </h3>
          <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono font-bold px-2 py-0.5 rounded-full">
            {totalActivePackages} active
          </span>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="https://phpstan.org/user-guide/extension-library"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[10px] bg-slate-100/90 text-slate-700 font-bold px-2.5 py-1 rounded-full font-mono hover:text-indigo-700 transition-colors"
            title="PHPStan Extension Library Documentation"
          >
            <span>PHPStan docs reference</span>
            <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
          </a>
          <a
            href="https://phpstan.org/developing-extensions/core-concepts"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-full font-mono hover:text-indigo-900 transition-colors"
            title="PHPStan Developing Extensions Guide"
          >
            <span>Extension Concepts</span>
            <ExternalLink className="w-2.5 h-2.5 text-indigo-400" />
          </a>
        </div>
      </div>

      {/* Dependency Scan Hints (If detected from composer.json) */}
      {dependencyScan?.notes && dependencyScan.notes.length > 0 && (
        <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/60 space-y-2">
          <div className="flex items-center gap-1.5 text-indigo-900 text-[11px] font-bold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Dependency Scan Recommendations</span>
          </div>
          <ul className="space-y-1 text-[10px] text-slate-700 leading-relaxed pl-4 list-disc">
            {dependencyScan.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Extension Summary / Detected Signals */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <span className="text-xs font-bold text-slate-800 font-mono flex items-center gap-1.5 uppercase tracking-wide">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            Framework & Signal Overview
          </span>
          <span className="text-[9px] bg-indigo-100 text-indigo-700 font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider">
            Single selection source
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { name: 'Symfony', detected: config.extensions.symfony, desc: 'Container & service types' },
            { name: 'Doctrine', detected: config.extensions.doctrine, desc: 'DQL, Entity inference' },
            { name: 'Laravel', detected: config.extensions.larastan, desc: 'Larastan relations & models' },
            { name: 'PHPUnit', detected: selectedExtensions.find(e => e.id === 'phpunit')?.enabled, desc: 'Mocks & assertions' }
          ].map((sig) => (
            <div key={sig.name} className={`p-2 rounded-lg border text-left flex flex-col justify-between ${sig.detected ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950' : 'bg-white border-slate-200 text-slate-500'}`}>
              <div>
                <span className="font-bold text-xs flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${sig.detected ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  {sig.name}
                </span>
                <span className="block text-[8px] leading-tight text-slate-400 mt-0.5">{sig.desc}</span>
              </div>
              <div className="mt-1.5">
                <span className={`text-[8px] font-mono px-1 py-0.5 rounded font-bold uppercase tracking-wide ${sig.detected ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-100 text-slate-600'}`}>
                  {sig.detected ? 'Active' : 'Not Loaded'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Collapsible Optional Section 1: Activation Mode (Installation Strategy) */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setIsActivationModeOpen(!isActivationModeOpen)}
          className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/80 text-left transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wide">
              Extension Activation Mode
            </span>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-md">
              {installationStrategy === 'hybrid' ? 'Hybrid Mode (Adaptive)' : installationStrategy === 'auto_installer' ? 'Auto Installer' : 'Manual Includes'}
            </span>
          </div>
          <div className="flex items-center gap-1 text-slate-400 text-xs font-mono">
            <span className="text-[10px]">{isActivationModeOpen ? 'Hide' : 'Configure'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isActivationModeOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {isActivationModeOpen && (
          <div className="p-4 bg-white border-t border-slate-200 space-y-3">
            <p className="text-[11px] text-slate-500 leading-normal">
              PHPStan extensions can be loaded automatically via composer, or manually specified. The installer enables all functionality an extension offers. If you want partial activation, use manual mode.
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
                      readOnly
                      checked={installationStrategy === 'auto_installer'}
                      className="accent-indigo-600"
                    />
                    <span className="font-bold text-[11px] font-mono tracking-wider">
                      Auto via extension-installer
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Uses composer plugin to automatically register packages without neon layout changes.
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
                      readOnly
                      checked={installationStrategy === 'manual_includes'}
                      className="accent-indigo-600"
                    />
                    <span className="font-bold text-[11px] font-mono tracking-wider">
                      Manual Includes Only
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Explicit includes references inside the <code className="bg-white/85 border p-0.5 rounded font-mono text-[9px]">includes:</code> list for fine-tuned control.
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
                      readOnly
                      checked={installationStrategy === 'hybrid'}
                      className="accent-indigo-600"
                    />
                    <span className="font-bold text-[11px] font-mono tracking-wider">
                      Hybrid Mode (Adaptive)
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Declares direct includes to prevent load order complications during hybrid upgrades.
                  </p>
                </div>
              </div>
            </div>

            {/* CI Scripts events warning block */}
            {(installationStrategy === 'auto_installer' || installationStrategy === 'hybrid') && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-[10.5px] font-sans flex items-start gap-2.5">
                <span className="text-amber-600 text-xs mt-0.5 font-bold shrink-0">⚠️</span>
                <p className="text-[10px] text-slate-700 leading-normal">
                  <strong>Automatic activation requires Composer scripts.</strong> Avoid installing with <code className="font-mono bg-amber-100/50 px-1 border border-amber-200 rounded">--no-scripts</code>.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Collapsible Optional Section 2: Developer Learn Hub / Capabilities */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setIsLearnHubOpen(!isLearnHubOpen)}
          className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/80 text-left transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wide">
              Capabilities & Extension Guide
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              (Dynamic types, custom rules, stubs)
            </span>
          </div>
          <div className="flex items-center gap-1 text-slate-400 text-xs font-mono">
            <span className="text-[10px]">{isLearnHubOpen ? 'Hide' : 'Learn'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isLearnHubOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {isLearnHubOpen && (
          <div className="p-4 bg-white border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b pb-2 border-slate-100">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                Technical Capability Reference
              </span>
              <div className="flex gap-1 text-[9px] font-mono font-semibold">
                <button 
                  type="button"
                  onClick={() => setActiveRefTab('inference')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${activeRefTab === 'inference' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'}`}
                >
                  Type Inference
                </button>
                <button 
                  type="button"
                  onClick={() => setActiveRefTab('rule')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${activeRefTab === 'rule' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'}`}
                >
                  Rule Enforcement
                </button>
                <button 
                  type="button"
                  onClick={() => setActiveRefTab('infrastructure')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${activeRefTab === 'infrastructure' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'}`}
                >
                  Infrastructure
                </button>
              </div>
            </div>

            <div className="text-[10px] leading-relaxed text-slate-600">
              {activeRefTab === 'inference' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="p-2 border rounded border-indigo-100 bg-indigo-50/20">
                    <p className="font-bold text-slate-800">Dynamic Return Types</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">Calculates generic array shapes dynamically depending on actual arguments.</p>
                  </div>
                  <div className="p-2 border rounded border-indigo-100 bg-indigo-50/20">
                    <p className="font-bold text-slate-800">Type-Specifying Classes</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">Tells analyzer that calling <code className="font-mono text-emerald-600">assertUUID($id)</code> guarantees its type.</p>
                  </div>
                  <div className="p-2 border rounded border-indigo-100 bg-indigo-50/20">
                    <p className="font-bold text-slate-800">Virtual Stub Files</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">Augments third-party vendor metadata without rewriting legacy packages.</p>
                  </div>
                </div>
              )}

              {activeRefTab === 'rule' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="p-2 border rounded border-indigo-100 bg-indigo-50/20">
                    <p className="font-bold text-slate-800">Custom Analysis Rules</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">Verifies custom rules like condition parameter assignment errors (voku).</p>
                  </div>
                  <div className="p-2 border rounded border-indigo-100 bg-indigo-50/20">
                    <p className="font-bold text-slate-800">Restricted Usage</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">Protects architecture by blocking import files coupling rules locally.</p>
                  </div>
                  <div className="p-2 border rounded border-indigo-100 bg-indigo-50/20">
                    <p className="font-bold text-slate-800">Forbidden Class Names</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">Stops developers from instantiating direct native classes instead of wrappers.</p>
                  </div>
                </div>
              )}

              {activeRefTab === 'infrastructure' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-2 border rounded border-indigo-100 bg-indigo-50/20">
                    <p className="font-bold text-slate-800">Custom Error Formatters</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">Generates clean JUnit, GitHub Actions annotations, or GitLab output logs.</p>
                  </div>
                  <div className="p-2 border rounded border-indigo-100 bg-indigo-50/20">
                    <p className="font-bold text-slate-800">Cache Metadata Generators</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">Manages cache lifecycle keys to prevent dynamic stale build errors.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* View Switcher & Category Filters Bar */}
      <div className="space-y-2.5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          {/* View mode toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('catalog')}
              className={`h-7 px-3 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                viewMode === 'catalog'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Catalog View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('advisor')}
              className={`h-7 px-3 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                viewMode === 'advisor'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3 h-3 text-indigo-600" />
              <span>Smart Advisor</span>
            </button>
          </div>

          <div className="text-[10px] text-slate-500 font-mono">
            {viewMode === 'catalog' ? (
              <span>Showing {filteredExtensions.length + filteredStandaloneCommunity.length} packages</span>
            ) : (
              <span>Curated recommendation groups</span>
            )}
          </div>
        </div>

        {/* Category filter tabs */}
        <div className="flex flex-wrap gap-1 bg-slate-100 border border-slate-200 p-1 rounded-xl">
          {[
            { id: 'All', label: 'All' },
            { id: 'Official', label: 'Official' },
            { id: 'Rule Packs', label: 'Rule Packs' },
            { id: 'Framework', label: 'Framework' },
            { id: 'Testing', label: 'Testing' },
            { id: 'Database', label: 'Database' },
            { id: 'Assertions', label: 'Assertions' },
            { id: 'Active', label: `Active (${totalActivePackages})` },
          ].map((tab) => {
            const isActive = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={`h-7 px-2.5 text-center text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN VIEW: Catalog Mode */}
      {viewMode === 'catalog' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Standard Extensions */}
            {filteredExtensions.map((ext) => {
              const tracker = selectedExtensions.find(e => e.id === ext.id) || { id: ext.id, enabled: false, selectedIncludes: [] };
              const isEnabled = tracker.enabled;
              const isPhpIncompatible = ext.minPhpVersion > phpVersionDouble;
              const isExpanded = expandedCards[ext.id] || false;
              
              // Find matching community package if linked
              const matchingCommunity = COMMUNITY_RULE_PACKAGES.find(p => p.linkedExtensionId === ext.id);

              return (
                <div
                  key={ext.id}
                  id={`extension-card-${ext.id}`}
                  className={`p-3.5 rounded-xl border transition-all relative flex flex-col justify-between ${
                    isEnabled 
                      ? 'bg-indigo-50/20 border-indigo-400 ring-1 ring-indigo-400/20 shadow-xs' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Top Row: Switch, Name, Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {ext.name}
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded border border-slate-200">
                            {ext.typeLabel}
                          </span>
                          {matchingCommunity && (
                            <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded border border-indigo-100 font-bold">
                              Curated Rule Pack
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <a
                            href={`https://packagist.org/packages/${ext.composerPackage}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-slate-500 hover:text-indigo-600 font-mono flex items-center gap-0.5"
                            title="View on Packagist"
                          >
                            <span>{ext.composerPackage}</span>
                            <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                          </a>
                        </div>
                      </div>

                      {/* Enable Switch */}
                      <button
                        type="button"
                        onClick={() => handleToggleExtension(ext.id)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                          isEnabled ? 'bg-indigo-600' : 'bg-slate-200'
                        }`}
                        title={isEnabled ? 'Disable' : 'Enable'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition ${
                            isEnabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-snug">
                      {ext.description}
                    </p>

                    {/* PHP Incompatibility Warning */}
                    {isPhpIncompatible && (
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded text-[10px] text-amber-800 flex items-center gap-1.5 font-medium">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Requires PHP {ext.minPhpVersion}+ (Current: PHP {phpVersionDouble})</span>
                      </div>
                    )}

                    {/* Expandable Configuration & Rule Details Button */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => toggleCardDrawer(ext.id)}
                        className="text-[10px] font-mono text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <span>{isExpanded ? 'Hide Options & Rules' : 'Configure Options & Rules'}</span>
                        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>

                    {/* Expandable Drawer for Parameters and Rules */}
                    {isExpanded && (
                      <div className="pt-2 border-t border-slate-100 space-y-2.5 animate-fadeIn">
                        {/* If Voku Rules: Show Voku parameter controls */}
                        {ext.id === 'voku-rules' && (
                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-[10px]">
                            <span className="font-bold text-slate-800 font-mono text-[9px] uppercase tracking-wide flex items-center gap-1">
                              <Sliders className="w-3 h-3 text-indigo-600" />
                              Voku Rule Parameters
                            </span>
                            
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={vokuParams.checkForAssignments || false}
                                onChange={(e) => {
                                  syncWithLegacyAndSet(selectedExtensions, installationStrategy, {
                                    ...vokuParams,
                                    checkForAssignments: e.target.checked
                                  }, sidzParams);
                                }}
                                className="rounded accent-indigo-600"
                              />
                              <span className="font-medium text-slate-700">Flag variable assignments in conditions</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={vokuParams.checkYodaConditions || false}
                                onChange={(e) => {
                                  syncWithLegacyAndSet(selectedExtensions, installationStrategy, {
                                    ...vokuParams,
                                    checkYodaConditions: e.target.checked
                                  }, sidzParams);
                                }}
                                className="rounded accent-indigo-600"
                              />
                              <span className="font-medium text-slate-700">Enforce Yoda condition style</span>
                            </label>
                          </div>
                        )}

                        {/* If Sidz Rules: Show Sidz parameter controls */}
                        {ext.id === 'sidz-rules' && (
                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-[10px]">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800 font-mono text-[9px] uppercase tracking-wide flex items-center gap-1">
                                <Sliders className="w-3 h-3 text-indigo-600" />
                                Sidz Magic Number Policy
                              </span>
                              <div className="flex gap-1">
                                {(['strict', 'balanced', 'legacy'] as const).map((p) => (
                                  <button
                                    key={p}
                                    type="button"
                                    onClick={() => handleApplySidzPreset(p)}
                                    className={`px-1.5 py-0.5 rounded text-[8px] font-mono uppercase font-bold cursor-pointer ${
                                      sidzParams.preset === p ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                                    }`}
                                  >
                                    {p}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer select-none">
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
                              <span className="font-medium text-slate-700">Ignore Numeric Strings (e.g. &quot;100&quot;)</span>
                            </label>
                          </div>
                        )}

                        {/* If community package: Show why it helps & highlighted rules */}
                        {matchingCommunity && (
                          <div className="space-y-2">
                            <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px]">
                              <p className="font-semibold text-slate-700">Recommended for:</p>
                              <p className="text-slate-600 mt-0.5">{matchingCommunity.recommendedFor.join(', ')}</p>
                            </div>

                            {matchingCommunity.highlightedRules.length > 0 && (
                              <div className="space-y-1">
                                <span className="text-[9px] font-bold font-mono text-slate-500 uppercase">
                                  Highlighted Rules:
                                </span>
                                {matchingCommunity.highlightedRules.slice(0, 2).map((rule) => (
                                  <div key={rule.ruleClass} className="p-2 bg-white border border-slate-200 rounded text-[10px]">
                                    <p className="font-semibold text-slate-800">{rule.title}</p>
                                    <p className="text-slate-500 text-[9px] mt-0.5">{rule.problem}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Shell command hint */}
                        <div className="font-mono text-[9px] bg-slate-900 text-slate-200 p-2 rounded overflow-x-auto">
                          composer require --dev {ext.composerPackage}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Standalone Community Packages (e.g. shipmonk, ergebnis, spaze, symplify, unused-public, type-coverage) */}
            {filteredStandaloneCommunity.map((pkg) => {
              const isEnabled = isCommunityRulePackageEnabled(config, pkg);
              const isExpanded = expandedCards[pkg.id] || false;

              return (
                <div
                  key={pkg.id}
                  id={`community-card-${pkg.id}`}
                  className={`p-3.5 rounded-xl border transition-all relative flex flex-col justify-between ${
                    isEnabled 
                      ? 'bg-indigo-50/20 border-indigo-400 ring-1 ring-indigo-400/20 shadow-xs' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {pkg.displayName}
                          </span>
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded border border-indigo-100 font-bold">
                            Community Rule Pack
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded border border-slate-200">
                            {pkg.ruleCount} rules
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <a
                            href={`https://packagist.org/packages/${pkg.packageName}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-slate-500 hover:text-indigo-600 font-mono flex items-center gap-0.5"
                            title="View on Packagist"
                          >
                            <span>{pkg.packageName}</span>
                            <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                          </a>
                        </div>
                      </div>

                      {/* Enable Switch */}
                      <button
                        type="button"
                        onClick={() => handleToggleCommunityPackage(pkg.id, isEnabled)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                          isEnabled ? 'bg-indigo-600' : 'bg-slate-200'
                        }`}
                        title={isEnabled ? 'Disable' : 'Enable'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition ${
                            isEnabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-snug">
                      {pkg.recommendedFor.join(', ')}
                    </p>

                    {/* Expandable details button */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => toggleCardDrawer(pkg.id)}
                        className="text-[10px] font-mono text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <span>{isExpanded ? 'Hide Rule Advice' : 'View Rule Advice & Examples'}</span>
                        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>

                    {/* Drawer */}
                    {isExpanded && (
                      <div className="pt-2 border-t border-slate-100 space-y-2 animate-fadeIn">
                        <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-2 text-[10px]">
                          <div className="flex items-center gap-1 text-amber-800 font-semibold">
                            <AlertTriangle className="w-3 h-3" />
                            <span>When not to use it</span>
                          </div>
                          <p className="text-amber-900/80 mt-0.5 text-[9px]">{pkg.avoidWhen.join(', ')}</p>
                        </div>

                        {pkg.highlightedRules.length > 0 && (
                          <div className="space-y-1.5">
                            {pkg.highlightedRules.slice(0, 2).map((rule) => (
                              <div key={rule.ruleClass} className="p-2 bg-slate-50 border border-slate-200 rounded text-[10px]">
                                <div className="flex items-center gap-1 text-slate-800 font-semibold">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>{rule.title}</span>
                                </div>
                                <p className="text-slate-500 text-[9px] mt-0.5">{rule.problem}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="font-mono text-[9px] bg-slate-900 text-slate-200 p-2 rounded overflow-x-auto">
                          {pkg.composerRequireDev}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ALTERNATIVE VIEW: Smart Advisor Mode */}
      {viewMode === 'advisor' && (
        <div className="space-y-4">
          <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 border border-slate-200 p-3 rounded-xl">
            Curated community rule packages organized by technical domain. Recommended packages stay prioritized based on your active PHP version, preset blueprint, and composer signals.
          </p>

          <div className="space-y-4">
            {groupedPackages.map(({ category, entries }) => (
              <div key={category} className="space-y-2.5">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-1.5">
                  <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-700">
                    {CATEGORY_LABELS[category]}
                  </h4>
                  <span className="text-[9px] text-slate-400 font-mono">
                    {entries.length} package{entries.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  {entries.map(({ rulePackage, recommendation, enabled }) => (
                    <article
                      key={rulePackage.id}
                      className={`rounded-xl border p-3.5 space-y-2.5 shadow-xs transition-colors ${
                        enabled ? 'border-indigo-300 bg-indigo-50/20' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h5 className="text-xs font-bold text-slate-900">{rulePackage.displayName}</h5>
                            <span className={`text-[9px] font-mono uppercase tracking-wider border px-1.5 py-0.2 rounded ${RECOMMENDATION_STYLES[recommendation.recommendation]}`}>
                              {recommendation.recommendation}
                            </span>
                            {recommendation.alreadyInstalled && (
                              <span className="text-[9px] font-mono uppercase tracking-wider border px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border-emerald-200">
                                installed
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono">{rulePackage.packageName} · {rulePackage.ruleCount} rules</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleCommunityPackage(rulePackage.id, enabled)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                            enabled ? 'bg-indigo-600' : 'bg-slate-200'
                          }`}
                          title={enabled ? 'Disable' : 'Enable'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition ${
                              enabled ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-1.5 text-[10px]">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                          <p className="font-semibold text-slate-700">Why it helps</p>
                          <p className="text-slate-600 mt-0.5">{rulePackage.recommendedFor.join(', ')}</p>
                        </div>

                        <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-2">
                          <div className="flex items-center gap-1 text-amber-800 font-semibold">
                            <AlertTriangle className="w-3 h-3" />
                            <span>When not to use it</span>
                          </div>
                          <p className="text-amber-900/80 mt-0.5">{rulePackage.avoidWhen.join(', ')}</p>
                        </div>
                      </div>

                      {rulePackage.highlightedRules.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[9px] font-semibold text-slate-600 uppercase font-mono">Highlighted Rules</p>
                          <div className="space-y-1">
                            {rulePackage.highlightedRules.slice(0, 2).map((rule) => (
                              <div key={rule.ruleClass} className="rounded border border-slate-200 p-2 bg-white text-[10px]">
                                <div className="flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <p className="font-semibold text-slate-800">{rule.title}</p>
                                </div>
                                <p className="text-slate-500 text-[9px] mt-0.5">{rule.problem}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <code className="block rounded bg-slate-900 text-slate-100 p-2 text-[9px] font-mono overflow-x-auto">
                        {rulePackage.composerRequireDev}
                      </code>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collapsible Optional Section 3: Advanced Manual Includes Override */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setIsCustomIncludesOpen(!isCustomIncludesOpen)}
          className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/80 text-left transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Code className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wide">
              Advanced Manual Includes Override
            </span>
            {config.extensions.customIncludes.length > 0 && (
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-md">
                {config.extensions.customIncludes.length} custom
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-slate-400 text-xs font-mono">
            <span className="text-[10px]">{isCustomIncludesOpen ? 'Hide' : 'Add Path'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isCustomIncludesOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {isCustomIncludesOpen && (
          <div className="p-4 bg-white border-t border-slate-200 space-y-3">
            <p className="text-[10px] text-slate-500">
              Have an uncurated custom extension or local rule file? Add the relative directory filepath below to include them inside your finalized Neon build manually.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={newCustomIncludeItem}
                onChange={(e) => setNewCustomIncludeItem(e.target.value)}
                placeholder="e.g. vendor/username/phpstan-custom-package/rules.neon"
                id="add-custom-include-field"
                className="flex-1 h-9 bg-white border border-slate-300 rounded-lg px-3 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-xs"
                onKeyDown={(e) => { 
                  if (e.key === 'Enter') { 
                    handleAddCustomInclude(); 
                  } 
                }}
              />
              <button
                type="button"
                onClick={handleAddCustomInclude}
                className="h-9 w-9 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-300 cursor-pointer flex items-center justify-center shrink-0"
                title="Add include"
              >
                <Plus className="w-4 h-4" />
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
        )}
      </div>

    </div>
  );
}
