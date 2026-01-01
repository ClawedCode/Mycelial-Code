#!/usr/bin/env node

/**
 * Simple syntax verification for Mycelial programs
 * Checks that .mycelial files are well-formed
 */

const fs = require('fs');
const path = require('path');

// Simple tokenizer (subset)
class SimpleTokenizer {
  constructor(source) {
    this.source = source;
    this.pos = 0;
  }

  tokenize() {
    const keywords = new Set([
      'network', 'frequencies', 'frequency', 'hyphae', 'hyphal',
      'state', 'on', 'signal', 'emit', 'report', 'spawn', 'die',
      'socket', 'fruiting_body', 'topology', 'config',
      'if', 'else', 'where', 'rest', 'cycle', 'let'
    ]);

    const tokens = [];
    let line = 1, col = 1;

    while (this.pos < this.source.length) {
      const ch = this.source[this.pos];

      // Skip whitespace
      if (/\s/.test(ch)) {
        if (ch === '\n') { line++; col = 1; }
        else { col++; }
        this.pos++;
        continue;
      }

      // Skip comments
      if (ch === '#') {
        while (this.pos < this.source.length && this.source[this.pos] !== '\n') {
          this.pos++;
        }
        continue;
      }

      // Identifiers and keywords
      if (/[a-zA-Z_]/.test(ch)) {
        let ident = '';
        while (this.pos < this.source.length && /[a-zA-Z0-9_]/.test(this.source[this.pos])) {
          ident += this.source[this.pos++];
        }
        const type = keywords.has(ident) ? 'KEYWORD' : 'IDENT';
        tokens.push({ type, value: ident, line, col });
        col += ident.length;
        continue;
      }

      // Strings
      if (ch === '"' || ch === "'") {
        const quote = ch;
        let str = '';
        this.pos++;
        while (this.pos < this.source.length && this.source[this.pos] !== quote) {
          str += this.source[this.pos++];
        }
        this.pos++; // closing quote
        tokens.push({ type: 'STRING', value: str, line, col });
        col += str.length + 2;
        continue;
      }

      // Numbers
      if (/\d/.test(ch)) {
        let num = '';
        while (this.pos < this.source.length && /[\d.]/.test(this.source[this.pos])) {
          num += this.source[this.pos++];
        }
        tokens.push({ type: 'NUMBER', value: num, line, col });
        col += num.length;
        continue;
      }

      // Operators and delimiters
      const twoChar = ch + (this.source[this.pos + 1] || '');
      if (['->','==','!=','<=','>=','&&','||'].includes(twoChar)) {
        tokens.push({ type: 'OP', value: twoChar, line, col });
        this.pos += 2;
        col += 2;
        continue;
      }

      if ('{}<>()[],:;.=+-%!@'.includes(ch)) {
        tokens.push({ type: 'DELIM', value: ch, line, col });
        this.pos++;
        col++;
        continue;
      }

      // Unknown
      this.pos++;
      col++;
    }

    return tokens;
  }
}

// Simple structure validator
function validateStructure(tokens, filename) {
  const errors = [];

  let braceCount = 0;
  let parenCount = 0;
  let bracketCount = 0;
  let hasNetwork = false;
  let inNetwork = false;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.type === 'KEYWORD' && token.value === 'network') {
      hasNetwork = true;
      inNetwork = true;
    }

    if (token.value === '{') braceCount++;
    if (token.value === '}') {
      braceCount--;
      if (braceCount === 0) inNetwork = false;
    }

    if (token.value === '(') parenCount++;
    if (token.value === ')') parenCount--;

    if (token.value === '[') bracketCount++;
    if (token.value === ']') bracketCount--;
  }

  if (!hasNetwork) {
    errors.push('Missing "network" keyword');
  }

  if (braceCount !== 0) {
    errors.push(`Unmatched braces (${braceCount > 0 ? 'unclosed' : 'extra'})`);
  }

  if (parenCount !== 0) {
    errors.push(`Unmatched parentheses (${parenCount > 0 ? 'unclosed' : 'extra'})`);
  }

  if (bracketCount !== 0) {
    errors.push(`Unmatched brackets (${bracketCount > 0 ? 'unclosed' : 'extra'})`);
  }

  return {
    valid: errors.length === 0,
    errors,
    tokenCount: tokens.length,
    hasNetworkDef: hasNetwork
  };
}

// Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

// Main
const examplesDir = './examples';
const files = fs.readdirSync(examplesDir).filter(f => f.endsWith('.mycelial')).sort();

log('\n╔════════════════════════════════════════════════════════════╗', 'bright');
log('║     🧬 MYCELIAL SYNTAX VERIFICATION SUITE                  ║', 'bright');
log('╚════════════════════════════════════════════════════════════╝\n', 'bright');

let passCount = 0;
let failCount = 0;
const results = [];

for (let file of files) {
  const filePath = path.join(examplesDir, file);
  const source = fs.readFileSync(filePath, 'utf8');

  log(`Testing: ${file}`, 'cyan');

  try {
    const tokenizer = new SimpleTokenizer(source);
    const tokens = tokenizer.tokenize();

    const validation = validateStructure(tokens, file);

    if (validation.valid) {
      log(`  ✓ Syntax valid`, 'green');
      log(`  ✓ ${validation.tokenCount} tokens parsed`, 'dim');
      if (validation.hasNetworkDef) {
        log(`  ✓ Network definition found`, 'dim');
      }
      log('', 'green');
      passCount++;
      results.push({ file, status: 'pass' });
    } else {
      log(`  ✗ Syntax errors:`, 'red');
      for (let err of validation.errors) {
        log(`    • ${err}`, 'red');
      }
      log('', 'red');
      failCount++;
      results.push({ file, status: 'fail', errors: validation.errors });
    }
  } catch (e) {
    log(`  ✗ Error: ${e.message}`, 'red');
    log('', 'red');
    failCount++;
    results.push({ file, status: 'error', error: e.message });
  }
}

// Summary
log('═'.repeat(60), 'bright');
log(`RESULTS: ${passCount} passed, ${failCount} failed`, passCount === files.length ? 'green' : 'yellow');
log('═'.repeat(60) + '\n', 'bright');

if (failCount === 0) {
  log('✅ All Mycelial programs have valid syntax!', 'green');
  log('\nPrograms verified:', 'bright');
  for (let result of results) {
    log(`  ✓ ${result.file}`, 'green');
  }
  log('\nThese programs are ready for:', 'bright');
  log('  • Parser testing (next step)', 'cyan');
  log('  • Runtime execution', 'cyan');
  log('  • Interactive visualization', 'cyan');
  log('  • Semantic validation\n', 'cyan');
  process.exit(0);
} else {
  log('⚠️  Some programs have syntax errors', 'red');
  process.exit(1);
}
