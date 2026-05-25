/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const OFFICIAL_DOC_EXTENSION_PACKAGES = [
  'phpstan/phpstan-strict-rules',
  'phpstan/phpstan-deprecation-rules',
  'phpstan/phpstan-doctrine',
  'phpstan/phpstan-phpunit',
  'phpstan/phpstan-symfony',
  'phpstan/phpstan-beberlei-assert',
  'phpstan/phpstan-webmozart-assert',
  'phpstan/phpstan-mockery',
  'php-standard-library/phpstan-extension',
  'phpstan/phpstan-nette',
  'phpstan/phpstan-dibi'
] as const;

const EXTENSION_COMPOSER_PACKAGE_BY_ID: Record<string, string> = {
  doctrine: 'phpstan/phpstan-doctrine',
  symfony: 'phpstan/phpstan-symfony',
  larastan: 'larastan/larastan',
  phpunit: 'phpstan/phpstan-phpunit',
  'strict-rules': 'phpstan/phpstan-strict-rules',
  'deprecation-rules': 'phpstan/phpstan-deprecation-rules',
  'voku-rules': 'voku/phpstan-rules',
  'sidz-rules': 'sidz/phpstan-rules',
  'beberlei-assert': 'phpstan/phpstan-beberlei-assert',
  'webmozart-assert': 'phpstan/phpstan-webmozart-assert',
  mockery: 'phpstan/phpstan-mockery',
  psl: 'php-standard-library/phpstan-extension',
  nette: 'phpstan/phpstan-nette',
  dibi: 'phpstan/phpstan-dibi'
};

export function getExtensionComposerPackage(extensionId: string): string {
  return EXTENSION_COMPOSER_PACKAGE_BY_ID[extensionId] ?? `phpstan/phpstan-${extensionId}`;
}

export function getExtensionIncludeBasePath(extensionId: string): string {
  return `vendor/${getExtensionComposerPackage(extensionId)}`;
}
