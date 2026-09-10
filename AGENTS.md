# AGENTS.md — PHPStan Configurator Development & Reference Guide

This document contains persistent project rules, architecture patterns, and authoritative reference links for coding agents and contributors working on the **PHPStan Configurator**.

---

## 1. Project Overview & Identity

- **Project**: PHPStan Configurator (`phpstan-configurator`)
- **Author**: Lars Moelleken ([github.com/voku](https://github.com/voku))
- **Live URL**: [https://voku.github.io/PHPStanConfigurator/](https://voku.github.io/PHPStanConfigurator/)
- **Repository**: [https://github.com/voku/PHPStanConfigurator](https://github.com/voku/PHPStanConfigurator)
- **Tech Stack**: React 19, TypeScript 5.8, Vite 6, Tailwind CSS 4, Express 4

---

## 2. Authoritative Reference Links

Always consult and cross-reference these official resources when modifying rules, default parameters, or extension options:

| Resource | URL | Description |
|---|---|---|
| **PHPStan Official Website** | [https://phpstan.org](https://phpstan.org) | Home and primary documentation portal |
| **PHPStan Config Reference** | [https://phpstan.org/config-reference](https://phpstan.org/config-reference) | Full parameter catalog (parameters, paths, excludes, stubFiles, etc.) |
| **PHPStan Rule Levels (0–10)** | [https://phpstan.org/user-guide/rule-levels](https://phpstan.org/user-guide/rule-levels) | Specification of each analysis tier from Level 0 to Level 10 and `max` |
| **PHPStan Extension Library** | [https://phpstan.org/user-guide/extension-library](https://phpstan.org/user-guide/extension-library) | Curated official and community extension packages |
| **PHPStan Baseline Guide** | [https://phpstan.org/user-guide/baseline](https://phpstan.org/user-guide/baseline) | Baseline generation (`--generate-baseline`) and stale error management |
| **Bleeding Edge in PHPStan** | [https://phpstan.org/blog/what-is-bleeding-edge](https://phpstan.org/blog/what-is-bleeding-edge) | How bleedingEdge.neon works and upgrade stability expectations |
| **Developing Extensions** | [https://phpstan.org/developing-extensions/core-concepts](https://phpstan.org/developing-extensions/core-concepts) | Dynamic return types, type-specifying extensions, and custom rules |
| **PHPStan Online Playground** | [https://phpstan.org/try](https://phpstan.org/try) | Interactive web-based code reproduction and testing tool |
| **PHPStan Upstream Repository** | [https://github.com/phpstan/phpstan](https://github.com/phpstan/phpstan) | Upstream core analyzer source code and issue tracker |
| **Config Reference Source** | [https://raw.githubusercontent.com/phpstan/phpstan/2.2.x/website/src/config-reference.md](https://raw.githubusercontent.com/phpstan/phpstan/2.2.x/website/src/config-reference.md) | Upstream markdown file synced by `scripts/sync-phpstan-config-reference.mjs` |
| **Extension Installer** | [https://github.com/phpstan/extension-installer](https://github.com/phpstan/extension-installer) | Composer plugin to automatically discover and register PHPStan extensions |
| **voku/phpstan-rules** | [https://github.com/voku/phpstan-rules](https://github.com/voku/phpstan-rules) | Opinionated checks for condition assignments, comparisons, and Yoda style |
| **sidz/phpstan-rules** | [https://github.com/sidz/phpstan-rules](https://github.com/sidz/phpstan-rules) | Detection of magic numbers and unvouched raw strings |

---

## 3. Key Architecture & File Structure

```
├── AGENTS.md                                   # This agent instructions & reference catalog
├── README.md                                   # Repository documentation and GitHub Pages guides
├── package.json                                # Scripts, dependencies, and build config
├── server.ts                                   # Local Express development/preview server
├── index.html                                  # Single-page app HTML entry point
├── scripts/
│   └── sync-phpstan-config-reference.mjs       # Upstream config-reference.md syncer
├── tests/
│   ├── app.test.ts                             # SSR and initial render invariants
│   ├── communityRuleAdvisor.test.ts            # Composer dependency scan & recommendation tests
│   └── neon.test.ts                            # NEON parser/renderer round-trip tests
└── src/
    ├── App.tsx                                 # Primary layout, preset cards, interactive form wizard
    ├── types.ts                                # Core TypeScript types for config, presets, extensions
    ├── data/
    │   ├── rules.ts                            # Levels, versions (8.5), presets, and rule explanations
    │   ├── phpstanReference.generated.ts       # Auto-generated upstream config reference snapshot
    │   ├── phpstanExtensionsLibrary.ts         # Extension library catalog & categories
    │   └── communityRulePackages.ts            # Community rule packs and installation mappings
    ├── lib/
    │   ├── neon.ts                             # Deterministic NEON renderer and importer
    │   ├── communityRuleAdvisor.ts             # composer.json analyzer and rule advisor
    │   ├── export.ts                           # Composer command generator & guidance blocks
    │   ├── phpstanSelections.ts                # Selection state resolution
    │   └── phpstanExtensions.ts                # Package and include path helpers
    └── components/
        ├── NeonEditor.tsx                      # Syntax-highlighted NEON preview codesheet
        ├── ExportModal.tsx                     # Export modal with copy, download, and impact alerts
        ├── PhpStanExtensionLibrary.tsx         # Extension library catalog & capability hub
        └── CiPipelines.tsx                     # CI scripts (GitHub Actions, GitLab CI, Bitbucket)
```

---

## 4. Development & Build Commands

Always run and verify these commands when developing:

```bash
# 1. Run local dev server (port 3000)
npm run dev

# 2. Run unit tests
npm test

# 3. Type check / lint
npm run lint

# 4. Production build (Vite + bundled Express server)
npm run build

# 5. GitHub Pages static build
npm run build:pages

# 6. Sync PHPStan config reference snapshot
npm run sync:phpstan-config-reference
```

---

## 5. Coding & Behavioral Invariants

1. **NEON Round-Trip Fidelity**: Any change to `src/lib/neon.ts` MUST maintain round-trip compatibility between `renderNeon` and `parseNeon`. Verify with `npm test`.
2. **Upstream Config Reference**: `src/data/phpstanReference.generated.ts` is generated by `scripts/sync-phpstan-config-reference.mjs`. Do not hand-edit generated keys. When adding custom rationale or documentation, enrich `src/data/rules.ts`.
3. **Reference Links in UI**: Whenever presenting a rule, parameter, or extension, provide the direct official reference link (to `phpstan.org` or upstream documentation) with `target="_blank" rel="noreferrer"`.
4. **Button & Control Sizing**:
   - Primary action buttons: `h-9 px-4 text-xs font-semibold rounded-lg`
   - Secondary / compact buttons: `h-8 px-3 text-xs font-medium rounded-lg`
   - Micro action buttons: `h-7 px-2.5 text-xs font-semibold rounded-lg`
   - Avoid truncated labels and inconsistent heights.
5. **No Visual Regressions**:
   - Ensure the footer stays cleanly at the bottom using `min-h-screen` and `mt-auto`.
   - Ensure modals (`ExportModal`) have proper backdrop blur, z-index (`z-50`), and keyboard accessibility (`Escape` to close, `⌘E`/`Ctrl+E` to open).
   - Ensure mobile responsiveness (`sm:`, `md:`, `lg:`) for all cards and code editors.
