/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Extensions, SelectedCommunityRulePackage, SelectedExtension } from '../types';

export const DEFAULT_SELECTED_EXTENSIONS: SelectedExtension[] = [
  { id: 'sidz-rules', enabled: false, selectedIncludes: ['rules.neon'] },
  { id: 'voku-rules', enabled: false, selectedIncludes: ['rules.neon'] },
  { id: 'strict-rules', enabled: false, selectedIncludes: ['rules.neon'] },
  { id: 'deprecation-rules', enabled: false, selectedIncludes: ['rules.neon'] },
  { id: 'doctrine', enabled: false, selectedIncludes: ['extension.neon', 'rules.neon'] },
  { id: 'symfony', enabled: false, selectedIncludes: ['extension.neon', 'rules.neon'] },
  { id: 'larastan', enabled: false, selectedIncludes: ['extension.neon'] },
  { id: 'phpunit', enabled: false, selectedIncludes: ['extension.neon', 'rules.neon'] },
  { id: 'beberlei-assert', enabled: false, selectedIncludes: ['extension.neon'] },
  { id: 'webmozart-assert', enabled: false, selectedIncludes: ['extension.neon'] },
  { id: 'mockery', enabled: false, selectedIncludes: ['extension.neon'] },
  { id: 'psl', enabled: false, selectedIncludes: ['extension.neon'] },
  { id: 'nette', enabled: false, selectedIncludes: ['extension.neon'] },
  { id: 'dibi', enabled: false, selectedIncludes: ['extension.neon'] }
];

export function resolveSelectedExtensions(extensions: Extensions): SelectedExtension[] {
  return DEFAULT_SELECTED_EXTENSIONS.map((defaultExtension) => {
    const existing = extensions.selectedExtensions?.find((extension) => extension.id === defaultExtension.id);
    const legacyEnabled = (
      (defaultExtension.id === 'doctrine' && extensions.doctrine) ||
      (defaultExtension.id === 'symfony' && extensions.symfony) ||
      (defaultExtension.id === 'larastan' && extensions.larastan)
    );

    if (existing) {
      return {
        ...defaultExtension,
        ...existing,
        enabled: existing.enabled || legacyEnabled,
      };
    }

    if (defaultExtension.id === 'doctrine' && extensions.doctrine) {
      return { ...defaultExtension, enabled: true };
    }

    if (defaultExtension.id === 'symfony' && extensions.symfony) {
      return { ...defaultExtension, enabled: true };
    }

    if (defaultExtension.id === 'larastan' && extensions.larastan) {
      return { ...defaultExtension, enabled: true };
    }

    return defaultExtension;
  });
}

export function resolveSelectedCommunityPackages(extensions: Extensions): SelectedCommunityRulePackage[] {
  return extensions.communityPackages ?? [];
}
