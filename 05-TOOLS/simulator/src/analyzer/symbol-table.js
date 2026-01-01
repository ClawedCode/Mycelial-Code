/**
 * Semantic Analyzer - Symbol Table
 */

class SemanticAnalyzer {
  constructor() {
    this.errors = [];
    this.symbols = {
      frequencies: new Map(),
      hyphae: new Map(),
      instances: new Map(),
    };
  }

  /**
   * Main analysis entry point
   */
  analyze(network) {
    this.errors = [];

    // Phase 1: Register all frequencies
    for (let freq of network.frequencies) {
      this.symbols.frequencies.set(freq.name, freq);
    }

    // Phase 2: Register all hyphal types
    for (let hyphal of network.hyphae) {
      this.symbols.hyphae.set(hyphal.name, hyphal);
    }

    // Phase 3: Register instances from topology
    if (network.topology) {
      for (let spawn of network.topology.spawns) {
        if (!this.symbols.hyphae.has(spawn.hyphalType)) {
          this.errors.push({
            message: `Undefined hyphal type: ${spawn.hyphalType}`,
            line: spawn.location?.line || 0,
            column: spawn.location?.column || 0,
            severity: 'error',
          });
        }
        this.symbols.instances.set(spawn.instanceId, spawn);
      }
    }

    // Phase 4: Validate topology
    this.validateTopology(network.topology);

    // Phase 5: Validate types (simplified for now)
    this.validateTypes(network);

    return this.errors;
  }

  /**
   * Validate topology connectivity
   */
  validateTopology(topology) {
    if (!topology) return;

    const validNodes = new Set();

    // Fruiting bodies
    for (let fb of topology.fruitingBodies) {
      validNodes.add(fb);
    }

    // Instances
    for (let spawn of topology.spawns) {
      validNodes.add(spawn.instanceId);
    }

    // Sockets must reference valid nodes
    for (let socket of topology.sockets) {
      if (socket.from !== '*' && !validNodes.has(socket.from)) {
        this.errors.push({
          message: `Socket references undefined node: ${socket.from}`,
          line: socket.location?.line || 0,
          column: socket.location?.column || 0,
          severity: 'error',
        });
      }

      if (socket.to !== '*' && !validNodes.has(socket.to)) {
        this.errors.push({
          message: `Socket references undefined node: ${socket.to}`,
          line: socket.location?.line || 0,
          column: socket.location?.column || 0,
          severity: 'error',
        });
      }
    }
  }

  /**
   * Validate types
   */
  validateTypes(network) {
    // Check emit statements reference defined frequencies
    for (let hyphal of network.hyphae) {
      for (let rule of hyphal.rules) {
        this.validateRule(rule);
      }
    }
  }

  /**
   * Validate a rule
   */
  validateRule(rule) {
    if (rule.trigger instanceof SignalMatch) {
      // Check frequency exists
      if (!this.symbols.frequencies.has(rule.trigger.frequency)) {
        this.errors.push({
          message: `Undefined frequency: ${rule.trigger.frequency}`,
          line: rule.location?.line || 0,
          column: rule.location?.column || 0,
          severity: 'error',
        });
      }
    }

    // Check statements
    for (let stmt of rule.body) {
      this.validateStatement(stmt);
    }
  }

  /**
   * Validate a statement
   */
  validateStatement(stmt) {
    if (stmt instanceof EmitStatement) {
      // Check frequency exists
      if (!this.symbols.frequencies.has(stmt.frequency)) {
        this.errors.push({
          message: `Undefined frequency in emit: ${stmt.frequency}`,
          line: stmt.location?.line || 0,
          column: stmt.location?.column || 0,
          severity: 'error',
        });
      }
    } else if (stmt instanceof ConditionalStatement) {
      for (let s of stmt.thenBranch) {
        this.validateStatement(s);
      }
      for (let s of stmt.elseBranch) {
        this.validateStatement(s);
      }
      for (let branch of stmt.elseIfBranches) {
        for (let s of branch.statements) {
          this.validateStatement(s);
        }
      }
    }
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SemanticAnalyzer };
}
