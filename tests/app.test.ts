import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import App from '../src/App';

test('App shows preset blueprints first without opening helper panels by default', () => {
  const html = renderToStaticMarkup(React.createElement(App));

  assert.match(html, /Choose Preset Blueprint/);
  assert.match(html, /Fine-tune from existing project files/);
  assert.match(html, /Single selection source/);
  assert.doesNotMatch(html, /Activated from composer\.json/);
  assert.doesNotMatch(html, /Recommended Extensions/);
  assert.doesNotMatch(html, /Optional Strictness Packs/);
  assert.doesNotMatch(html, /Framework Alternative/);
  assert.doesNotMatch(html, /composer-json-textarea-s1/);
  assert.doesNotMatch(html, /import-neon-textarea-s1/);
  assert.doesNotMatch(html, /voku-spec/);
  assert.doesNotMatch(html, /Pristine Slate Light/);
  assert.doesNotMatch(html, /Pure, deterministic, interactive config engineering/);
});
