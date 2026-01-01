/**
 * Runtime Scheduler
 * Executes the tidal cycle model (SENSE → ACT → REST)
 */

class Scheduler {
  constructor(ast) {
    this.ast = ast;
    this.runtime = this.initializeRuntime(ast);
    this.paused = false;
    this.speed = 5;
  }

  /**
   * Initialize runtime from AST
   */
  initializeRuntime(ast) {
    const runtime = {
      cycleCount: 0,
      phase: 'REST', // Will move to SENSE on first cycle
      agents: new Map(),
      sockets: [],
      fruitingBodies: new Map(),
      metrics: {},
    };

    // Create hyphal agents from topology spawns
    if (ast.topology) {
      for (let spawn of ast.topology.spawns) {
        const hyphalDef = ast.hyphae.find(h => h.name === spawn.hyphalType);
        if (hyphalDef) {
          const agent = new HyphalAgent(spawn.instanceId, spawn.hyphalType, hyphalDef);
          runtime.agents.set(spawn.instanceId, agent);
        }
      }

      // Create fruiting bodies
      for (let fbName of ast.topology.fruitingBodies) {
        runtime.fruitingBodies.set(fbName, {
          name: fbName,
          inbox: [],
          outbox: [],
        });
      }

      // Create sockets
      for (let socketDef of ast.topology.sockets) {
        runtime.sockets.push({
          from: socketDef.from,
          to: socketDef.to,
          frequency: socketDef.frequency,
          buffer: [],
          capacity: ast.config?.maxBufferSize || 1000,
        });
      }
    }

    return runtime;
  }

  /**
   * Execute one complete cycle: SENSE → ACT → REST
   */
  executeOneCycle() {
    this.runtime.cycleCount++;

    // Phase 1: SENSE
    this.runtime.phase = 'SENSE';
    this.sensePhase();

    // Phase 2: ACT
    this.runtime.phase = 'ACT';
    this.actPhase();

    // Phase 3: REST
    this.runtime.phase = 'REST';
    this.restPhase();
  }

  /**
   * SENSE Phase: Deliver signals to agents
   */
  sensePhase() {
    // Deliver signals from socket buffers to agent inboxes
    for (let agent of this.runtime.agents.values()) {
      agent.inbox = [];

      // Find all sockets that target this agent
      for (let socket of this.runtime.sockets) {
        if (socket.to === agent.id) {
          // Transfer buffered signals to agent inbox
          while (socket.buffer.length > 0) {
            agent.inbox.push(socket.buffer.shift());
          }
        }
      }
    }
  }

  /**
   * ACT Phase: Process agents and emit signals
   */
  actPhase() {
    for (let agent of this.runtime.agents.values()) {
      agent.outbox = [];

      // Process each incoming signal
      for (let signal of agent.inbox) {
        // Find matching rule
        let matched = false;

        for (let rule of agent.rules) {
          if (this.matchRule(rule, signal, agent.state)) {
            // Execute rule
            this.executeRule(rule, signal, agent);
            matched = true;
            break; // First match wins
          }
        }

        if (!matched && signal.type !== 'heartbeat') {
          // No matching rule, signal is dropped or logged
          console.warn(`No rule matched for signal: ${signal.type} in agent ${agent.id}`);
        }
      }

      // Route outgoing signals through sockets
      for (let signal of agent.outbox) {
        this.routeSignal(signal);
      }
    }
  }

  /**
   * REST Phase: Cleanup and health reporting
   */
  restPhase() {
    for (let agent of this.runtime.agents.values()) {
      agent.inbox = [];
      agent.outbox = [];

      // Report metrics
      if (agent.health) {
        this.runtime.metrics[agent.id] = agent.health;
      }
    }
  }

  /**
   * Check if a rule matches a signal and state
   */
  matchRule(rule, signal, state) {
    if (!(rule.trigger instanceof SignalMatch)) {
      return false;
    }

    const trigger = rule.trigger;

    // Check frequency matches
    if (trigger.frequency !== signal.type) {
      return false;
    }

    // Check guard condition if present
    if (trigger.guard) {
      // TODO: Evaluate guard expression
      return true;
    }

    return true;
  }

  /**
   * Execute a rule
   */
  executeRule(rule, signal, agent) {
    const context = {
      state: agent.state,
      signal: signal.payload,
      agent: agent,
      emit: (frequency, payload) => {
        const outSignal = {
          type: frequency,
          payload: payload,
          origin: agent.id,
          destination: null, // Will be determined by routing
        };
        agent.outbox.push(outSignal);
      },
      report: (metric, value) => {
        agent.health = { metric, value };
      },
    };

    // Execute statements in rule body
    for (let stmt of rule.body) {
      this.executeStatement(stmt, context);
    }
  }

  /**
   * Execute a statement
   */
  executeStatement(stmt, context) {
    if (stmt instanceof EmitStatement) {
      const payload = {};

      // Evaluate fields
      for (let field of stmt.fields) {
        payload[field.name] = this.evaluateExpression(field.value, context);
      }

      context.emit(stmt.frequency, payload);
    } else if (stmt instanceof AssignmentStatement) {
      const value = this.evaluateExpression(stmt.value, context);
      this.assignValue(stmt.target, value, context.state);
    } else if (stmt instanceof ConditionalStatement) {
      const condition = this.evaluateExpression(stmt.condition, context);

      if (condition) {
        for (let s of stmt.thenBranch) {
          this.executeStatement(s, context);
        }
      } else {
        let matched = false;

        for (let branch of stmt.elseIfBranches) {
          if (this.evaluateExpression(branch.condition, context)) {
            for (let s of branch.statements) {
              this.executeStatement(s, context);
            }
            matched = true;
            break;
          }
        }

        if (!matched) {
          for (let s of stmt.elseBranch) {
            this.executeStatement(s, context);
          }
        }
      }
    }
  }

  /**
   * Evaluate an expression
   */
  evaluateExpression(expr, context) {
    if (expr instanceof Literal) {
      return expr.value;
    } else if (expr instanceof Identifier) {
      if (context.state.hasOwnProperty(expr.name)) {
        return context.state[expr.name];
      }
      if (context.signal && context.signal.hasOwnProperty(expr.name)) {
        return context.signal[expr.name];
      }
      return null;
    } else if (expr instanceof FieldAccess) {
      const obj = this.evaluateExpression(expr.object, context);
      return obj?.[expr.field];
    } else if (expr instanceof BinaryOp) {
      const left = this.evaluateExpression(expr.left, context);
      const right = this.evaluateExpression(expr.right, context);

      switch (expr.operator) {
        case '+': return left + right;
        case '-': return left - right;
        case '*': return left * right;
        case '/': return left / right;
        case '%': return left % right;
        case '==': return left === right;
        case '!=': return left !== right;
        case '<': return left < right;
        case '>': return left > right;
        case '<=': return left <= right;
        case '>=': return left >= right;
        case '&&': return left && right;
        case '||': return left || right;
        default: return null;
      }
    } else if (expr instanceof FunctionCall) {
      return this.evaluateFunction(expr, context);
    } else if (expr instanceof ObjectConstruction) {
      const obj = {};
      for (let field of expr.fields) {
        obj[field.name] = this.evaluateExpression(field.value, context);
      }
      return obj;
    }

    return null;
  }

  /**
   * Evaluate built-in functions
   */
  evaluateFunction(expr, context) {
    const args = expr.args.map(arg => this.evaluateExpression(arg, context));

    switch (expr.name) {
      case 'format':
        if (args[0] === undefined) return '';
        let str = String(args[0]);
        for (let i = 1; i < args.length; i++) {
          str = str.replace('{}', String(args[i]));
        }
        return str;

      case 'len':
        return args[0]?.length || 0;

      case 'sum':
        if (!Array.isArray(args[0])) return 0;
        return args[0].reduce((a, b) => a + b, 0);

      case 'mean':
        if (!Array.isArray(args[0]) || args[0].length === 0) return 0;
        return args[0].reduce((a, b) => a + b, 0) / args[0].length;

      default:
        console.warn(`Unknown function: ${expr.name}`);
        return null;
    }
  }

  /**
   * Assign a value to a state variable
   */
  assignValue(target, value, state) {
    if (target.includes('.')) {
      const parts = target.split('.');
      let obj = state;

      for (let i = 0; i < parts.length - 1; i++) {
        obj = obj[parts[i]];
      }

      obj[parts[parts.length - 1]] = value;
    } else {
      state[target] = value;
    }
  }

  /**
   * Route a signal through the network
   */
  routeSignal(signal) {
    for (let socket of this.runtime.sockets) {
      if (socket.from === signal.origin && socket.frequency === signal.type) {
        if (socket.to === '*') {
          // Broadcast to all agents
          for (let agent of this.runtime.agents.values()) {
            socket.buffer.push(signal);
          }
        } else if (this.runtime.agents.has(socket.to)) {
          // Unicast to specific agent
          socket.buffer.push(signal);
        } else if (this.runtime.fruitingBodies.has(socket.to)) {
          // Route to fruiting body (output)
          this.runtime.fruitingBodies.get(socket.to).outbox.push(signal);
        }
      }
    }
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Scheduler };
}
