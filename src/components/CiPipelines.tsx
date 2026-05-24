/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Copy, Check, Terminal, FileCode, Server } from 'lucide-react';

interface CiPipelinesProps {
  level: string;
  paths: string[];
}

export function CiPipelines({ level, paths }: CiPipelinesProps) {
  const [activeTab, setActiveTab] = useState<'github' | 'gitlab' | 'bitbucket'>('github');
  const [copied, setCopied] = useState(false);

  const pathsString = paths.join(' ');

  const githubYml = `# .github/workflows/phpstan.yml
name: PHPStan Static Analysis

on:
  push:
    branches: [ "main", "develop" ]
  pull_request:
    branches: [ "main" ]

jobs:
  phpstan:
    name: PHPStan Analysis
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup PHP Environment
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.3'
          coverage: none

      - name: Install Dependencies
        run: composer install --prefer-dist --no-progress --no-interaction

      - name: Execute PHPStan Analyzer
        run: vendor/bin/phpstan analyse --error-format=github --level=${level} ${pathsString}`;

  const gitlabYml = `# .gitlab-ci.yml
stages:
  - test

phpstan_static_analysis:
  stage: test
  image: php:8.3-cli
  before_script:
    - apt-get update && apt-get install -y git unzip
    - curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
    - composer install --prefer-dist --no-progress --no-interaction
  script:
    - vendor/bin/phpstan analyse --level=${level} ${pathsString}
  only:
    - merge_requests
    - main`;

  const bitbucketYml = `# bitbucket-pipelines.yml
pipelines:
  default:
    - step:
        name: PHPStan Analysis
        image: php:8.3-cli
        caches:
          - composer
        script:
          - apt-get update && apt-get install -y git unzip
          - curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
          - composer install --prefer-dist --no-progress
          - vendor/bin/phpstan generate
          - vendor/bin/phpstan analyse --level=${level} ${pathsString}`;

  const getActiveCode = () => {
    switch (activeTab) {
      case 'github': return githubYml;
      case 'gitlab': return gitlabYml;
      case 'bitbucket': return bitbucketYml;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="ci-generation-panel" className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-slate-800 font-mono flex items-center gap-2 uppercase tracking-wider">
          <Server className="w-4 h-4 text-indigo-600" />
          CI Pipeline Generator
        </h4>
        <span className="text-[10px] bg-slate-50 border border-slate-200 text-slate-600 font-semibold px-2 py-0.5 rounded font-mono">
          Level {level} synced
        </span>
      </div>

      <p className="text-[11px] text-slate-600 leading-normal">
        Static analysis is best run on every push. Select your CI framework to grab a preset build script using level <strong className="text-slate-800 font-mono font-semibold">{level}</strong> and targets: <strong className="text-slate-805 font-mono">[{pathsString}]</strong>.
      </p>

      {/* Tabs */}
      <div className="flex bg-slate-50 border border-slate-200 p-1 rounded-lg text-xs font-mono">
        <button
          onClick={() => setActiveTab('github')}
          className={`flex-1 py-1 px-3 rounded-md transition-all font-medium text-center cursor-pointer ${
            activeTab === 'github' ? 'bg-indigo-50 border border-indigo-200 text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          GitHub Actions
        </button>
        <button
          onClick={() => setActiveTab('gitlab')}
          className={`flex-1 py-1 px-3 rounded-md transition-all font-medium text-center cursor-pointer ${
            activeTab === 'gitlab' ? 'bg-indigo-50 border border-indigo-200 text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          GitLab CI
        </button>
        <button
          onClick={() => setActiveTab('bitbucket')}
          className={`flex-1 py-1 px-3 rounded-md transition-all font-medium text-center cursor-pointer ${
            activeTab === 'bitbucket' ? 'bg-indigo-50 border border-indigo-200 text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          BitBucket
        </button>
      </div>

      {/* Code Area */}
      <div className="relative">
        <pre className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-[11px] font-mono text-slate-800 leading-relaxed overflow-x-auto max-h-[160px]">
          <code>{getActiveCode()}</code>
        </pre>
        <button
          onClick={handleCopy}
          className="absolute right-3 top-3 p-1.5 bg-white hover:bg-slate-50 border border-slate-200 hover:text-slate-800 rounded text-slate-500 transition-colors cursor-pointer shadow-sm animate-fadeIn"
          title="Copy snippet"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
