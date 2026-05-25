/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Download, Check, X, FileCode, ShieldCheck, Terminal, ShieldAlert, Info } from 'lucide-react';
import { PhpStanConfig } from '../types';
import { getExtensionComposerPackage } from '../lib/phpstanExtensions';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  neonCode: string;
  config?: PhpStanConfig;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, neonCode, config }) => {
  const [copied, setCopied] = useState(false);
  const [copiedComposer, setCopiedComposer] = useState(false);

  // Generate composer install command dynamically based on config
  const getComposerCommand = (): string => {
    if (!config) {
      return 'composer require --dev phpstan/extension-installer';
    }

    const packages: string[] = [];
    const strategy = config.extensions.installationStrategy || 'hybrid';
    
    // Auto installer or hybrid requires extension-installer
    if (strategy === 'auto_installer' || strategy === 'hybrid') {
      packages.push('phpstan/extension-installer');
    }

    // Capture enabled high-fidelity selectedExtensions
    if (config.extensions.selectedExtensions) {
      for (const ext of config.extensions.selectedExtensions) {
        if (ext.enabled) {
          packages.push(getExtensionComposerPackage(ext.id));
        }
      }
    } else {
      // Legacy fallback
      if (config.extensions.symfony) packages.push('phpstan/phpstan-symfony');
      if (config.extensions.doctrine) packages.push('phpstan/phpstan-doctrine');
      if (config.extensions.larastan) packages.push('larastan/larastan');
    }

    if (packages.length === 0) {
      return 'composer require --dev phpstan/phpstan';
    }

    return `composer require --dev ${packages.join(' ')}`;
  };

  // Compile active impacts/risks description
  const getExtensionImpacts = () => {
    if (!config) return [];
    
    const impacts: { title: string; desc: string; type: 'info' | 'warning' }[] = [];
    const symfActive = config.extensions.selectedExtensions?.find(e => e.id === 'symfony')?.enabled ?? config.extensions.symfony;
    const doctrineActive = config.extensions.selectedExtensions?.find(e => e.id === 'doctrine')?.enabled ?? config.extensions.doctrine;
    const larastanActive = config.extensions.selectedExtensions?.find(e => e.id === 'larastan')?.enabled ?? config.extensions.larastan;
    const strictActive = config.extensions.selectedExtensions?.find(e => e.id === 'strict-rules')?.enabled ?? false;
    const depActive = config.extensions.selectedExtensions?.find(e => e.id === 'deprecation-rules')?.enabled ?? false;
    const vokuActive = config.extensions.selectedExtensions?.find(e => e.id === 'voku-rules')?.enabled ?? false;
    const sidzActive = config.extensions.selectedExtensions?.find(e => e.id === 'sidz-rules')?.enabled ?? false;

    if (symfActive) {
      impacts.push({
        title: 'Symfony Integration',
        desc: 'Significantly improves Dependency Injection Container (DIC) awareness, validating parameter definitions & lookup returns.',
        type: 'info'
      });
    }
    if (doctrineActive) {
      impacts.push({
        title: 'Doctrine ORM Integration',
        desc: 'Enables high-fidelity ORM entity annotations mapping and query builder return-type inference.',
        type: 'info'
      });
    }
    if (larastanActive) {
      impacts.push({
        title: 'Larastan Compatibility',
        desc: 'Resolves Eloquent Model relations and dynamic Magic Facades methods elegantly without fake placeholder suppression.',
        type: 'info'
      });
    }
    if (strictActive) {
      impacts.push({
        title: 'Strict Rules Pack',
        desc: 'Strictly forbids unvouched code structures and enforces compile-time safety guards, heavily increasing findings count.',
        type: 'warning'
      });
    }
    if (depActive) {
      impacts.push({
        title: 'Deprecation Tracker',
        desc: 'Helps trace upstream legacy structures and API deprecations to future-proof current dependencies upgrade pathways.',
        type: 'info'
      });
    }
    if (vokuActive) {
      impacts.push({
        title: 'voku / phpstan-rules Pack',
        desc: 'Adds opinionated checks for suspicious conditions, comparisons, and assignments inside conditional logic.',
        type: 'info'
      });
    }
    if (sidzActive) {
      impacts.push({
        title: 'sidz / phpstan-rules Pack',
        desc: 'Detects and flags unexplained magic numbers to enforce domain clarity and constant representation.',
        type: 'info'
      });
    }

    return impacts;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(neonCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleCopyComposer = async () => {
    try {
      await navigator.clipboard.writeText(getComposerCommand());
      setCopiedComposer(true);
      setTimeout(() => setCopiedComposer(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([neonCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'phpstan.neon.dist';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const impacts = getExtensionImpacts();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-default overflow-y-auto"
            id="export-modal-overlay"
          >
            {/* Modal Dialog Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.35 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative"
              id="export-modal-panel"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4.5 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg">
                    <FileCode className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 tracking-tight">
                      Ready to Export Configuration
                    </h3>
                    <p className="text-[11px] text-slate-500 font-semibold font-sans">
                      Your finalized phpstan.neon.dist static analysis schema to align strict standards
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  id="close-export-modal-btn"
                  title="Close Export Modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Informative Banner */}
              <div className="bg-indigo-50/40 border-b border-indigo-100/55 p-4 flex gap-3 items-start select-none">
                <ShieldCheck className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-indigo-950 font-normal leading-normal">
                  <strong>Safe & Reproducible Configuration:</strong> Save this file as <code className="bg-white px-1.5 font-bold font-mono rounded border border-indigo-100/70">phpstan.neon.dist</code> in your repository&apos;s root directory to invoke verified developer compliance during build pipelines. Standard practice keeps local overrides inside <code className="bg-white px-1 font-mono text-[10px]">phpstan.neon</code>.
                </div>
              </div>

              {/* Modal Core Content Scroll Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/10 max-h-[55vh]">
                
                {/* 1. composer command generated */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-slate-800" />
                    <span className="text-[11px] font-mono uppercase tracking-wider text-slate-700 font-bold">
                      1. Composer Command Setup
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-900 text-slate-100 p-3 rounded-xl border border-slate-800 max-w-full font-mono text-xs shadow-inner overflow-x-auto justify-between group">
                    <span className="select-all block truncate mr-2 pr-2">
                      {getComposerCommand()}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyComposer}
                      className="px-2.5 py-1 text-[10px] uppercase font-bold bg-slate-800 hover:bg-slate-700 text-white rounded border border-slate-700 cursor-pointer flex items-center gap-1 shrink-0 active:scale-95 duration-100"
                    >
                      {copiedComposer ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans">
                    Runs on your local shell terminal or CI server to install matching composer dependencies securely.
                  </p>
                </div>

                {/* 2. File outputs */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-slate-700 font-bold">
                      2. Generated phpstan.neon.dist Content
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100/65 rounded-full font-bold">
                      Format-verified (voku)
                    </span>
                  </div>
                  <div className="border border-slate-200 rounded-xl bg-slate-50 shadow-inner p-4 max-h-[220px] overflow-y-auto">
                    <pre className="text-slate-900 font-mono text-xs leading-relaxed select-all [tab-size:4]">
                      <code>{neonCode}</code>
                    </pre>
                  </div>
                </div>

                {/* 3. Risk Summary & impacts */}
                {impacts.length > 0 && (
                  <div className="space-y-2 pt-1 border-t border-slate-200">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-slate-700 font-bold block">
                      3. Custom Extension Risk & Impact Analysis
                    </span>
                    <div className="grid grid-cols-1 gap-2.5">
                      {impacts.map((imp, idx) => (
                        <div 
                          key={idx} 
                          className={`p-3 rounded-lg border text-xs flex gap-2.5 items-start ${
                            imp.type === 'warning' 
                              ? 'bg-amber-50/70 border-amber-200 text-amber-900' 
                              : 'bg-indigo-50/30 border-indigo-200 text-indigo-950'
                          }`}
                        >
                          {imp.type === 'warning' ? (
                            <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                          ) : (
                            <Info className="w-4 h-4 text-indigo-550 mt-0.5 shrink-0" />
                          )}
                          <div>
                            <p className="font-bold text-slate-900">{imp.title}</p>
                            <p className="text-[10px] text-slate-600 mt-0.5 leading-relaxed font-sans">{imp.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Action Buttons Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-[11px] text-slate-500 font-bold font-mono">
                  Lars Moelleken (voku) Configurator
                </p>

                <div className="flex w-full sm:w-auto items-center justify-end gap-3.5">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl shadow-sm transition-all cursor-pointer active:scale-95 duration-100"
                    id="modal-copy-btn"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600 animate-bounce" />
                        <span className="text-emerald-700">Copied NEON Spec!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-500" />
                        <span>Copy NEON Spec</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownload}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded-xl shadow-sm transition-all hover:shadow cursor-pointer active:scale-95 duration-100"
                    id="modal-download-btn"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download phpstan.neon.dist</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
