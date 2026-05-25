/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Copy, Download, Upload, Check, AlertTriangle, Eye, Compass, RefreshCw, Sparkles } from 'lucide-react';
import { PhpStanConfig, Preset } from '../types';

interface NeonEditorProps {
  neonCode: string;
  config: PhpStanConfig;
  activePreset: Preset | null;
  onImportNeon: (neonString: string) => void;
  onResetToPreset: () => void;
}

export function NeonEditor({
  neonCode,
  config,
  activePreset,
  onImportNeon,
  onResetToPreset,
}: NeonEditorProps) {
  const [copied, setCopied] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  
  // Highlight state triggered on configuration adjustments and neon regeneration
  const [highlight, setHighlight] = useState(false);

  useEffect(() => {
    setHighlight(true);
    const timer = setTimeout(() => {
      setHighlight(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [neonCode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(neonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([neonCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'phpstan.neon.dist';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = () => {
    if (!importText.trim()) {
      setImportError('Please paste some valid NEON text first.');
      return;
    }
    
    try {
      onImportNeon(importText);
      setImportOpen(false);
      setImportText('');
      setImportError(null);
    } catch (err: any) {
      setImportError(err.message || 'Parsing failure. Ensure NEON is structured.');
    }
  };

  // Compare properties to active preset to see if mutated
  const getDiffsToPreset = () => {
    if (!activePreset) return [];
    const diffs: string[] = [];
    
    if (config.level !== activePreset.config.level) {
      diffs.push(`Level: changed from ${activePreset.config.level} to ${config.level}`);
    }
    if (config.strictRules.bleedingEdge !== activePreset.config.strictRules.bleedingEdge) {
      diffs.push(`bleedingEdge: changed to ${config.strictRules.bleedingEdge ? 'ON' : 'OFF'}`);
    }
    if (config.extensions.symfony !== activePreset.config.extensions.symfony) {
      diffs.push(`Symfony helper: changed to ${config.extensions.symfony ? 'Active' : 'Inactive'}`);
    }
    if (config.extensions.doctrine !== activePreset.config.extensions.doctrine) {
      diffs.push(`Doctrine helper: changed to ${config.extensions.doctrine ? 'Active' : 'Inactive'}`);
    }
    if (config.extensions.larastan !== activePreset.config.extensions.larastan) {
      diffs.push(`Larastan helper: changed to ${config.extensions.larastan ? 'Active' : 'Inactive'}`);
    }

    return diffs;
  };

  const customDiffs = getDiffsToPreset();

  return (
    <div id="neon-editor-container" className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[500px]">
      
      {/* Container Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0" />
          <span className="font-semibold text-sm text-slate-800 font-mono whitespace-nowrap">phpstan.neon.dist</span>
          {activePreset && (
            <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-semibold truncate max-w-[140px]" title={`Preset: ${activePreset.name}`}>
              Preset: {activePreset.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setImportOpen(!importOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 rounded-lg transition-colors cursor-pointer shadow-sm"
            id="import-neon-btn"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="whitespace-nowrap">Import</span>
          </button>
          
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 rounded-lg transition-colors cursor-pointer shadow-sm"
            id="copy-neon-btn"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <Copy className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
            <span className="whitespace-nowrap">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white shadow-sm shadow-indigo-200 rounded-lg transition-colors cursor-pointer"
            id="download-neon-btn"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">Download</span>
          </button>
        </div>
      </div>

      {/* Editor Main Section */}
      <div className="flex-1 relative min-h-[300px]">
        {importOpen ? (
          <div className="absolute inset-0 z-10 bg-white p-6 flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 font-mono flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-600" /> IMPORT EXISTING PHPSTAN.NEON.DIST
              </h4>
              <button 
                onClick={() => { setImportOpen(false); setImportError(null); }}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium"
              >
                Cancel
              </button>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Paste your standard `phpstan.neon.dist` text config. The engine will heuristically parse levels, exclusions, parameters, and prior rules.
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={`includes:\n    - vendor/phpstan/phpstan-doctrine/extension.neon\n\nparameters:\n    level: 8\n    paths:\n        - src`}
              rows={10}
              id="neon-import-textarea"
              className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none shadow-inner"
            />
            {importError && (
              <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-100 px-3 py-2 rounded-lg">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                <span>{importError}</span>
              </div>
            )}
            <button
              onClick={handleImportSubmit}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 font-medium text-xs text-white rounded-xl transition-all cursor-pointer shadow"
            >
              Parse and Apply Configuration
            </button>
          </div>
        ) : null}

        {/* Real-time Code Visual Highlight Panel */}
        {highlight && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 bg-indigo-600 border border-indigo-400/30 text-white rounded-full shadow-xl text-[10px] font-extrabold tracking-wider font-mono uppercase z-20 pointer-events-none animate-bounce duration-300">
            <Sparkles className="w-3 h-3 text-indigo-200 animate-spin whitespace-nowrap shrink-0" />
            <span>Updated Live</span>
          </div>
        )}

        <pre className={`p-6 h-full overflow-auto text-slate-900 font-mono text-xs leading-relaxed select-all transition-all duration-300 ${
          highlight 
            ? 'bg-indigo-50/70 border-indigo-200 shadow-inner' 
            : 'bg-[#fafaf9]'
        }`}>
          <code>
            {neonCode.split('\n').map((line, idx) => {
              // Very simple and beautiful mock highlighters
              let coloredLine: React.ReactNode = line;
              if (line.trim().startsWith('#')) {
                coloredLine = <span className="text-slate-400 italic">{line}</span>;
              } else if (line.includes(':')) {
                const parts = line.split(':');
                const key = parts[0];
                const restVal = parts.slice(1).join(':');
                
                // Color key vs value
                coloredLine = (
                  <>
                    <span className="text-indigo-700 font-semibold">{key}:</span>
                    {restVal.includes('true') ? (
                      <span className="text-emerald-700 font-semibold">{restVal}</span>
                    ) : restVal.includes('false') ? (
                      <span className="text-rose-700 font-semibold">{restVal}</span>
                    ) : /^\s*-?\s*\d+/.test(restVal) ? (
                      <span className="text-amber-700 font-semibold">{restVal}</span>
                    ) : (
                      <span className="text-slate-800">{restVal}</span>
                    )}
                  </>
                );
              }
              return (
                <div key={idx} className="flex gap-4 hover:bg-slate-200/50 px-2 rounded -mx-2">
                  <span className="text-[10px] text-slate-400 select-none w-5 text-right font-sans font-normal">{idx + 1}</span>
                  <span>{coloredLine}</span>
                </div>
              );
            })}
          </code>
        </pre>
      </div>

      {/* Preset Custom Variance Diff Panel */}
      {activePreset && (
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Compass className="w-3.5 h-3.5 text-indigo-600" />
              <span>Live Mutation Compass</span>
            </div>
            {customDiffs.length > 0 && (
              <button
                onClick={onResetToPreset}
                className="text-[10px] font-mono text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                Restore preset defaults
              </button>
            )}
          </div>
          
          {customDiffs.length === 0 ? (
            <p className="text-[11px] text-slate-500 font-normal">
              Your config is an exact match for the <strong className="text-slate-700 font-medium">{activePreset.name}</strong> preset. Standard, clean, and pre-negotiated.
            </p>
          ) : (
            <div className="space-y-1">
              <p className="text-[11px] text-slate-500 mb-1">
                You have tailored this configuration. Differences from the default <strong className="text-slate-700">{activePreset.name}</strong> rules:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {customDiffs.map((diff, index) => (
                  <span key={index} className="text-[10px] px-2 py-0.5 bg-amber-50 border border-amber-200 rounded text-amber-800 font-medium">
                    {diff}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
