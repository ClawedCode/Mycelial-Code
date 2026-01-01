#!/usr/bin/env node

/**
 * Command-line test harness for Mycelial Simulator
 * Tests parser, analyzer, and runtime on all example programs
 */

const fs = require('fs');
const path = require('path');

// Mock module.exports for browser modules
global.module = { exports: {} };

// Load simulator modules (they need to work in Node.js context)
const moduleFiles = [
  './src/parser/ast.js',
  './src/parser/lexer.js',
  './src/parser/parser.js',
  './src/analyzer/symbol-table.js',
  './src/runtime/hyphal-agent.js',
  './src/runtime/scheduler.js',
];

// Simple require replacement
global.require = (name) => {
  // Return the module if it's already loaded
  if (global[name]) return global[name];
  return {};
};

// Load all modules
for (let file of moduleFiles) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    // Execute in global context to register classes
    eval(content);
  } catch (e) {
    console.error(`Error loading ${file}:`, e.message);
  }
}

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function testProgram(name, filePath) {
  log(`\n🧪 Testing: ${name}`, 'cyan');
  log('─'.repeat(60));

  try {
    // Read file
    const source = fs.readFileSync(filePath, 'utf8');
    log(`✓ File loaded (${source.length} bytes)`, 'dim');

    // Phase 1: Lexical analysis
    log(`  → Lexing...`, 'dim');
    const lexer = new Lexer(source, filePath);
    const tokens = lexer.tokenize();
    log(`  ✓ Lexer produced ${tokens.length} tokens`, 'green');

    // Phase 2: Parsing
    log(`  → Parsing...`, 'dim');
    const parser = new Parser(tokens);
    const ast = parser.parse();

    if (!ast) {
      throw new Error('Parser returned null AST');
    }
    log(`  ✓ Parser built AST (network: ${ast.name})`, 'green');

    // Check for parse errors
    if (parser.errors && parser.errors.length > 0) {
      log(`  ⚠ Parse warnings: ${parser.errors.length}`, 'yellow');
      parser.errors.forEach(e => {
        log(`    • ${e.message} (line ${e.line})`, 'yellow');
      });
    }

    // Phase 3: Semantic analysis
    log(`  → Analyzing...`, 'dim');
    const analyzer = new SemanticAnalyzer();
    const errors = analyzer.analyze(ast);

    if (errors && errors.length > 0) {
      log(`  ✗ Analysis failed: ${errors.length} errors`, 'red');
      errors.forEach(e => {
        log(`    • ${e.message}`, 'red');
      });
      return false;
    }
    log(`  ✓ Semantic analysis passed`, 'green');

    // Phase 4: Runtime initialization
    log(`  → Initializing runtime...`, 'dim');
    const scheduler = new Scheduler(ast);

    const agentCount = scheduler.runtime.agents.size;
    const socketCount = scheduler.runtime.sockets.length;
    const fbCount = scheduler.runtime.fruitingBodies.size;

    if (agentCount === 0) {
      log(`  ⚠ No agents spawned`, 'yellow');
    } else {
      log(`  ✓ Runtime initialized with ${agentCount} agents, ${socketCount} sockets, ${fbCount} fruiting bodies`, 'green');
    }

    // Phase 5: Execute one cycle
    log(`  → Executing cycle...`, 'dim');
    scheduler.executeOneCycle();
    log(`  ✓ Cycle 1 executed successfully`, 'green');

    log(`\n✅ PASSED: ${name}`, 'green');
    return true;
  } catch (e) {
    log(`\n❌ FAILED: ${name}`, 'red');
    log(`   Error: ${e.message}`, 'red');
    if (e.stack) {
      log(`   Stack: ${e.stack.split('\n').slice(0, 3).join('\n')}`, 'dim');
    }
    return false;
  }
}

// Main test execution
function main() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'bright');
  log('║     🧬 MYCELIAL SIMULATOR - COMPREHENSIVE TEST SUITE       ║', 'bright');
  log('╚════════════════════════════════════════════════════════════╝\n', 'bright');

  const examples = [
    { name: 'Hello World', file: './examples/hello_world.mycelial' },
    { name: 'Pipeline (3-stage)', file: './examples/pipeline.mycelial' },
    { name: 'Map-Reduce', file: './examples/map_reduce.mycelial' },
    { name: 'Distributed Search', file: './examples/distributed_search.mycelial' },
    { name: 'Consensus', file: './examples/consensus.mycelial' },
    { name: 'ClawedCode (P2P Network)', file: './examples/clawed_code.mycelial' },
  ];

  let passed = 0;
  let failed = 0;
  const results = [];

  for (let example of examples) {
    const success = testProgram(example.name, example.file);
    results.push({ name: example.name, success });

    if (success) {
      passed++;
    } else {
      failed++;
    }
  }

  // Summary
  log('\n' + '═'.repeat(60), 'bright');
  log('TEST SUMMARY', 'bright');
  log('═'.repeat(60));

  log(`Total:   ${examples.length}`, 'cyan');
  log(`Passed:  ${passed}`, 'green');
  log(`Failed:  ${failed}`, failed > 0 ? 'red' : 'green');

  const percentage = ((passed / examples.length) * 100).toFixed(0);
  log(`Success: ${percentage}%\n`, passed === examples.length ? 'green' : 'yellow');

  // Detailed results
  log('DETAILED RESULTS:', 'bright');
  for (let result of results) {
    const icon = result.success ? '✓' : '✗';
    const color = result.success ? 'green' : 'red';
    log(`  ${icon} ${result.name}`, color);
  }

  log('\n' + '═'.repeat(60), 'bright');

  if (failed === 0) {
    log('🎉 ALL TESTS PASSED! 🎉', 'green');
    log('\nThe Mycelial simulator successfully:', 'bright');
    log('  ✓ Parsed all 6 example programs', 'green');
    log('  ✓ Validated semantics', 'green');
    log('  ✓ Initialized runtime for each', 'green');
    log('  ✓ Executed tidal cycles', 'green');
    log('\n🚀 Ready for interactive testing!\n', 'bright');
    process.exit(0);
  } else {
    log(`⚠️  ${failed} test(s) failed`, 'red');
    log('\nFix errors and try again.\n', 'red');
    process.exit(1);
  }
}

// Run tests
main();
