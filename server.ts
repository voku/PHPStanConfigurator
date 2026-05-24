/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Strict DTO Validation rules
  function validateConfig(config: any): string[] {
    const errors: string[] = [];
    if (!config) {
      errors.push("Missing configuration object.");
      return errors;
    }
    
    // level validation: 0-9 or max
    const validLevels = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'max'];
    if (typeof config.level !== 'string' || !validLevels.includes(config.level)) {
      errors.push(`Invalid level: "${config.level}". Must be one of 0-9 or "max".`);
    }

    // paths validation: must be array and not empty
    if (!Array.isArray(config.paths) || config.paths.length === 0) {
      errors.push("Paths must be a non-empty array of strings.");
    } else {
      if (config.paths.some((p: any) => typeof p !== 'string' || p.trim() === '')) {
        errors.push("Paths array contains empty or invalid strings.");
      }
    }

    // phpVersion validation
    if (typeof config.phpVersion !== 'string' || !/^\d+$/.test(config.phpVersion)) {
      errors.push(`Invalid PHP version code: "${config.phpVersion}". Must be a numeric string.`);
    }

    // check baseline and bleedingEdge conflict
    if (config.strictRules?.bleedingEdge && config.baseline) {
      errors.push("Conflict warning: Coexistence of a baseline with bleedingEdge strict preset can suppress critical syntax warnings.");
    }

    return errors;
  }

  // API Route: Generate config and validate strictly
  app.post('/api/config/validate', (req, res) => {
    const config = req.body;
    const errors = validateConfig(config);
    if (errors.length > 0) {
      res.status(400).json({ status: 'error', errors });
    } else {
      res.json({ status: 'ok', message: 'Configuration is strictly validated.' });
    }
  });

  // API Route: Let Gemini explain rules, trade-offs or resolve PHP errors
  app.post('/api/gemini/explain', async (req, res) => {
    const { prompt, type, level, codeContext } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Fallback with a mock detailed response in case SDK credentials aren't set
      return res.json({
        explanation: `**[Local Mode - GEMINI_API_KEY is not configured]**\n\nHere is some guidance regarding your request:\n\n* **Regarding Level ${level || '8'}**: This level enforce complete null-pointer safety, return type declarations, and requires precise type handling.\n* **Standard Quick Fixes**:\n  1. If you are seeing nullable parameter warnings, update your method signature to include ` + '`?Type`' + ` or ` + '`Type|null`' + `.\n  2. Avoid array-checking bypasses; instead declare type hints using phpDoc notations (e.g. ` + '`/** @var User[] */`' + `).\n  3. Use baselines to safely ignore warnings you cannot fix immediately without risking runtime errors.\n\n*To enable smart interactive diagnostics, please configure **GEMINI_API_KEY** in the Secrets panel in the AI Studio menu!*`
      });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      let systemInstruction = "You are an expert static analysis advisor specializing in PHPStan, nettes/neon formats, and modern PHP (8.0 to 8.4) development. " +
        "Help the developer design robust configurations, explain the trade-offs of rules, and teach them how to fix PHP errors in a clean style. " +
        "Reference Lars Moelleken's best practices. Keep replies concise, conversational, and highly technical.";

      let userPrompt = '';
      if (type === 'diagnose-error') {
        userPrompt = `The developer is getting this PHPStan error on Level ${level || '8'}:\n\n` +
          `\`\`\`\n${prompt}\n\`\`\`\n\n` +
          `Please provide:\n` +
          `1. A simple, pristine code snippet showing how to fix this error in PHP (e.g., adding PHPDoc annotations, nullable return types, or generic type parameters).\n` +
          `2. An explanation of why PHPStan is complaining.\n` +
          `3. How they can bypass/suppress it if it's an unresolvable false positive (via inline comment ignore or configuring parameters).`;
      } else {
        userPrompt = `Please explain the following PHPStan rules or concepts:\n\n` +
          `Query: "${prompt}"\n` + 
          `Context level: ${level || 'not specified'}.\n\n` +
          `Give a brief description, the strictness trade-off, and why this flag is essential.`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: userPrompt,
        config: {
          systemInstruction,
        },
      });

      res.json({ explanation: response.text });
    } catch (err: any) {
      console.error("Gemini Error:", err);
      res.status(500).json({ error: 'Failed to elicit Gemini advice. ' + err.message });
    }
  });

  // Vite middleware for development or Static server for production
  if (process.env.NODE_ENV !== "production") {
    console.log("Mounting Vite middleware in dev mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static production assets from dist...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express node server booted at http://0.0.0.0:${PORT}`);
  });
}

startServer();
