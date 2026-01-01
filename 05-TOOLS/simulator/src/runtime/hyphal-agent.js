/**
 * Hyphal Agent - Represents an individual computational agent
 */

class HyphalAgent {
  constructor(id, type, definition) {
    this.id = id;
    this.type = type;
    this.definition = definition;

    // State
    this.state = {};
    this.initializeState(definition);

    // Communication
    this.inbox = [];
    this.outbox = [];

    // Compiled rules
    this.rules = definition.rules || [];

    // Health
    this.vitality = 'active';
    this.health = null;
    this.age = 0;
    this.failureCount = 0;
  }

  /**
   * Initialize state from definition
   */
  initializeState(definition) {
    for (let stateField of definition.state) {
      if (stateField.initialValue) {
        this.state[stateField.name] = this.evaluateInitialValue(stateField.initialValue);
      } else {
        // Default values by type
        const type = stateField.type;
        if (type === 'u32' || type === 'i64' || type === 'f64') {
          this.state[stateField.name] = 0;
        } else if (type === 'string') {
          this.state[stateField.name] = '';
        } else if (type === 'boolean') {
          this.state[stateField.name] = false;
        } else if (type === 'binary') {
          this.state[stateField.name] = new Uint8Array();
        } else if (type.startsWith('vec')) {
          this.state[stateField.name] = [];
        } else if (type.startsWith('queue')) {
          this.state[stateField.name] = [];
        } else if (type.startsWith('map')) {
          this.state[stateField.name] = new Map();
        } else {
          // Custom type
          this.state[stateField.name] = null;
        }
      }
    }
  }

  /**
   * Evaluate an initial value expression
   */
  evaluateInitialValue(expr) {
    if (expr instanceof Literal) {
      return expr.value;
    }
    // More complex expressions would need full evaluator
    return null;
  }

  /**
   * Update age and vitality
   */
  age() {
    this.age++;

    // Update vitality based on health metrics
    if (this.failureCount > 3) {
      this.vitality = 'failed';
    } else if (this.failureCount > 1) {
      this.vitality = 'degraded';
    } else if (this.inbox.length > 0 || this.outbox.length > 0) {
      this.vitality = 'active';
    } else {
      this.vitality = 'idle';
    }
  }

  /**
   * Get a JSON representation for visualization
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      state: this.state,
      inbox: this.inbox.length,
      outbox: this.outbox.length,
      vitality: this.vitality,
      age: this.age,
      failureCount: this.failureCount,
    };
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HyphalAgent };
}
