/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PhpStanConfig, DependencyScanResult } from '../types';
import { PhpStanExtensionLibrary } from './PhpStanExtensionLibrary';

export interface RulesBeyondCoreAdvisorProps {
  config: PhpStanConfig;
  activePresetId: string;
  dependencyScan: DependencyScanResult | null;
  onChangeConfig: (newConfig: PhpStanConfig | ((prev: PhpStanConfig) => PhpStanConfig)) => void;
  onAddToast: (msg: string, type: 'success' | 'info') => void;
}

/**
 * Merged into PhpStanExtensionLibrary.
 * Kept for backwards compatibility.
 */
export function RulesBeyondCoreAdvisor(props: RulesBeyondCoreAdvisorProps) {
  return (
    <PhpStanExtensionLibrary
      config={props.config}
      activePresetId={props.activePresetId}
      dependencyScan={props.dependencyScan}
      onChangeConfig={props.onChangeConfig}
      onAddToast={props.onAddToast}
    />
  );
}
