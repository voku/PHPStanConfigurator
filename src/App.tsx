/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Settings, 
  ShieldAlert, 
  Puzzle, 
  FileText, 
  HelpCircle, 
  Plus, 
  Trash2, 
  AlertCircle, 
  CheckCircle, 
  BookOpen, 
  Sparkles, 
  Terminal, 
  ChevronRight, 
  Layers,
  ArrowRight,
  RefreshCw,
  Github,
  Download,
  FileCode,
  Compass
} from 'lucide-react';

import { PhpStanConfig, Preset, Extensions, BaselineConfig } from './types';
import { DEFAULT_CONFIG, PRESETS, PHP_VERSIONS, PHPSTAN_LEVEL_GUARDS, RULE_EXPLANATIONS } from './data/rules';
import { renderNeon, parseNeon, formatPhpVersion } from './lib/neon';

import { NeonEditor } from './components/NeonEditor';
import { PhpStanExtensionLibrary } from './components/PhpStanExtensionLibrary';
import { CiPipelines } from './components/CiPipelines';
import { AiAdvisor } from './components/AiAdvisor';
import { ExportModal } from './components/ExportModal';

export default function App() {
  // General Configuration State
  const [config, setConfig] = useState<PhpStanConfig>({ ...DEFAULT_CONFIG });
  const [activePresetId, setActivePresetId] = useState<string>('modern'); // default modern
  const [startMode, setStartMode] = useState<string>('composer');
  const [importText, setImportText] = useState('');
  const [composerText, setComposerText] = useState('');
  const [localComposerStatus, setLocalComposerStatus] = useState<{ message: string; type: 'success' | 'error' | null; detected: string[] }>({
    message: '',
    type: null,
    detected: []
  });
  const [hoveredRule, setHoveredRule] = useState<string | null>(null);
  
  // Cleaned filters
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('All');
  
  // Custom manual inputs
  const [newPath, setNewPath] = useState('');
  const [newExclude, setNewExclude] = useState('');
  const [newBootstrap, setNewBootstrap] = useState('');
  const [newAutoload, setNewAutoload] = useState('');
  const [newCustomInclude, setNewCustomInclude] = useState('');

  // Local Alerts & Validation
  const [validationAlerts, setValidationAlerts] = useState<string[]>([]);
  
  // Neon code string representation
  const [neonCode, setNeonCode] = useState('');

  // Custom export modal toggle
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Custom keyboard shortcut notification toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // On Load: set state matching 'modern' preset
  useEffect(() => {
    const modernPreset = PRESETS.find(p => p.id === 'modern');
    if (modernPreset) {
      setConfig({ ...modernPreset.config });
    }
  }, []);

  // Sync rendered Neon representation when state updates
  useEffect(() => {
    const activePreset = PRESETS.find(p => p.id === activePresetId);
    const code = renderNeon(config, activePreset ? activePreset.name : 'Modern Web App');
    setNeonCode(code);
    validateConfigLocally(config);
  }, [config, activePresetId]);

  // Client-side instant validation rule checker
  const validateConfigLocally = (cfg: PhpStanConfig) => {
    const alerts: string[] = [];
    
    // Check path count
    if (cfg.paths.length === 0) {
      alerts.push("No scan paths defined. Running PHPStan requires at least one target path (e.g. 'src').");
    }

    // Check duplicate path elements
    const duplicatePath = cfg.paths.filter((item, index) => cfg.paths.indexOf(item) !== index);
    if (duplicatePath.length > 0) {
      alerts.push(`Duplicate scan path element exists: "${duplicatePath[0]}".`);
    }

    // Check level guard vs PHP version
    const lvlInt = parseInt(cfg.level, 10);
    if (lvlInt >= 8 && parseInt(cfg.phpVersion, 10) < 70400) {
      alerts.push("Warning: Level 8+ analysis on PHP preceding 7.4 may introduce high annotations noise due to union type limits.");
    }

    // Check conflicting settings -> bleedingEdge + baseline
    if (cfg.strictRules.bleedingEdge && cfg.baseline) {
      alerts.push("Conflict warning: Coexistence of a baseline with bleedingEdge strict preset can suppress critical new syntax warnings from the next release.");
    }

    setValidationAlerts(alerts);
  };
  
  // Local Composer JSON Dependency Scanner
  const handleLocalScanComposer = () => {
    if (!composerText.trim()) return;
    setLocalComposerStatus({ message: '', type: null, detected: [] });

    try {
      const obj = JSON.parse(composerText);
      const req = { ...obj.require, ...obj['require-dev'] };
      
      if (!req) {
        throw new Error('Could not read package properties from keys "require" or "require-dev".');
      }

      const detectedList: string[] = [];
      const updatedExtensions = (config.extensions.selectedExtensions || []).map(ext => {
        let enabled = ext.enabled;
        const mappedComposer = ext.id === 'sidz-rules' ? 'sidz/phpstan-rules' :
                               ext.id === 'voku-rules' ? 'voku/' :
                               ext.id === 'strict-rules' ? 'phpstan/phpstan-strict-rules' :
                               ext.id === 'doctrine' ? 'doctrine/' :
                               ext.id === 'symfony' ? 'symfony/' :
                               ext.id === 'larastan' ? 'laravel/' :
                               ext.id === 'deprecation-rules' ? 'phpstan/phpstan-deprecation-rules' : '';

        if (mappedComposer && Object.keys(req).some(k => k.includes(mappedComposer))) {
          enabled = true;
          detectedList.push(ext.id);
        }
        return { ...ext, enabled };
      });

      setConfig(prev => {
        const hasSymfony = Object.keys(req).some(k => k.includes('symfony/'));
        const hasDoctrine = Object.keys(req).some(k => k.includes('doctrine/'));
        const hasLarastan = Object.keys(req).some(k => k.includes('laravel/') || k.includes('nunomaduro/larastan'));
        
        return {
          ...prev,
          extensions: {
            ...prev.extensions,
            doctrine: prev.extensions.doctrine || hasDoctrine,
            symfony: prev.extensions.symfony || hasSymfony,
            larastan: prev.extensions.larastan || hasLarastan,
            selectedExtensions: updatedExtensions.length > 0 ? updatedExtensions : prev.extensions.selectedExtensions
          }
        };
      });

      if (detectedList.length > 0) {
        setLocalComposerStatus({
          message: `Dependencies scanner run successfully. Mapped and activated matching packages.`,
          type: 'success',
          detected: detectedList
        });
        showToast(`Linked dependencies: ${detectedList.join(', ')}`, 'success');
      } else {
        setLocalComposerStatus({
          message: 'Decoded composer.json, but did not match known high-fidelity packages. Active manually in step 3.',
          type: 'success',
          detected: []
        });
      }
    } catch (err: any) {
      setLocalComposerStatus({
        message: `Syntax error: ${err.message}`,
        type: 'error',
        detected: []
      });
    }
  };

  // Preset Selection Manager
  const handlePresetSelect = (preset: Preset) => {
    setConfig({ ...preset.config });
    setActivePresetId(preset.id);
  };

  const handleResetToPresetPreset = () => {
    const original = PRESETS.find(p => p.id === activePresetId);
    if (original) {
      setConfig({ ...original.config });
    }
  };

  // Keyboard Shortcuts Hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      // Cmd+E or Ctrl+E to export config
      if (isMeta && key === 'e') {
        e.preventDefault();
        setIsExportModalOpen(prev => !prev);
        showToast('Export Configuration container toggled!', 'info');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Custom Neon string parser loader
  const handleNeonImport = (neonString: string) => {
    const parsed = parseNeon(neonString);
    
    // Merge updates with default fallback values
    const merged: PhpStanConfig = {
      level: parsed.level ?? config.level,
      phpVersion: parsed.phpVersion ?? config.phpVersion,
      paths: parsed.paths ?? config.paths,
      excludes: parsed.excludes ?? config.excludes,
      bootstrapFiles: parsed.bootstrapFiles ?? config.bootstrapFiles,
      autoloadFiles: parsed.autoloadFiles ?? config.autoloadFiles,
      strictRules: {
        treatPhpDocTypesAsCertain: parsed.strictRules?.treatPhpDocTypesAsCertain ?? config.strictRules.treatPhpDocTypesAsCertain,
        bleedingEdge: parsed.strictRules?.bleedingEdge ?? config.strictRules.bleedingEdge,
        reportUnmatchedIgnoredErrors: parsed.strictRules?.reportUnmatchedIgnoredErrors ?? config.strictRules.reportUnmatchedIgnoredErrors,
        reportIgnoresWithoutComments: parsed.strictRules?.reportIgnoresWithoutComments ?? config.strictRules.reportIgnoresWithoutComments,
        checkImplicitMixed: parsed.strictRules?.checkImplicitMixed ?? config.strictRules.checkImplicitMixed,
        checkBenevolentUnionTypes: parsed.strictRules?.checkBenevolentUnionTypes ?? config.strictRules.checkBenevolentUnionTypes,
      },
      extensions: {
        doctrine: parsed.extensions?.doctrine ?? config.extensions.doctrine,
        symfony: parsed.extensions?.symfony ?? config.extensions.symfony,
        larastan: parsed.extensions?.larastan ?? config.extensions.larastan,
        customIncludes: parsed.extensions?.customIncludes ?? config.extensions.customIncludes,
      },
      baseline: parsed.baseline !== undefined ? parsed.baseline : config.baseline,
    };

    setConfig(merged);
    
    // Attempt to identify matching preset based on level
    const match = PRESETS.find(p => p.config.level === merged.level);
    if (match) {
      setActivePresetId(match.id);
    } else {
      setActivePresetId(''); // custom
    }
  };

  // Manipulating standard config array modifiers
  const addPath = () => {
    const trimmed = newPath.trim();
    if (trimmed && !config.paths.includes(trimmed)) {
      setConfig(prev => ({ ...prev, paths: [...prev.paths, trimmed] }));
      setNewPath('');
    }
  };

  const removePath = (idx: number) => {
    setConfig(prev => ({ ...prev, paths: prev.paths.filter((_, i) => i !== idx) }));
  };

  const addExclude = () => {
    const trimmed = newExclude.trim();
    if (trimmed && !config.excludes.includes(trimmed)) {
      setConfig(prev => ({ ...prev, excludes: [...prev.excludes, trimmed] }));
      setNewExclude('');
    }
  };

  const removeExclude = (idx: number) => {
    setConfig(prev => ({ ...prev, excludes: prev.excludes.filter((_, i) => i !== idx) }));
  };

  const addBootstrap = () => {
    const trimmed = newBootstrap.trim();
    if (trimmed && !config.bootstrapFiles.includes(trimmed)) {
      setConfig(prev => ({ ...prev, bootstrapFiles: [...prev.bootstrapFiles, trimmed] }));
      setNewBootstrap('');
    }
  };

  const removeBootstrap = (idx: number) => {
    setConfig(prev => ({ ...prev, bootstrapFiles: prev.bootstrapFiles.filter((_, i) => i !== idx) }));
  };

  const addAutoload = () => {
    const trimmed = newAutoload.trim();
    if (trimmed && !config.autoloadFiles.includes(trimmed)) {
      setConfig(prev => ({ ...prev, autoloadFiles: [...prev.autoloadFiles, trimmed] }));
      setNewAutoload('');
    }
  };

  const removeAutoload = (idx: number) => {
    setConfig(prev => ({ ...prev, autoloadFiles: prev.autoloadFiles.filter((_, i) => i !== idx) }));
  };

  const addCustomInclude = (incStr: string) => {
    const trimmed = incStr.trim();
    if (trimmed && !config.extensions.customIncludes.includes(trimmed)) {
      setConfig(prev => ({
        ...prev,
        extensions: {
          ...prev.extensions,
          customIncludes: [...prev.extensions.customIncludes, trimmed],
        }
      }));
    }
  };

  const removeCustomInclude = (idx: number) => {
    setConfig(prev => ({
      ...prev,
      extensions: {
        ...prev.extensions,
        customIncludes: prev.extensions.customIncludes.filter((_, i) => i !== idx),
      }
    }));
  };

  // Slider level formatter logic (translating 0-10 slider + max into "max")
  const getLevelFromSlider = (val: number): string => {
    if (val === 11) return 'max';
    return val.toString();
  };

  const getSliderValueFromLevel = (lvl: string): number => {
    if (lvl === 'max') return 11;
    return parseInt(lvl, 10) || 0;
  };

  const activeLevelGuard = PHPSTAN_LEVEL_GUARDS.find(
    g => g.level === config.level || (config.level === 'max' && g.level === '10')
  );

  return (
    <div className="min-h-screen text-slate-800 font-sans flex flex-col selection:bg-indigo-100 selection:text-indigo-900 bg-[#f8fafc]">
      
      {/* Header element */}
      <header className="bg-slate-900 text-white border-b border-slate-800 px-6 py-4 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/20 border border-indigo-505/30 rounded-xl">
              <Layers className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold font-mono tracking-tight text-white flex items-center gap-1.5">
                  PHPStan Configurator <span className="text-xs bg-indigo-650 text-indigo-50 px-1.5 py-0.5 rounded uppercase font-mono tracking-wider font-extrabold scale-90">v2.0</span>
                </h1>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-full">
                  voku-spec
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Created by <a href="https://github.com/voku" target="_blank" rel="noreferrer" className="text-indigo-455 hover:underline font-semibold hover:text-indigo-305">Lars Moelleken (voku)</a>. Pure, deterministic, interactive config engineering.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 hidden sm:inline">Theme:</span>
            <span className="text-xs font-mono font-medium px-2.5 py-1 bg-slate-800 text-indigo-300 border border-slate-700 rounded-lg shadow-inner flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
              Pristine Slate Light
            </span>
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-650 hover:bg-indigo-500 text-xs font-bold text-white rounded-lg shadow-lg shadow-indigo-950/20 hover:shadow-indigo-700/35 transition-all cursor-pointer animate-fadeIn"
              id="header-export-btn"
              title="Export Config (Cmd+E / Ctrl+E)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Config</span>
              <kbd className="hidden lg:inline-block text-[9px] bg-indigo-755 text-indigo-100 font-mono px-1 py-0.5 rounded leading-none scale-95 shadow-sm font-bold ml-1">
                ⌘E
              </kbd>
            </button>
            <a 
              href="https://github.com/voku" 
              target="_blank" 
              rel="noreferrer"
              className="p-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Lars on GitHub"
            >
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Main workspace section */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
        
        {/* Left Interactive Parameters Form Sheet */}
        <div className="lg:col-span-7 space-y-6 order-2 lg:order-1">
                   {/* Step 1: Configuration Source & Blueprint Hub */}
          <section id="project-start-profile-section" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] bg-slate-105 text-slate-600 border rounded-md font-mono font-bold">STEP 1</span>
                <h2 className="text-base font-bold text-slate-900 tracking-tight font-sans">
                  Choose Configuration Blueprint
                </h2>
              </div>
              <p className="text-xs text-slate-505 leading-normal mt-1">
                Autofill all static testing controls, inclusions, and paths by picking a dedicated framework blueprint, importing an existing neon codebase file, or running a dependency scan.
              </p>
            </div>

            {/* Start Source Tabs Selection with rich icons */}
            <div className="space-y-4">
              <div className="flex gap-1 px-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200/50">
                {[
                  { id: 'composer', label: 'Scan composer.json', icon: <Terminal className="w-3.5 h-3.5" /> },
                  { id: 'preset', label: 'Preset Blueprints', icon: <Compass className="w-3.5 h-3.5" /> },
                  { id: 'import', label: 'Import .neon.dist', icon: <FileCode className="w-3.5 h-3.5" /> }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setStartMode(t.id)}
                    className={`flex-1 py-2 px-2 rounded-lg text-center font-bold text-[10px] sm:text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                      startMode === t.id
                        ? 'bg-indigo-600 text-white shadow-md font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    {t.icon}
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>

              {/* Start Mode Content */}
              {startMode === 'composer' && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-3 animate-fadeIn">
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Paste your local <code className="bg-white px-1.5 border rounded text-[10px] font-mono">composer.json</code> mapping to scan active framework dependencies. Detected packages automatically toggle high-fidelity recommended extension settings!
                  </p>
                  <textarea
                    value={composerText}
                    onChange={(e) => setComposerText(e.target.value)}
                    placeholder={`{\n  "require": {\n    "symfony/framework-bundle": "^6.4",\n    "doctrine/orm": "^2.19",\n    "voku/html-minify": "^2.1",\n    "sidz/phpstan-rules": "^1.0"\n  }\n}`}
                    rows={4}
                    id="composer-json-textarea-s1"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none focus:border-indigo-500"
                  />
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setComposerText(`{\n  "require": {\n    "symfony/framework-bundle": "^6.4",\n    "doctrine/orm": "^3.0",\n    "laravel/framework": "^10.0",\n    "phpunit/phpunit": "^10.4",\n    "voku/portable-utf8": "^6.1",\n    "sidz/phpstan-rules": "^1.0"\n  }\n}`);
                      }}
                      className="text-[10px] font-semibold text-slate-600 hover:text-indigo-600 bg-white border px-2.5 py-1 rounded-md cursor-pointer transition-colors shadow-sm"
                    >
                      Load mock composer.json
                    </button>
                    <button
                      type="button"
                      disabled={!composerText.trim()}
                      onClick={handleLocalScanComposer}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0 shadow-sm"
                    >
                      <span>Scan Dependencies</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {localComposerStatus.type === 'success' && (
                    <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-950 text-[11px] space-y-1.5 animate-fadeIn">
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-700 font-bold shrink-0">✓</span>
                        <strong>Detected Companion Packages:</strong>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-4 pb-1">
                        {localComposerStatus.detected.length > 0 ? (
                          localComposerStatus.detected.map((pkg) => (
                            <div key={pkg} className="flex items-center gap-1 bg-white border border-emerald-200/50 rounded px-1.5 py-0.5 shadow-sm">
                              <span className="w-1 h-1 bg-emerald-600 rounded-full shrink-0" />
                              <span className="font-mono text-[9px] text-emerald-800">{pkg}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-[10px] text-slate-500 italic">No recognized extension components found. Try loading the mock list!</p>
                        )}
                      </div>
                    </div>
                  )}

                  {localComposerStatus.type === 'error' && (
                    <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-800 text-[11px] flex gap-2 font-mono animate-fadeIn">
                      <span className="text-rose-600 shrink-0">⚠</span>
                      <p>{localComposerStatus.message}</p>
                    </div>
                  )}
                </div>
              )}

              {startMode === 'import' && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-3 animate-fadeIn">
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Paste an existing <code className="bg-white px-1.5 border rounded text-[10px] font-mono">phpstan.neon.dist</code> config text block. The parser will seamlessly auto-populate configuration strictness and settings:
                  </p>
                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="parameters:&#10;  level: 6&#10;  paths:&#10;    - src&#10;  excludes_analyse:&#10;    - vendor"
                    rows={4}
                    id="import-neon-textarea-s1"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none focus:border-indigo-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={!importText.trim()}
                      onClick={() => {
                        try {
                          const parsed = parseNeon(importText);
                          setConfig(parsed);
                          showToast('Imported and mapped PHPStan config successfully.', 'success');
                        } catch (err: any) {
                          showToast(`Failed to parse config: ${err.message}`, 'info');
                        }
                      }}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer shadow-sm animate-fadeIn"
                    >
                      Import configuration
                    </button>
                  </div>
                </div>
              )}

              {startMode === 'preset' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Category Filtration Tabs */}
                  <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/50">
                    {[
                      { id: 'All', label: '📦 All Blueprints' },
                      { id: 'General', label: '✨ Generic MVC' },
                      { id: 'Performance Focused', label: '⚡ Frameworks' },
                      { id: 'Security Focused', label: '🛡️ Packages' },
                      { id: 'Legacy Compatibility', label: '🦖 Legacy' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSelectedFilterCategory(tab.id)}
                        className={`py-1.5 px-1 text-center font-bold text-[9px] md:text-[10px] rounded-lg transition-all cursor-pointer flex-1 ${
                          selectedFilterCategory === tab.id
                            ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                            : 'text-slate-650 hover:bg-slate-200 hover:text-slate-900'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Redesigned interactive Preset Card Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
                    {PRESETS
                      .filter(p => selectedFilterCategory === 'All' || p.category === selectedFilterCategory)
                      .map((preset) => {
                        const isSelected = activePresetId === preset.id;
                        return (
                          <div
                            key={preset.id}
                            onClick={() => handlePresetSelect(preset)}
                            className={`group text-left p-4 rounded-xl border transition-all text-xs flex flex-col justify-between cursor-pointer relative overflow-hidden select-none ${
                              isSelected
                                ? 'bg-indigo-50/50 border-indigo-500 ring-2 ring-indigo-500/15 text-slate-900 font-normal shadow-sm'
                                : 'bg-white border-slate-200 hover:border-indigo-400 hover:bg-slate-50/60 shadow-sm'
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-1.5">
                                <div className="space-y-0.5">
                                  <span className="font-extrabold text-[12px] text-slate-800 block leading-tight">{preset.name}</span>
                                  <span className="text-[8px] font-mono text-indigo-650 font-bold uppercase tracking-wider">{preset.target}</span>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <span className={`text-[8px] border px-1.5 py-0.5 rounded uppercase font-mono tracking-wider font-extrabold ${
                                    preset.strictness === 'High' 
                                      ? 'bg-rose-50 text-rose-700 border-rose-200' 
                                      : preset.strictness === 'Medium' 
                                        ? 'bg-indigo-50 text-indigo-705 border-indigo-200'
                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                  }`}>
                                    {preset.strictness} Code
                                  </span>
                                  {isSelected && (
                                    <span className="text-[7.5px] bg-indigo-600 text-white font-mono rounded px-1.5 py-0.2 uppercase font-extrabold tracking-widest scale-95 flex items-center gap-1 h-[14px]">
                                      <span className="w-1 h-1 bg-white rounded-full shrink-0 animate-pulse" />
                                      Active
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="text-[9.5px] leading-relaxed text-slate-500 group-hover:text-slate-600 line-clamp-3">
                                {preset.description}
                              </p>
                            </div>

                            {/* Preset High-density parameter summary preview */}
                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[8.5px] font-mono text-slate-400">
                              <div className="flex items-center gap-2">
                                <span>Lvl: <strong className="text-slate-705">{preset.config.level}</strong></span>
                                <span className="text-slate-300">|</span>
                                <span>PHP: <strong className="text-slate-705">{(parseFloat(preset.config.phpVersion) / 10000).toFixed(1)}</strong></span>
                                <span className="text-slate-300">|</span>
                                <span>Paths: <strong className="text-slate-705">{preset.config.paths.join(', ')}</strong></span>
                              </div>
                              
                              {/* Integrated Framework Extension lights indicator */}
                              <div className="flex gap-1">
                                <span 
                                  title="Symfony Extension"
                                  className={`w-3.5 h-3.5 rounded flex items-center justify-center font-bold text-[7px] border font-sans select-none ${
                                    preset.config.extensions.symfony 
                                      ? 'bg-indigo-105 text-indigo-700 border-indigo-300' 
                                      : 'bg-slate-50 text-slate-300 border-slate-200'
                                  }`}
                                >
                                  S
                                </span>
                                <span 
                                  title="Doctrine Database Integration"
                                  className={`w-3.5 h-3.5 rounded flex items-center justify-center font-bold text-[7px] border font-sans select-none ${
                                    preset.config.extensions.doctrine 
                                      ? 'bg-emerald-100 text-emerald-700 border-emerald-300' 
                                      : 'bg-slate-50 text-slate-300 border-slate-200'
                                  }`}
                                >
                                  D
                                </span>
                                <span 
                                  title="Larastan Laravel Integration"
                                  className={`w-3.5 h-3.5 rounded flex items-center justify-center font-bold text-[7px] border font-sans select-none ${
                                    preset.config.extensions.larastan 
                                      ? 'bg-rose-100 text-rose-700 border-rose-300' 
                                      : 'bg-slate-50 text-slate-300 border-slate-200'
                                  }`}
                                >
                                  L
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {activePresetId && (
                    <div className="p-3 bg-indigo-50 border border-indigo-100/50 rounded-xl text-[10px] text-indigo-950 flex items-center justify-between animate-fadeIn">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600 scale-95 shrink-0 animate-pulse" />
                        <p>
                          Active Project Preset: <strong className="text-indigo-900">"{PRESETS.find(p => p.id === activePresetId)?.name}"</strong> controls applied!
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleResetToPresetPreset}
                        className="text-[9px] font-bold text-indigo-600 hover:text-indigo-850 bg-white border border-indigo-200/50 rounded px-2 py-0.5 shadow-sm transition-colors cursor-pointer"
                      >
                        Reset Applied Options
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Project Profile Setup Options */}
            <div className="border-t border-slate-205 pt-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] bg-slate-100 text-slate-600 border rounded-md font-mono font-bold">STEP 2</span>
                <h2 className="text-base font-bold text-slate-900 tracking-tight font-sans">
                  Configure Environment & Targets
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* PHP Runtime Selector */}
                <div className="space-y-1.5 md:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-600 font-mono uppercase tracking-wider">
                    PHP version runtime target:
                  </label>
                  <div className="grid grid-cols-6 gap-1 px-1 py-1 bg-slate-100/60 rounded-xl border">
                    {['80400', '80300', '80200', '80100', '80000', '70400'].map((ver) => {
                      const label = ver === '80400' ? '8.4' :
                                    ver === '80300' ? '8.3' :
                                    ver === '80200' ? '8.2' :
                                    ver === '80100' ? '8.1' :
                                    ver === '80000' ? '8.0' : '7.4';
                      const isSelected = config.phpVersion === ver;
                      return (
                        <button
                          key={ver}
                          type="button"
                          onClick={() => setConfig(prev => ({ ...prev, phpVersion: ver }))}
                          className={`py-1 text-center font-bold text-[10.5px] rounded-lg border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md font-extrabold font-mono'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* PHPStan generation target info */}
                <div className="space-y-1.5 md:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-600 font-mono uppercase tracking-wider">
                    PHPStan target generation format:
                  </label>
                  <div className="bg-slate-100 border border-slate-200 text-slate-700 px-3.5 py-1.5 rounded-xl font-bold font-mono text-xs flex items-center justify-between h-[34px] shadow-sm">
                    <span className="text-slate-800">CJS / Neon 2.x</span>
                    <span className="text-[8px] font-mono px-2 py-0.5 bg-emerald-600 text-white rounded-full uppercase tracking-wider font-extrabold leading-none">Active format</span>
                  </div>
                </div>
              </div>


            </div>
          </section>

          {/* Slider Gauge section */}
          <section id="level-slider-section" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-slate-800 uppercase font-mono">Static strictness tier</span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] font-mono">
                  level: {config.level}
                </span>
              </div>
              <span className={`text-[11px] font-mono font-bold uppercase ${activeLevelGuard?.color}`}>
                {activeLevelGuard?.strictnessLabel}
              </span>
            </div>

            {/* Continuous range slider */}
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="11"
                value={getSliderValueFromLevel(config.level)}
                onChange={(e) => {
                  const newLvl = getLevelFromSlider(parseInt(e.target.value, 10));
                  setConfig(prev => ({ ...prev, level: newLvl }));
                  setActivePresetId(''); // custom
                }}
                id="strictness-range-slider"
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              
              <div className="flex justify-between text-[10px] font-mono text-slate-400 px-1">
                {['0','1','2','3','4','5','6','7','8','9','10','max'].map((lbl, idx) => (
                  <span 
                    key={lbl} 
                    onClick={() => {
                      setConfig(prev => ({ ...prev, level: lbl }));
                      setActivePresetId('');
                    }}
                    className={`cursor-pointer transition-colors ${
                      config.level === lbl ? 'text-indigo-600 font-bold' : 'hover:text-slate-700'
                    }`}
                  >
                    {lbl}
                  </span>
                ))}
              </div>
            </div>

            {/* Level metadata details display */}
            {activeLevelGuard && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <p className="font-semibold text-slate-800">{activeLevelGuard.title}</p>
                <p className="text-[11px] text-slate-500 leading-relaxed font-normal">{activeLevelGuard.desc}</p>
              </div>
            )}

            {config.level === 'max' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[10.5px] leading-normal text-amber-900 font-sans flex items-start gap-2 animate-fadeIn">
                <span className="text-amber-600 font-bold shrink-0">⚠️ note:</span>
                <p className="text-slate-600">
                  PHPStan defines <code className="font-mono bg-amber-100/40 px-1 border border-amber-200 rounded">max</code> as an alias for the highest available level. <strong>Be aware that your build pipelines may become automatically rules-stricter</strong> as PHPStan adds deeper level constraints in upstream package releases.
                </p>
              </div>
            )}
          </section>

          {/* Parameters Tab Folders */}
          <div className="space-y-4">
            
            {/* Folder 1: Basic Target parameters */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative">
              <div className="flex items-center gap-1.5 mb-4 pb-2 border-b border-slate-100">
                <Settings className="w-4 h-4 text-indigo-600" />
                <h3 className="font-semibold text-xs font-mono uppercase tracking-wider text-slate-800">
                  1. Analysis Targets & Paths
                </h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Read-Only synchronized PHP analysis version indicator */}
                <div className="space-y-1.5 opacity-85">
                  <label className="block text-xs font-medium text-slate-500">PHP Analysis Version Target</label>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-xs font-mono font-bold flex items-center justify-between h-[34px]">
                    <span>PHP {formatPhpVersion(config.phpVersion)}</span>
                    <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-normal">{config.phpVersion}</span>
                  </div>
                </div>

                {/* Scan paths */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-700">Scan Paths (paths)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPath}
                      onChange={(e) => setNewPath(e.target.value)}
                      placeholder="e.g. src"
                      id="add-path-input"
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                      onKeyDown={(e) => { if (e.key === 'Enter') addPath(); }}
                    />
                    <button
                      onClick={addPath}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all border border-slate-300 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {config.paths.map((p, idx) => (
                      <span key={idx} className="flex items-center gap-1 text-[11px] px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-700">
                        {p}
                        <button onClick={() => removePath(idx)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-indigo-600/95 leading-snug mt-1 pt-1 border-t border-slate-100">
                    💡 <strong>Pro Tip:</strong> Include your <code className="font-mono text-[9px] bg-slate-100 border px-1 rounded">tests</code> path to static analyze test mock constraints and assert assertions!
                  </p>
                </div>

                {/* Exclude paths */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-700">Excluded (excludePaths)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newExclude}
                      onChange={(e) => setNewExclude(e.target.value)}
                      placeholder="e.g. vendor"
                      id="add-exclude-input"
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                      onKeyDown={(e) => { if (e.key === 'Enter') addExclude(); }}
                    />
                    <button
                      onClick={addExclude}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all border border-slate-300 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {config.excludes.map((p, idx) => (
                      <span key={idx} className="flex items-center gap-1 text-[11px] px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-700">
                        {p}
                        <button onClick={() => removeExclude(idx)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bootstrap files */}
                <div className="space-y-2" onMouseEnter={() => setHoveredRule('bootstrapFiles')} onMouseLeave={() => setHoveredRule(null)}>
                  <label className="block text-xs font-medium text-slate-700">Bootstraps (bootstrapFiles)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newBootstrap}
                      onChange={(e) => setNewBootstrap(e.target.value)}
                      placeholder="e.g. phpstan-bootstrap.php"
                      id="add-bootstrap-input"
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                      onKeyDown={(e) => { if (e.key === 'Enter') addBootstrap(); }}
                    />
                    <button
                      onClick={addBootstrap}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all border border-slate-300 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {config.bootstrapFiles.map((b, idx) => (
                      <span key={idx} className="flex items-center gap-1 text-[11px] px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-700">
                        {b}
                        <button onClick={() => removeBootstrap(idx)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Autoload files */}
                <div className="space-y-2" onMouseEnter={() => setHoveredRule('autoloadFiles')} onMouseLeave={() => setHoveredRule(null)}>
                  <label className="block text-xs font-medium text-slate-700">Scan Files (scanFiles)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newAutoload}
                      onChange={(e) => setNewAutoload(e.target.value)}
                      placeholder="e.g. helpers/functions.php"
                      id="add-autoload-input"
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                      onKeyDown={(e) => { if (e.key === 'Enter') addAutoload(); }}
                    />
                    <button
                      onClick={addAutoload}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all border border-slate-300 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {config.autoloadFiles.map((f, idx) => (
                      <span key={idx} className="flex items-center gap-1 text-[11px] px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-700">
                        {f}
                        <button onClick={() => removeAutoload(idx)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Folder 2: Strictness Toggles */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-1.5 mb-4 pb-2 border-b border-slate-100">
                <ShieldAlert className="w-4 h-4 text-indigo-600" />
                <h3 className="font-semibold text-xs font-mono uppercase tracking-wider text-slate-800">
                  2. Type Strictness Constraints
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* treatPhpDocTypesAsCertain */}
                <div 
                  className="flex items-start gap-3 p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl transition-all cursor-pointer"
                  onMouseEnter={() => setHoveredRule('treatPhpDocTypesAsCertain')}
                  onMouseLeave={() => setHoveredRule(null)}
                  onClick={() => setConfig(prev => ({
                    ...prev,
                    strictRules: { ...prev.strictRules, treatPhpDocTypesAsCertain: !(prev.strictRules.treatPhpDocTypesAsCertain ?? true) }
                  }))}
                >
                  <input
                    type="checkbox"
                    readOnly
                    checked={config.strictRules.treatPhpDocTypesAsCertain ?? true}
                    className="mt-1 accent-indigo-600 rounded focus:ring-0"
                  />
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 select-none">Treat PHPDoc as certain</label>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                      Trust user docblocks as absolute types. Untrimmed for stable APIs, disable if vendor annotations are unreliable.
                    </p>
                  </div>
                </div>

                {/* bleedingEdge */}
                <div 
                  className="flex items-start gap-3 p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl transition-all cursor-pointer"
                  onMouseEnter={() => setHoveredRule('bleedingEdge')}
                  onMouseLeave={() => setHoveredRule(null)}
                  onClick={() => setConfig(prev => ({
                    ...prev,
                    strictRules: { ...prev.strictRules, bleedingEdge: !prev.strictRules.bleedingEdge }
                  }))}
                >
                  <input
                    type="checkbox"
                    readOnly
                    checked={config.strictRules.bleedingEdge}
                    className="mt-1 accent-indigo-600 text-indigo-600 border border-slate-300 rounded focus:ring-0"
                  />
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 select-none">Enable Bleeding Edge</label>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                      Includes PHPStan’s documented Bleeding Edge ruleset for next-major rules, fixes, and behaviour changes.
                    </p>
                  </div>
                </div>

                {/* reportUnmatchedIgnoredErrors */}
                <div 
                  className="flex items-start gap-3 p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl transition-all cursor-pointer"
                  onMouseEnter={() => setHoveredRule('reportUnmatchedIgnoredErrors')}
                  onMouseLeave={() => setHoveredRule(null)}
                  onClick={() => setConfig(prev => ({
                    ...prev,
                    strictRules: { ...prev.strictRules, reportUnmatchedIgnoredErrors: !(prev.strictRules.reportUnmatchedIgnoredErrors ?? true) }
                  }))}
                >
                  <input
                    type="checkbox"
                    readOnly
                    checked={config.strictRules.reportUnmatchedIgnoredErrors ?? true}
                    className="mt-1 accent-indigo-600 rounded focus:ring-0"
                  />
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 select-none">Report Unmatched Ignores</label>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                      Alerts if ignore-rules registered under your settings never match any thrown errors. Keeps config files clean.
                    </p>
                  </div>
                </div>

                {/* checkImplicitMixed */}
                <div 
                  className="flex items-start gap-3 p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl transition-all cursor-pointer"
                  onMouseEnter={() => setHoveredRule('reportIgnoresWithoutComments')}
                  onMouseLeave={() => setHoveredRule(null)}
                  onClick={() => setConfig(prev => ({
                    ...prev,
                    strictRules: { ...prev.strictRules, reportIgnoresWithoutComments: !(prev.strictRules.reportIgnoresWithoutComments ?? false) }
                  }))}
                >
                  <input
                    type="checkbox"
                    readOnly
                    checked={config.strictRules.reportIgnoresWithoutComments ?? false}
                    className="mt-1 accent-indigo-600 rounded focus:ring-0"
                  />
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 select-none">Require Ignore Comments</label>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                      Enforces reasoned `@phpstan-ignore` comments and rejects broad ignore-line shortcuts.
                    </p>
                  </div>
                </div>

                {/* checkImplicitMixed */}
                <div 
                  className="flex items-start gap-3 p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl transition-all cursor-pointer"
                  onMouseEnter={() => setHoveredRule('checkImplicitMixed')}
                  onMouseLeave={() => setHoveredRule(null)}
                  onClick={() => setConfig(prev => ({
                    ...prev,
                    strictRules: { ...prev.strictRules, checkImplicitMixed: !(prev.strictRules.checkImplicitMixed ?? false) }
                  }))}
                >
                  <input
                    type="checkbox"
                    readOnly
                    checked={config.strictRules.checkImplicitMixed ?? false}
                    className="mt-1 accent-indigo-600 rounded focus:ring-0"
                  />
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 select-none">Check Implicit Mixed</label>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                      Enables the level-10 implicit mixed checks early, even when you are still below PHPStan level 10.
                    </p>
                  </div>
                </div>

                {/* checkBenevolentUnionTypes */}
                <div 
                  className="flex items-start gap-3 p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl transition-all cursor-pointer sm:col-span-2 lg:col-span-1"
                  onMouseEnter={() => setHoveredRule('checkBenevolentUnionTypes')}
                  onMouseLeave={() => setHoveredRule(null)}
                  onClick={() => setConfig(prev => ({
                    ...prev,
                    strictRules: { ...prev.strictRules, checkBenevolentUnionTypes: !(prev.strictRules.checkBenevolentUnionTypes ?? false) }
                  }))}
                >
                  <input
                    type="checkbox"
                    readOnly
                    checked={config.strictRules.checkBenevolentUnionTypes ?? false}
                    className="mt-1 accent-indigo-600 rounded focus:ring-0"
                  />
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 select-none">Check Benevolent Unions</label>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                      Tightens checks for benevolent unions like array-key that PHPStan normally keeps lenient even at high levels.
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Folder 3: Custom Extension and Rules Library */}
            <PhpStanExtensionLibrary
              config={config}
              onChangeConfig={setConfig}
              onAddToast={showToast}
              onHoverRule={setHoveredRule}
            />

            {/* Folder 4: Baselines and Debt mitigation */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4" onMouseEnter={() => setHoveredRule('baseline')} onMouseLeave={() => setHoveredRule(null)}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-semibold text-xs font-mono uppercase tracking-wider text-slate-800">
                    4. Baseline Technical Debt File
                  </h3>
                </div>
                
                <button
                  onClick={() => {
                    if (config.baseline) {
                      setConfig(prev => ({ ...prev, baseline: null }));
                    } else {
                      setConfig(prev => ({
                        ...prev,
                        baseline: {
                          path: 'phpstan-baseline.neon',
                          generateIfMissing: true,
                          warningAboutStale: true
                        }
                      }));
                    }
                  }}
                  className={`text-[10px] px-2 py-0.5 border rounded cursor-pointer transition-colors ${
                    config.baseline 
                      ? 'bg-rose-50 border-rose-200 text-rose-700 font-medium' 
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  }`}
                  id="toggle-baseline-btn"
                >
                  {config.baseline ? 'Disable Baseline' : 'Activate Baseline'}
                </button>
              </div>

              {config.baseline ? (
                <div className="space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500">Baseline target path:</label>
                      <input
                        type="text"
                        value={config.baseline.path}
                        onChange={(e) => {
                          const val = e.target.value;
                          setConfig(prev => {
                            if (!prev.baseline) return prev;
                            return { ...prev, baseline: { ...prev.baseline, path: val } };
                          });
                        }}
                        id="baseline-path-input"
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                      />
                    </div>

                    <div className="flex flex-col justify-end space-y-1 pb-1">
                      <div 
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => {
                          setConfig(prev => {
                            if (!prev.baseline) return prev;
                            return { ...prev, baseline: { ...prev.baseline, warningAboutStale: !prev.baseline.warningAboutStale } };
                          });
                        }}
                      >
                        <input
                          type="checkbox"
                          readOnly
                          checked={config.baseline.warningAboutStale}
                          className="accent-indigo-600 rounded focus:ring-0"
                        />
                        <span className="text-[10px] text-slate-600 select-none font-medium">Warn user about stale errors</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-600 leading-normal bg-indigo-50 border border-indigo-100 p-2 rounded-lg">
                    <strong>Notice:</strong> Adopt immediateLevel checks without updating existing deprecated components. Create the baseline using: <strong className="text-indigo-600 font-mono text-[9px]">"vendor/bin/phpstan analyse --generate-baseline"</strong>.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-550">
                  No active baseline config. PHPStan will report all active parsing errors directly to stdout.
                </p>
              )}
            </div>

            {/* Folder 5: CI Scripts pipeline generation tab */}
            <CiPipelines
              level={config.level}
              paths={config.paths}
            />

          </div>

        </div>

        {/* Right Preview column layout */}
        <div className="lg:col-span-5 space-y-6 order-1 lg:order-2">
          
          {/* Real-time formatted Neon visual codesheet */}
          <NeonEditor
            neonCode={neonCode}
            config={config}
            activePreset={PRESETS.find(p => p.id === activePresetId) || null}
            onImportNeon={handleNeonImport}
            onResetToPreset={handleResetToPresetPreset}
          />

          {/* Local validation alerts panel */}
          {validationAlerts.length > 0 && (
            <div id="validation-errors-panel" className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2.5 shadow-sm">
              <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs select-none">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                <span>Structural Warning Insights</span>
              </div>
              <ul className="space-y-1.5 pl-5 list-disc text-amber-700 text-[11px] leading-relaxed">
                {validationAlerts.map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Inline explanations helper box based on hover rules state */}
          <div id="rule-explain-panel" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-semibold tracking-wider font-mono text-slate-800">
                Lars Explains option details:
              </h4>
            </div>

            {hoveredRule && RULE_EXPLANATIONS[hoveredRule] ? (
              <div className="space-y-2.5 animate-fadeIn">
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded">
                  {hoveredRule}
                </span>
                <p className="text-xs text-slate-700 font-semibold animate-fadeIn">
                  {RULE_EXPLANATIONS[hoveredRule].summary}
                </p>
                <div className="text-[11px] text-slate-500 space-y-2 select-text leading-relaxed">
                  <p>
                    <strong className="text-slate-700 font-medium">Why specify this:</strong> {RULE_EXPLANATIONS[hoveredRule].rationale}
                  </p>
                  <p>
                    <strong className="text-slate-700 font-medium">Trade-offs:</strong> {RULE_EXPLANATIONS[hoveredRule].trades}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 leading-normal">
                Hover over options, input fields, or toggles inside the configuration sheet to get detailed rules descriptions and static analysis trades.
              </p>
            )}
          </div>

          {/* Interactive AI Advisor Helper */}
          <AiAdvisor currentLevel={config.level} />

        </div>

      </main>

      <footer className="bg-white border-t border-slate-200 px-6 py-4.5 mt-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 PHPStan Configurator by Lars Moelleken (github.com/voku).</p>
          <div className="flex gap-4">
            <a href="https://github.com/voku" target="_blank" rel="noreferrer" className="hover:text-slate-800 transition-colors">GitHub Profiler</a>
            <span className="text-slate-350">|</span>
            <a href="https://phpstan.org" target="_blank" rel="noreferrer" className="hover:text-slate-800 transition-colors">PHPStan Documentation</a>
          </div>
        </div>
      </footer>

      {/* Code Export Modal Component */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        neonCode={neonCode}
        config={config}
      />

      {/* Floating Keyboard Shortcuts Notification Toast */}
      {toast && (
        <div 
          id="toast-notification"
          className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-750 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-medium animate-slideUp font-sans max-w-sm sm:max-w-md"
        >
          <div className="p-1 bg-indigo-500/15 rounded-lg flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex-1 pr-1">
            <p className="text-slate-100 font-semibold">{toast.message}</p>
          </div>
          <button 
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-200 ml-2 font-bold px-1.5 py-0.5 rounded transition-colors text-sm hover:bg-slate-800"
            title="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}

    </div>
  );
}
