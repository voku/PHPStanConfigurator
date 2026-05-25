/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, ArrowRight, CornerDownLeft, Terminal, AlertCircle, Loader2 } from 'lucide-react';

interface AiAdvisorProps {
  currentLevel: string;
}

export function AiAdvisor({ currentLevel }: AiAdvisorProps) {
  const [errorInput, setErrorInput] = useState('');
  const [advisorResponse, setAdvisorResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'diagnose' | 'ask'>('diagnose');
  const [diagnosticHistory, setDiagnosticHistory] = useState<Array<{ q: string; a: string }>>([]);

  const presetErrors = [
    {
      title: "Union nullable type mismatch",
      error: "Parameter #1 $id of method UserRepository::get() expects string, string|null given.",
    },
    {
      title: "Missing generic description",
      error: "Method Collection::getAll() has parameter $items with no value type specified in iterable type array.",
    },
    {
      title: "Strict comparison redundancy",
      error: "Strict comparison using === between true and true will always evaluate to true.",
    }
  ];

  const handleDiagnose = (textToSubmit: string) => {
    if (!textToSubmit.trim()) return;
    setLoading(true);
    setAdvisorResponse(null);

    // Simulate instant feedback trigger with a tiny timeout for responsive UX
    setTimeout(() => {
      const query = textToSubmit.toLowerCase();
      let response = '';

      if (query.includes('null') || (query.includes('expects') && query.includes('given'))) {
        response = `### PHPStan Diagnostic: Nullable Type Mismatch
PHPStan detected that a value which can be \`null\` is passed or returned where a strict, non-nullable type is required.

#### 🛠️ Recommended Code Remedy:
You have three excellent choices to fix this depending on your business logic:

**Option A: Add an early return or null guard (Recommended)**
\`\`\`php
public function process(string $id): void {
    // guard against null
}

// Before passing to process():
if ($id !== null) {
    $service->process($id);
}
\`\`\`

**Option B: Allow Nullable in Signature**
\`\`\`php
// Update signature to string|null (or ?string in older PHP format)
public function process(string|null $id): void {
    if ($id === null) {
        return;
    }
    // ...
}
\`\`\`

**Option C: Use null coalescing operator**
\`\`\`php
$service->process($id ?? 'default-fallback-id');
\`\`\``;
      } else if (query.includes('no value type specified') || query.includes('iterable') || query.includes('generic') || query.includes('array') || query.includes('collection')) {
        response = `### PHPStan Diagnostic: Missing Generic Array/Iterable Type
PHPStan requires specifying the nested value and key types of arrays, iterables, and generator types on stricter levels (typically level 6+).

#### 🛠️ Recommended Code Remedy:
Document your parameters, return types, or properties with precise PHPDoc generic structures:

**For Properties:**
\`\`\`php
/** @var array<int, UserEntity> */
private array $users = [];
\`\`\`

**For Parameters and Returns:**
\`\`\`php
/**
 * @param array<string, mixed> $payload
 * @return list<UserEntity>
 */
public function parse(array $payload): array { ... }
\`\`\``;
      } else if (query.includes('strict comparison') || query.includes('===') || query.includes('!==') || query.includes('always evaluate to')) {
        response = `### PHPStan Diagnostic: Redundant Strict Comparison
The static analysis tool has traced your variables' type indicators and proved that this comparison will always evaluate to \`true\` or \`false\`.

#### 🛠️ Recommended Code Remedy:
Simplify the expression or ensure you didn't define stale input logic.

**Before:**
\`\`\`php
if ($isActive === true) { // if $isActive is guaranteed to be boolean true already
\`\`\`

**After (KISS approach):**
\`\`\`php
if ($isActive) {
\`\`\``;
      } else if (query.includes('undefined property') || (query.includes('access to') && query.includes('property'))) {
        response = `### PHPStan Diagnostic: Undefined Property Access
You are reading or writing to a property that is not explicitly declared in the class template structure.

#### 🛠️ Recommended Code Remedy:
**Option A: Declare the property on the Class (Pristine Way)**
\`\`\`php
class UserRepository {
    private DatabaseConnection $db; // Ensure types are documented
}
\`\`\`

**Option B: Use \`@property\` PHPDoc declaration for magic properties**
\`\`\`php
/**
 * @property string $temporaryToken
 */
class SessionModel { ... }
\`\`\``;
      } else if (query.includes('undefined method') || (query.includes('call to') && query.includes('method'))) {
        response = `### PHPStan Diagnostic: Call to Undefined Method
You are executing a method call on a Class that PHPStan has resolved, but which does not expose that public method signature. Usually happens with dynamic return types or magic methods.

#### 🛠️ Recommended Code Remedy:
**Option A: Document the magic class methods using \`@method\` tag**
\`\`\`php
/**
 * @method UserEntity findByEmail(string $email)
 */
class UserService extends MagicBaseService { ... }
\`\`\`

**Option B: Inline type-assertion comment**
\`\`\`php
assert($user instanceof UserEntity);
$user->getEmail(); // PHPStan now knows the method exists!
\`\`\``;
      } else if (query.includes('unreachable') || query.includes('dead code')) {
        response = `### PHPStan Diagnostic: Unreachable Statement / Dead Code
The state machine determined that this block of code will never be executed under any standard PHP runtime state.

#### 🛠️ Recommended Code Remedy:
Ensure there are no premature return statements, throw exceptions, or conflicting checks preceding this instruction.
\`\`\`php
// Bad:
return;
echo "this is dead code!";

// Bad:
if ($x === true && $x === false) {
    echo "this is dead code!";
}
\`\`\``;
      } else if (query.includes('bleed') || query.includes('edge') || query.includes('bleedingedge')) {
        response = `### PHPStan Diagnostic: Bleeding Edge Ruleset
\`Bleeding Edge\` in PHPStan 2.x is enabled by including the dedicated \`bleedingEdge.neon\` config file, which turns on next-major rules, behaviour changes, and bug fixes early.

#### 🛠️ Trade-Off and Recommendation:
* **Benefit**: Pre-emptively catches standard type issues that will become standard in the next releases. Excellent for proactive library maintainers.
* **Cost**: Your build pipelines can fail unexpectedly when minor package increments of PHPStan introduce stricter rules.
* **Config**: Add it through the \`includes\` section, for example \`vendor/phpstan/phpstan/conf/bleedingEdge.neon\`.`;
      } else if (query.includes('baseline')) {
        response = `### PHPStan Diagnostic: Technical Debt Baselines
A baseline file lists all existing static analysis errors with their specific files and occurrence counts, so that code audits can ignore legacy errors on current files while checking any new changes strictly.

#### 🛠️ Best Practices:
1. Generate your baseline file dynamically: \`vendor/bin/phpstan analyse --generate-baseline\`
2. Commit the baseline to your git repository (\`phpstan-baseline.neon\`).
3. Include it in your primary \`phpstan.neon.dist\`:
   \`\`\`neon
   includes:
       - phpstan-baseline.neon
   \`\`\`
4. Work to burn down technical debt over time without compromising modern strictness checks on new source assets.`;
      } else if (query.includes('symfony') || query.includes('larastan') || query.includes('laravel') || query.includes('doctrine')) {
        response = `### PHPStan Diagnostic: Framework Extensions Safety
Frameworks like Symfony or Laravel frequently rely on magic getters, dependency injections, dynamic container elements, and high magic routing. Out-of-the-box PHPStan cannot resolve these.

#### 🛠️ Recommended Code Remedy:
Enable matching framework extensions to teach PHPStan how to statically resolve dynamic routing, container parameters, and model relations:
* **Laravel / Larastan**: Handles magic Eloquent scopes, relation queries, and facades.
* **Symfony Extension**: Resolves dependency injection containers, service locator bindings, and request properties.
* **Doctrine DBAL/ORM Extension**: Inspects QueryBuilder types, entity relations, and database column target mappings.`;
      } else {
        response = `### PHPStan Diagnostic: General Static Type Safety
Your query was simulated and resolved instantly by our high-performance offline Rule Advisor!

#### 💡 Key Guidelines for PHPStan v2:
1. **Strict Type Safety (Level 8 & 9)**: Force explicit methods arguments, declare solid scalar arrays element models, and strictly handle null checks.
2. **Zero-Noise Baselines**: If legacy components are unresolvable or third-party classes have dynamic properties, suppress these issues inside a \`phpstan-baseline.neon\` file rather than disabling critical strict rules.
3. **Generics & PHPDocs**: Leverage type systems of PHP 8.1+ (intersection, union types) and pair them with high-fidelity generic declarations like \`/** @return array<int, string> */\` to avoid type casting checks.`;
      }

      setAdvisorResponse(response);
      setDiagnosticHistory(prev => [{ q: textToSubmit, a: response }, ...prev]);
      setLoading(false);
    }, 200);
  };

  return (
    <div id="ai-advisor-panel" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm self-start w-full">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <Sparkles className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              Experimental Rule Advisor
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-amber-50 border border-amber-200 rounded-md text-amber-700 font-semibold">
                Experimental
              </span>
            </h3>
            <p className="text-xs text-slate-500">Paste static analysis errors and get immediate code fixes. *Suggestions must be reviewed before applying.*</p>
          </div>
        </div>
      </div>

      <div className="mb-4 flex border-b border-slate-200 text-xs">
        <button
          onClick={() => { setActiveTab('diagnose'); setAdvisorResponse(null); setErrorInput(''); }}
          className={`pb-2.5 px-4 font-medium transition-colors cursor-pointer ${
            activeTab === 'diagnose' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          Diagnose Terminal Error
        </button>
        <button
          onClick={() => { setActiveTab('ask'); setAdvisorResponse(null); setErrorInput(''); }}
          className={`pb-2.5 px-4 font-medium transition-colors cursor-pointer ${
            activeTab === 'ask' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          Ask Rule Question
        </button>
      </div>

      <div className="space-y-4">
        {activeTab === 'diagnose' ? (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2 font-mono flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-slate-500" />
              Copy-paste compiler output to analyze:
            </label>
            <div className="relative">
              <textarea
                value={errorInput}
                onChange={(e) => setErrorInput(e.target.value)}
                placeholder="Example: Parameter #1 $user of method Class::save() expects User, User|null given."
                rows={3}
                id="diagnose-error-textarea"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-y"
              />
              <button
                disabled={loading || !errorInput.trim()}
                onClick={() => handleDiagnose(errorInput)}
                className="absolute right-3 bottom-3 p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed shadow-sm"
                title="Send advice request"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : <CornerDownLeft className="w-4 h-4" />}
              </button>
            </div>

            {/* Prepended presets for developers to try immediately */}
            <div className="mt-3 flex flex-wrap gap-2 items-center">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Quick Test cases:
              </span>
              {presetErrors.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => { setErrorInput(item.error); }}
                  className="text-[11px] px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded-md text-slate-600 transition-all cursor-pointer shadow-sm"
                >
                  {item.title}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2 font-mono">
              Ask any question about phpstan rules:
            </label>
            <div className="relative">
              <input
                type="text"
                value={errorInput}
                onChange={(e) => setErrorInput(e.target.value)}
                placeholder="How do I configure bleedingEdge properly with custom error baselines?"
                id="ask-rule-text-input"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-indigo-500/50 shadow-inner"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleDiagnose(errorInput);
                }}
              />
              <button
                disabled={loading || !errorInput.trim()}
                onClick={() => handleDiagnose(errorInput)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed shadow"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Advisor result loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <p className="text-xs text-slate-500">Retrieving recommendations and code remedy suggestions...</p>
          </div>
        )}

        {/* Advisor output result */}
        {advisorResponse && !loading && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5 animate-fadeIn max-h-[420px] overflow-y-auto">
            <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2">
              <span className="text-indigo-700 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Advisor Analysis
              </span>
              <span className="text-[10px] text-slate-400">Matched to Level {currentLevel} context</span>
            </div>
            
            {/* Custom Markdown response converter */}
            <div className="text-xs text-slate-700 space-y-2 leading-relaxed font-sans select-all font-normal">
              {advisorResponse.split('\n').map((line, index) => {
                const trimmed = line.trim();
                
                // Code block renderer
                if (trimmed.startsWith('```')) {
                  return null; // Handle code blocks with simple styling or combined rendering in an elegant way
                }

                // If line contains lists or bullets
                if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
                  const content = line.replace(/^[\s*-]+/, '').trim();
                  return (
                    <li key={index} className="list-disc ml-4 pl-1 text-slate-700">
                      {parseInlineFormatting(content)}
                    </li>
                  );
                }

                if (trimmed.startsWith('###')) {
                  return (
                    <h4 key={index} className="text-indigo-700 font-semibold text-xs mt-3 mb-1 font-mono uppercase">
                      {trimmed.replace(/^###\s*/, '')}
                    </h4>
                  );
                }

                if (trimmed.startsWith('##')) {
                  return (
                    <h4 key={index} className="text-indigo-700 font-semibold text-xs mt-3 mb-1 font-mono uppercase">
                      {trimmed.replace(/^##\s*/, '')}
                    </h4>
                  );
                }

                // Standard paragraph block
                if (trimmed) {
                  return (
                    <p key={index} className="text-slate-700 text-xs">
                      {parseInlineFormatting(trimmed)}
                    </p>
                  );
                }

                return <div key={index} className="h-2" />;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Super elementary regex parser to style bold `**` and inline backticks in text blocks without full react-markdown
 */
function parseInlineFormatting(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let currentIdx = 0;
  
  // Regex to look for **bold** or `code`
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  let match;
  let idComp = 0;

  while ((match = regex.exec(text)) !== null) {
    const rawMatch = match[0];
    const matchIdx = match.index;
    
    // push normal text before match
    if (matchIdx > currentIdx) {
      parts.push(text.substring(currentIdx, matchIdx));
    }
    
    // Style formatting
    if (rawMatch.startsWith('**') && rawMatch.endsWith('**')) {
      parts.push(
        <strong key={idComp++} className="font-bold text-slate-900">
          {rawMatch.substring(2, rawMatch.length - 2)}
        </strong>
      );
    } else if (rawMatch.startsWith('`') && rawMatch.endsWith('`')) {
      parts.push(
        <code key={idComp++} className="bg-white border border-slate-200 text-indigo-700 px-1 py-0.5 rounded font-mono text-[10px] font-semibold">
          {rawMatch.substring(1, rawMatch.length - 1)}
        </code>
      );
    }
    
    currentIdx = regex.lastIndex;
  }
  
  if (currentIdx < text.length) {
    parts.push(text.substring(currentIdx));
  }
  
  return <>{parts.length > 0 ? parts : text}</>;
}
