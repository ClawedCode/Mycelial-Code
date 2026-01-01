/**
 * Parser for Mycelial Language
 * Recursive descent parser that builds AST from tokens
 */

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.current = 0;
    this.errors = [];
  }

  /**
   * Current token
   */
  peek() {
    if (this.current >= this.tokens.length) {
      return this.tokens[this.tokens.length - 1]; // EOF
    }
    return this.tokens[this.current];
  }

  /**
   * Lookahead
   */
  peekAhead(offset = 1) {
    const pos = this.current + offset;
    if (pos >= this.tokens.length) {
      return this.tokens[this.tokens.length - 1]; // EOF
    }
    return this.tokens[pos];
  }

  /**
   * Consume current token and advance
   */
  advance() {
    const token = this.peek();
    if (token.type !== 'EOF') {
      this.current++;
    }
    return token;
  }

  /**
   * Expect a specific token type
   */
  expect(type) {
    const token = this.peek();
    if (token.type !== type) {
      this.error(`Expected ${type}, got ${token.type}`, token);
    }
    return this.advance();
  }

  /**
   * Check if current token matches type
   */
  match(...types) {
    return types.includes(this.peek().type);
  }

  /**
   * Consume if matches type
   */
  consume(type) {
    if (this.peek().type === type) {
      return this.advance();
    }
    return null;
  }

  /**
   * Error reporting
   */
  error(message, token = null) {
    token = token || this.peek();
    const error = {
      message,
      line: token.line,
      column: token.column,
      severity: 'error',
    };
    this.errors.push(error);
  }

  /**
   * Warning reporting
   */
  warn(message, token = null) {
    token = token || this.peek();
    const warning = {
      message,
      line: token.line,
      column: token.column,
      severity: 'warning',
    };
    this.errors.push(warning);
  }

  // ========================================================================
  // Main Parsing Entry Point
  // ========================================================================

  /**
   * Parse a complete network
   */
  parse() {
    try {
      return this.parseNetwork();
    } catch (e) {
      if (e instanceof SyntaxError) {
        this.error(e.message);
      } else {
        throw e;
      }
      return null;
    }
  }

  // ========================================================================
  // Top-level: Network
  // ========================================================================

  parseNetwork() {
    if (!this.match('NETWORK')) {
      this.error('Expected "network" keyword');
      throw new SyntaxError('Expected "network"');
    }

    this.expect('NETWORK');
    const name = this.expect('IDENTIFIER').value;
    this.expect('LBRACE');

    const network = new NetworkNode(name);

    // Parse sections in any order, but typically: frequencies, hyphae, topology, config
    while (!this.match('RBRACE') && !this.match('EOF')) {
      if (this.match('FREQUENCIES')) {
        network.frequencies = this.parseFrequencies();
      } else if (this.match('HYPHAE')) {
        network.hyphae = this.parseHyphae();
      } else if (this.match('TOPOLOGY')) {
        network.topology = this.parseTopology();
      } else if (this.match('CONFIG')) {
        network.config = this.parseConfig();
      } else {
        this.error(`Unexpected token in network: ${this.peek().value}`);
        this.advance();
      }
    }

    this.expect('RBRACE');

    if (network.topology === null) {
      network.topology = new TopologyDef();
    }

    return network;
  }

  // ========================================================================
  // Frequencies
  // ========================================================================

  parseFrequencies() {
    this.expect('FREQUENCIES');
    this.expect('LBRACE');

    const frequencies = [];

    while (!this.match('RBRACE')) {
      const freq = this.parseFrequencyDef();
      if (freq) {
        frequencies.push(freq);
      }
    }

    this.expect('RBRACE');
    return frequencies;
  }

  parseFrequencyDef() {
    if (!this.match('IDENTIFIER')) {
      this.error('Expected frequency name');
      return null;
    }

    const name = this.advance().value;
    this.expect('LBRACE');

    const freq = new FrequencyDef(name);

    while (!this.match('RBRACE')) {
      const fieldName = this.expect('IDENTIFIER').value;
      this.expect('COLON');
      const fieldType = this.parseType();
      freq.addField(new Field(fieldName, fieldType));
    }

    this.expect('RBRACE');
    return freq;
  }

  parseType() {
    const typeName = this.expect('IDENTIFIER').value;

    // Check for generic types: vec<T>, queue<T>, map<K,V>
    if (this.match('LT')) {
      this.advance(); // consume <
      const innerTypes = [this.parseType()];

      while (this.match('COMMA')) {
        this.advance(); // consume ,
        innerTypes.push(this.parseType());
      }

      this.expect('GT');
      return `${typeName}<${innerTypes.join(', ')}>`;
    }

    return typeName;
  }

  // ========================================================================
  // Hyphae
  // ========================================================================

  parseHyphae() {
    this.expect('HYPHAE');
    this.expect('LBRACE');

    const hyphae = [];

    while (!this.match('RBRACE')) {
      const hyphal = this.parseHyphalDef();
      if (hyphal) {
        hyphae.push(hyphal);
      }
    }

    this.expect('RBRACE');
    return hyphae;
  }

  parseHyphalDef() {
    if (!this.match('HYPHAL')) {
      this.error('Expected "hyphal" keyword');
      return null;
    }

    this.expect('HYPHAL');
    const name = this.expect('IDENTIFIER').value;
    this.expect('LBRACE');

    const hyphal = new HyphalDef(name);

    // Parse state and rules
    while (!this.match('RBRACE')) {
      if (this.match('STATE')) {
        this.expect('STATE');
        this.expect('LBRACE');

        while (!this.match('RBRACE')) {
          const fieldName = this.expect('IDENTIFIER').value;
          this.expect('COLON');
          const fieldType = this.parseType();

          let initialValue = null;
          if (this.match('ASSIGN')) {
            this.advance();
            initialValue = this.parseExpression();
          }

          hyphal.addStateField(new StateField(fieldName, fieldType, initialValue));
        }

        this.expect('RBRACE');
      } else if (this.match('ON')) {
        const rule = this.parseRule();
        if (rule) {
          hyphal.addRule(rule);
        }
      } else {
        this.error(`Unexpected token in hyphal: ${this.peek().value}`);
        this.advance();
      }
    }

    this.expect('RBRACE');
    return hyphal;
  }

  // ========================================================================
  // Rules
  // ========================================================================

  parseRule() {
    this.expect('ON');

    let trigger = null;

    // Determine rule type: signal, rest, or cycle
    if (this.match('SIGNAL')) {
      trigger = this.parseSignalMatch();
    } else if (this.match('REST')) {
      this.advance();
      trigger = new RestTrigger();
    } else if (this.match('CYCLE')) {
      this.advance();
      const period = this.expect('NUMBER').value;
      trigger = new CycleTrigger(period);
    } else {
      this.error('Expected "signal", "rest", or "cycle" in rule');
      return null;
    }

    this.expect('LBRACE');

    const rule = new Rule(trigger);

    while (!this.match('RBRACE')) {
      const stmt = this.parseStatement();
      if (stmt) {
        rule.addStatement(stmt);
      }
    }

    this.expect('RBRACE');
    return rule;
  }

  parseSignalMatch() {
    this.expect('SIGNAL');
    this.expect('LPAREN');

    const frequency = this.expect('IDENTIFIER').value;

    let binding = null;
    if (this.match('COMMA')) {
      this.advance();
      binding = this.expect('IDENTIFIER').value;
    }

    let guard = null;
    if (this.match('WHERE')) {
      this.advance();
      guard = this.parseExpression();
    }

    this.expect('RPAREN');

    return new SignalMatch(frequency, binding, guard);
  }

  // ========================================================================
  // Statements
  // ========================================================================

  parseStatement() {
    if (this.match('EMIT')) {
      return this.parseEmitStatement();
    } else if (this.match('REPORT')) {
      return this.parseReportStatement();
    } else if (this.match('SPAWN')) {
      return this.parseSpawnStatement();
    } else if (this.match('DIE')) {
      this.advance();
      return new DieStatement();
    } else if (this.match('IF')) {
      return this.parseConditionalStatement();
    } else if (this.match('IDENTIFIER') || this.match('LET')) {
      // Assignment: [let] IDENTIFIER = expression
      if (this.match('LET')) {
        this.advance();
      }
      const target = this.expect('IDENTIFIER').value;

      // Check for field access: target.field
      if (this.match('DOT')) {
        const fields = [target];
        while (this.match('DOT')) {
          this.advance();
          fields.push(this.expect('IDENTIFIER').value);
        }
        this.expect('ASSIGN');
        const value = this.parseExpression();
        // For now, represent as assignment to the full field path
        return new AssignmentStatement(fields.join('.'), value);
      }

      this.expect('ASSIGN');
      const value = this.parseExpression();
      return new AssignmentStatement(target, value);
    } else {
      this.error(`Unexpected statement: ${this.peek().value}`);
      this.advance();
      return null;
    }
  }

  parseEmitStatement() {
    this.expect('EMIT');
    const frequency = this.expect('IDENTIFIER').value;
    this.expect('LBRACE');

    const emit = new EmitStatement(frequency);

    while (!this.match('RBRACE')) {
      const fieldName = this.expect('IDENTIFIER').value;
      this.expect('COLON');
      const value = this.parseExpression();
      emit.addField(fieldName, value);

      if (this.match('COMMA')) {
        this.advance();
      }
    }

    this.expect('RBRACE');
    return emit;
  }

  parseReportStatement() {
    this.expect('REPORT');
    const metric = this.expect('IDENTIFIER').value;
    this.expect('COLON');
    const value = this.parseExpression();
    return new ReportStatement(metric, value);
  }

  parseSpawnStatement() {
    this.expect('SPAWN');
    const hyphalType = this.expect('IDENTIFIER').value;
    this.expect('AS');
    const instanceId = this.expect('IDENTIFIER').value;
    return new SpawnStatement(hyphalType, instanceId);
  }

  parseConditionalStatement() {
    this.expect('IF');
    const condition = this.parseExpression();
    this.expect('LBRACE');

    const conditional = new ConditionalStatement(condition);

    while (!this.match('RBRACE')) {
      const stmt = this.parseStatement();
      if (stmt) {
        conditional.addThenStatement(stmt);
      }
    }

    this.expect('RBRACE');

    // else if and else clauses
    while (this.match('ELSE')) {
      this.advance();

      if (this.match('IF')) {
        this.advance();
        const elseIfCondition = this.parseExpression();
        this.expect('LBRACE');

        const elseIfStatements = [];
        while (!this.match('RBRACE')) {
          const stmt = this.parseStatement();
          if (stmt) {
            elseIfStatements.push(stmt);
          }
        }

        this.expect('RBRACE');
        conditional.addElseIfBranch(elseIfCondition, elseIfStatements);
      } else {
        this.expect('LBRACE');

        while (!this.match('RBRACE')) {
          const stmt = this.parseStatement();
          if (stmt) {
            conditional.addElseStatement(stmt);
          }
        }

        this.expect('RBRACE');
        break;
      }
    }

    return conditional;
  }

  // ========================================================================
  // Expressions
  // ========================================================================

  parseExpression() {
    return this.parseLogicalOr();
  }

  parseLogicalOr() {
    let left = this.parseLogicalAnd();

    while (this.match('OR')) {
      const op = this.advance().value;
      const right = this.parseLogicalAnd();
      left = new BinaryOp(left, op, right);
    }

    return left;
  }

  parseLogicalAnd() {
    let left = this.parseEquality();

    while (this.match('AND')) {
      const op = this.advance().value;
      const right = this.parseEquality();
      left = new BinaryOp(left, op, right);
    }

    return left;
  }

  parseEquality() {
    let left = this.parseComparison();

    while (this.match('EQ', 'NE')) {
      const op = this.advance().value;
      const right = this.parseComparison();
      left = new BinaryOp(left, op, right);
    }

    return left;
  }

  parseComparison() {
    let left = this.parseAdditive();

    while (this.match('LT', 'GT', 'LE', 'GE')) {
      const op = this.advance().value;
      const right = this.parseAdditive();
      left = new BinaryOp(left, op, right);
    }

    return left;
  }

  parseAdditive() {
    let left = this.parseMultiplicative();

    while (this.match('PLUS', 'MINUS')) {
      const op = this.advance().value;
      const right = this.parseMultiplicative();
      left = new BinaryOp(left, op, right);
    }

    return left;
  }

  parseMultiplicative() {
    let left = this.parseUnary();

    while (this.match('STAR', 'SLASH', 'PERCENT')) {
      const op = this.advance().value;
      const right = this.parseUnary();
      left = new BinaryOp(left, op, right);
    }

    return left;
  }

  parseUnary() {
    if (this.match('NOT', 'MINUS')) {
      const op = this.advance().value;
      const operand = this.parseUnary();
      return new UnaryOp(op, operand);
    }

    return this.parsePrimary();
  }

  parsePrimary() {
    // Literals
    if (this.match('NUMBER')) {
      const value = this.advance().value;
      return new Literal(value, 'number');
    }

    if (this.match('STRING')) {
      const value = this.advance().value;
      return new Literal(value, 'string');
    }

    if (this.match('TRUE', 'FALSE')) {
      const value = this.advance().value === 'true';
      return new Literal(value, 'boolean');
    }

    // Parenthesized expression
    if (this.match('LPAREN')) {
      this.advance();
      const expr = this.parseExpression();
      this.expect('RPAREN');
      return expr;
    }

    // Object construction: frequency { field: value, ... }
    if (this.match('IDENTIFIER')) {
      const token = this.peek();
      if (this.peekAhead().type === 'LBRACE') {
        // This might be an object construction
        const name = this.advance().value;
        this.expect('LBRACE');

        const obj = new ObjectConstruction();
        // Treat as frequency payload
        obj.frequency = name;

        while (!this.match('RBRACE')) {
          const fieldName = this.expect('IDENTIFIER').value;
          this.expect('COLON');
          const fieldValue = this.parseExpression();
          obj.addField(fieldName, fieldValue);

          if (this.match('COMMA')) {
            this.advance();
          }
        }

        this.expect('RBRACE');
        return obj;
      }

      // Simple identifier or field access
      const ident = this.advance().value;
      let expr = new Identifier(ident);

      // Field access chain: a.b.c
      while (this.match('DOT')) {
        this.advance();
        const field = this.expect('IDENTIFIER').value;
        expr = new FieldAccess(expr, field);
      }

      // Function call
      if (this.match('LPAREN')) {
        this.advance();
        const fn = new FunctionCall(ident);

        while (!this.match('RPAREN')) {
          fn.addArg(this.parseExpression());

          if (this.match('COMMA')) {
            this.advance();
          }
        }

        this.expect('RPAREN');
        return fn;
      }

      return expr;
    }

    this.error(`Unexpected token in expression: ${this.peek().value}`);
    throw new SyntaxError('Unexpected token in expression');
  }

  // ========================================================================
  // Topology
  // ========================================================================

  parseTopology() {
    this.expect('TOPOLOGY');
    this.expect('LBRACE');

    const topology = new TopologyDef();

    while (!this.match('RBRACE')) {
      if (this.match('FRUITING_BODY')) {
        this.advance();
        const name = this.expect('IDENTIFIER').value;
        topology.addFruitingBody(name);
      } else if (this.match('SPAWN')) {
        const spawn = this.parseSpawnDef();
        if (spawn) {
          topology.addSpawn(spawn);
        }
      } else if (this.match('SOCKET')) {
        const socket = this.parseSocketDef();
        if (socket) {
          topology.addSocket(socket);
        }
      } else {
        this.error(`Unexpected token in topology: ${this.peek().value}`);
        this.advance();
      }
    }

    this.expect('RBRACE');
    return topology;
  }

  parseSpawnDef() {
    this.expect('SPAWN');
    const hyphalType = this.expect('IDENTIFIER').value;
    this.expect('AS');
    const instanceId = this.expect('IDENTIFIER').value;
    return new SpawnDef(hyphalType, instanceId);
  }

  parseSocketDef() {
    this.expect('SOCKET');

    const from = this.parsePath();
    this.expect('ARROW');
    const to = this.parsePath();

    let frequency = null;
    if (this.match('LPAREN')) {
      this.advance();
      this.expect('FREQUENCY');
      this.expect('COLON');
      frequency = this.expect('IDENTIFIER').value;
      this.expect('RPAREN');
    }

    return new SocketDef(from, to, frequency);
  }

  parsePath() {
    if (this.match('ASTERISK')) {
      this.advance();
      return '*';
    }

    return this.expect('IDENTIFIER').value;
  }

  // ========================================================================
  // Configuration
  // ========================================================================

  parseConfig() {
    this.expect('CONFIG');
    this.expect('LBRACE');

    const config = new Config();

    while (!this.match('RBRACE')) {
      const key = this.expect('IDENTIFIER').value;
      this.expect('COLON');
      const value = this.parseExpression();

      if (key === 'cycle_period_ms' && value instanceof Literal) {
        config.cyclePeriodMs = value.value;
      } else if (key === 'max_buffer_size' && value instanceof Literal) {
        config.maxBufferSize = value.value;
      } else if (key === 'enable_health_monitoring' && value instanceof Literal) {
        config.enableHealthMonitoring = value.value;
      }
    }

    this.expect('RBRACE');
    return config;
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Parser };
}

class SyntaxError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SyntaxError';
  }
}
