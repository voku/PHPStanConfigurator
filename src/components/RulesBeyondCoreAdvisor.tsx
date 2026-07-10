/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertTriangle, CheckCircle2, Layers, Link2, PackageCheck, ShieldAlert, Sparkles } from 'lucide-react';
import { PhpStanConfig, DependencyScanResult } from '../types';
import { groupCommunityRulePackages, setCommunityRulePackageEnabled } from '../lib/communityRuleAdvisor';
import { EXTENSIONS_LIBRARY_BY_ID } from '../data/phpstanExtensionsLibrary';

interface RulesBeyondCoreAdvisorProps {
  config: PhpStanConfig;
  activePresetId: string;
  dependencyScan: DependencyScanResult | null;
  onChangeConfig: (newConfig: PhpStanConfig | ((prev: PhpStanConfig) => PhpStanConfig)) => void;
  onAddToast: (msg: string, type: 'success' | 'info') => void;
}

const CATEGORY_LABELS = {
  'architecture': 'Architecture',
  'complexity': 'Complexity',
  'database': 'Database',
  'framework': 'Framework',
  'migration': 'Migration',
  'security': 'Security',
  'strictness': 'Strictness',
  'testing': 'Testing',
  'type-safety': 'Type Safety',
} as const;

const RECOMMENDATION_STYLES = {
  off: 'bg-slate-100 text-slate-600 border-slate-200',
  advanced: 'bg-amber-50 text-amber-700 border-amber-200',
  suggested: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  recommended: 'bg-emerald-50 text-emerald-700 border-emerald-200',
} as const;

export function RulesBeyondCoreAdvisor({
  config,
  activePresetId,
  dependencyScan,
  onChangeConfig,
  onAddToast,
}: RulesBeyondCoreAdvisorProps) {
  const groupedPackages = groupCommunityRulePackages(config, {
    activePresetId,
    dependencyScan,
  });

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h3 className="font-semibold text-xs font-mono uppercase tracking-wider text-slate-800">
              Rules Beyond Core
            </h3>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Curated community rule-package advisor. Recommended packages stay first, warnings stay visible, and unverified include paths stay out of your exported config.
          </p>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-indigo-100 bg-indigo-50 text-indigo-700 font-mono font-bold">
          11 curated packages
        </span>
      </div>

      {dependencyScan?.notes && dependencyScan.notes.length > 0 && (
        <div className="p-3 rounded-xl border border-indigo-100 bg-indigo-50/60 space-y-2">
          <div className="flex items-center gap-1.5 text-indigo-900 text-[11px] font-bold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Dependency scan hints</span>
          </div>
          <ul className="space-y-1 text-[10px] text-slate-700 leading-relaxed pl-4 list-disc">
            {dependencyScan.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-5">
        {groupedPackages.map(({ category, entries }) => (
          <div key={category} className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-[11px] font-mono uppercase tracking-wider font-bold text-slate-700">
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
                  className={`rounded-xl border p-4 space-y-3 shadow-sm ${
                    enabled ? 'border-indigo-300 bg-indigo-50/30' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h5 className="text-sm font-bold text-slate-900">{rulePackage.displayName}</h5>
                        <span className={`text-[9px] font-mono uppercase tracking-wider border px-1.5 py-0.5 rounded ${RECOMMENDATION_STYLES[recommendation.recommendation]}`}>
                          {recommendation.recommendation}
                        </span>
                        {recommendation.alreadyInstalled && (
                          <span className="text-[9px] font-mono uppercase tracking-wider border px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border-emerald-200">
                            installed
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono">{rulePackage.packageName} · {rulePackage.ruleCount} rules</p>
                      {rulePackage.linkedExtensionId && EXTENSIONS_LIBRARY_BY_ID[rulePackage.linkedExtensionId] && (
                        <p className="text-[9px] text-indigo-600 flex items-center gap-1">
                          <Link2 className="w-3 h-3" />
                          Same toggle as &quot;{EXTENSIONS_LIBRARY_BY_ID[rulePackage.linkedExtensionId].name}&quot; in the Extension Library above — enabling either one enables both.
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onChangeConfig((prev) => setCommunityRulePackageEnabled(prev, rulePackage.id, !enabled));
                        onAddToast(`${enabled ? 'Disabled' : 'Enabled'} ${rulePackage.packageName}`, enabled ? 'info' : 'success');
                      }}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        enabled ? 'bg-indigo-600' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition ${
                          enabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-[10px]">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                      <p className="font-semibold text-slate-700">Why it helps</p>
                      <p className="text-slate-600 mt-1">{rulePackage.recommendedFor.join(', ')}</p>
                    </div>

                    <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-2.5">
                      <div className="flex items-center gap-1 text-amber-800 font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>When not to use it</span>
                      </div>
                      <p className="text-amber-900/80 mt-1">{rulePackage.avoidWhen.join(', ')}</p>
                    </div>
                  </div>

                  {recommendation.reasons.length > 0 && (
                    <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-2.5">
                      <div className="flex items-center gap-1 text-indigo-800 font-semibold text-[10px]">
                        <PackageCheck className="w-3.5 h-3.5" />
                        <span>Why this package is showing up</span>
                      </div>
                      <ul className="mt-1 space-y-1 text-[10px] text-slate-700 pl-4 list-disc">
                        {recommendation.reasons.map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-slate-700">Highlighted rules</p>
                    <div className="space-y-2">
                      {rulePackage.highlightedRules.slice(0, 3).map((rule) => (
                        <div key={rule.ruleClass} className="rounded-lg border border-slate-200 p-2.5 bg-white">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <p className="text-[10px] font-semibold text-slate-800">{rule.title}</p>
                          </div>
                          <p className="text-[10px] text-slate-600 mt-1">{rule.problem}</p>
                          <p className="text-[10px] text-slate-700 mt-1"><strong>Value:</strong> {rule.value}</p>
                          <p className="text-[10px] text-amber-700 mt-1"><strong>Risk:</strong> {rule.risk}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-slate-700">Install command</p>
                    <code className="block rounded-lg bg-slate-900 text-slate-100 p-2.5 text-[10px] font-mono overflow-x-auto">
                      {rulePackage.composerRequireDev}
                    </code>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-700">
                      <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
                      <span>Include & config hints</span>
                    </div>
                    <ul className="space-y-1 text-[10px] text-slate-600 pl-4 list-disc">
                      {rulePackage.includes.length > 0 ? (
                        rulePackage.includes.map((includePath) => (
                          <li key={includePath}>Verified include: <code className="font-mono text-[9px]">{includePath}</code></li>
                        ))
                      ) : (
                        <li>No include path is generated automatically unless the path is verified.</li>
                      )}
                      {rulePackage.configurationHints.map((hint) => (
                        <li key={hint}>{hint}</li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
