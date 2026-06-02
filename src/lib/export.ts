/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PhpStanConfig } from '../types';
import { getEnabledCommunityRulePackages } from './communityRuleAdvisor';
import { getExtensionComposerPackage } from './phpstanExtensions';
import { resolveSelectedExtensions } from './phpstanSelections';

export interface ExportGuidanceBlock {
  packageName: string;
  lines: string[];
}

export function getComposerPackages(config?: PhpStanConfig): string[] {
  if (!config) {
    return ['phpstan/extension-installer'];
  }

  const packages = new Set<string>();
  const strategy = config.extensions.installationStrategy || 'hybrid';
  const selectedExtensions = resolveSelectedExtensions(config.extensions);
  const enabledExtensions = selectedExtensions.filter((extension) => extension.enabled);

  if (strategy === 'auto_installer' || strategy === 'hybrid') {
    packages.add('phpstan/extension-installer');
  }

  for (const extension of enabledExtensions) {
    packages.add(getExtensionComposerPackage(extension.id));
  }

  for (const rulePackage of getEnabledCommunityRulePackages(config)) {
    packages.add(rulePackage.packageName);
  }

  return Array.from(packages);
}

export function getComposerCommand(config?: PhpStanConfig): string {
  const packages = getComposerPackages(config);

  if (packages.length === 0) {
    return 'composer require --dev phpstan/phpstan';
  }

  return `composer require --dev ${packages.join(' ')}`;
}

export function getExportGuidanceBlocks(config?: PhpStanConfig): ExportGuidanceBlock[] {
  if (!config) {
    return [];
  }

  return getEnabledCommunityRulePackages(config)
    .filter((rulePackage) => rulePackage.configurationHints.length > 0)
    .map((rulePackage) => {
      const lines: string[] = [];

      if (rulePackage.includes.length === 0) {
        lines.push('Include path intentionally not generated because no verified include path is stored for this package.');
      }

      for (const hint of rulePackage.configurationHints) {
        lines.push(hint);
      }

      return {
        packageName: rulePackage.packageName,
        lines,
      };
    });
}

export function getExportGuidanceCommentLines(config?: PhpStanConfig): string[] {
  const blocks = getExportGuidanceBlocks(config);

  if (blocks.length === 0) {
    return [];
  }

  const commentLines = ['# Rules Beyond Core advisor notes:'];

  for (const block of blocks) {
    commentLines.push(`# - ${block.packageName}`);
    for (const line of block.lines) {
      commentLines.push(`#   ${line}`);
    }
  }

  return commentLines;
}
