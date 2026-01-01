/**
 * AST Node Definitions for Mycelial Language
 * These classes represent the structure of parsed .mycelial programs
 */

class ASTNode {
  constructor() {
    this.location = null; // { file, line, column }
  }
}

// ============================================================================
// Top-level Program Structure
// ============================================================================

class NetworkNode extends ASTNode {
  constructor(name) {
    super();
    this.type = 'Network';
    this.name = name;
    this.frequencies = [];    // FrequencyDef[]
    this.hyphae = [];         // HyphalDef[]
    this.topology = null;     // TopologyDef
    this.config = {};         // Config options
  }
}

// ============================================================================
// Frequency Definitions (Signal Types)
// ============================================================================

class FrequencyDef extends ASTNode {
  constructor(name) {
    super();
    this.type = 'Frequency';
    this.name = name;
    this.fields = [];  // Field[]
  }

  addField(field) {
    this.fields.push(field);
    return this;
  }
}

class Field {
  constructor(name, fieldType) {
    this.name = name;
    this.type = fieldType;  // 'u32', 'string', 'queue<string>', etc.
  }
}

// ============================================================================
// Hyphal Definitions (Agent Definitions)
// ============================================================================

class HyphalDef extends ASTNode {
  constructor(name) {
    super();
    this.type = 'Hyphal';
    this.name = name;
    this.state = [];   // StateField[]
    this.rules = [];   // Rule[]
  }

  addStateField(field) {
    this.state.push(field);
    return this;
  }

  addRule(rule) {
    this.rules.push(rule);
    return this;
  }
}

class StateField {
  constructor(name, fieldType, initialValue = null) {
    this.name = name;
    this.type = fieldType;
    this.initialValue = initialValue;
  }
}

// ============================================================================
// Rules
// ============================================================================

class Rule extends ASTNode {
  constructor(trigger) {
    super();
    this.type = 'Rule';
    this.trigger = trigger;      // RuleTrigger (Signal, Rest, Cycle, etc.)
    this.body = [];               // Statement[]
  }

  addStatement(stmt) {
    this.body.push(stmt);
    return this;
  }
}

// Rule Triggers
class SignalMatch extends ASTNode {
  constructor(frequency, binding = null, guard = null) {
    super();
    this.type = 'SignalMatch';
    this.frequency = frequency;   // String: frequency name
    this.binding = binding;        // String: variable name to bind signal to
    this.guard = guard;            // Expression: optional where clause
  }
}

class RestTrigger extends ASTNode {
  constructor() {
    super();
    this.type = 'Rest';
  }
}

class CycleTrigger extends ASTNode {
  constructor(period) {
    super();
    this.type = 'Cycle';
    this.period = period;          // Number: cycle period
  }
}

// ============================================================================
// Statements
// ============================================================================

class Statement extends ASTNode {
  constructor(type) {
    super();
    this.type = type;
  }
}

class EmitStatement extends Statement {
  constructor(frequency) {
    super('Emit');
    this.frequency = frequency;    // String: frequency name
    this.fields = [];              // EmitField[]
  }

  addField(name, value) {
    this.fields.push({ name, value });
    return this;
  }
}

class AssignmentStatement extends Statement {
  constructor(target, value) {
    super('Assignment');
    this.target = target;          // String or FieldAccess
    this.value = value;            // Expression
  }
}

class ConditionalStatement extends Statement {
  constructor(condition) {
    super('Conditional');
    this.condition = condition;    // Expression
    this.thenBranch = [];          // Statement[]
    this.elseIfBranches = [];      // { condition, statements }[]
    this.elseBranch = [];          // Statement[]
  }

  addThenStatement(stmt) {
    this.thenBranch.push(stmt);
    return this;
  }

  addElseIfBranch(condition, statements) {
    this.elseIfBranches.push({ condition, statements });
    return this;
  }

  addElseStatement(stmt) {
    this.elseBranch.push(stmt);
    return this;
  }
}

class ReportStatement extends Statement {
  constructor(metric, value) {
    super('Report');
    this.metric = metric;          // String: metric name
    this.value = value;            // Expression or Literal
  }
}

class SpawnStatement extends Statement {
  constructor(hyphalType, instanceId) {
    super('Spawn');
    this.hyphalType = hyphalType;  // String: type of hyphal to spawn
    this.instanceId = instanceId;  // String: instance name
  }
}

class DieStatement extends Statement {
  constructor() {
    super('Die');
  }
}

// ============================================================================
// Expressions
// ============================================================================

class Expression extends ASTNode {
  constructor(type) {
    super();
    this.type = type;
  }
}

class Literal extends Expression {
  constructor(value, literalType) {
    super('Literal');
    this.value = value;
    this.literalType = literalType;  // 'number', 'string', 'boolean'
  }
}

class Identifier extends Expression {
  constructor(name) {
    super('Identifier');
    this.name = name;
  }
}

class FieldAccess extends Expression {
  constructor(object, field) {
    super('FieldAccess');
    this.object = object;           // Expression
    this.field = field;             // String
  }
}

class BinaryOp extends Expression {
  constructor(left, operator, right) {
    super('BinaryOp');
    this.left = left;               // Expression
    this.operator = operator;       // '+', '-', '*', '/', '%', '<', '>', '==', etc.
    this.right = right;             // Expression
  }
}

class UnaryOp extends Expression {
  constructor(operator, operand) {
    super('UnaryOp');
    this.operator = operator;       // '-', '!'
    this.operand = operand;         // Expression
  }
}

class FunctionCall extends Expression {
  constructor(name) {
    super('FunctionCall');
    this.name = name;               // String: function name
    this.args = [];                 // Expression[]
  }

  addArg(arg) {
    this.args.push(arg);
    return this;
  }
}

class ObjectConstruction extends Expression {
  constructor() {
    super('ObjectConstruction');
    this.fields = [];               // { name: String, value: Expression }[]
  }

  addField(name, value) {
    this.fields.push({ name, value });
    return this;
  }
}

// ============================================================================
// Topology
// ============================================================================

class TopologyDef extends ASTNode {
  constructor() {
    super();
    this.type = 'Topology';
    this.fruitingBodies = [];      // String[] - names
    this.spawns = [];              // SpawnDef[]
    this.sockets = [];             // SocketDef[]
  }

  addFruitingBody(name) {
    this.fruitingBodies.push(name);
    return this;
  }

  addSpawn(spawn) {
    this.spawns.push(spawn);
    return this;
  }

  addSocket(socket) {
    this.sockets.push(socket);
    return this;
  }
}

class SpawnDef extends ASTNode {
  constructor(hyphalType, instanceId) {
    super();
    this.type = 'Spawn';
    this.hyphalType = hyphalType;  // String: type to spawn
    this.instanceId = instanceId;  // String: instance ID
  }
}

class SocketDef extends ASTNode {
  constructor(from, to, frequency) {
    super();
    this.type = 'Socket';
    this.from = from;              // String: source (hyphal ID or fruiting body)
    this.to = to;                  // String: destination (hyphal ID or fruiting body, or '*')
    this.frequency = frequency;    // String: frequency type
  }
}

// ============================================================================
// Configuration
// ============================================================================

class Config {
  constructor() {
    this.cyclePeriodMs = 100;
    this.maxBufferSize = 1000;
    this.enableHealthMonitoring = true;
  }
}

// ============================================================================
// Type System
// ============================================================================

class TypeInfo {
  static PRIMITIVES = {
    'u32': { name: 'u32', kind: 'primitive' },
    'i64': { name: 'i64', kind: 'primitive' },
    'f64': { name: 'f64', kind: 'primitive' },
    'string': { name: 'string', kind: 'primitive' },
    'binary': { name: 'binary', kind: 'primitive' },
    'boolean': { name: 'boolean', kind: 'primitive' },
  };

  static isGenericType(typeStr) {
    return /^(vec|queue|map)</.test(typeStr);
  }

  static parseGenericType(typeStr) {
    const match = typeStr.match(/^(\w+)<(.+)>$/);
    if (!match) return null;
    return {
      container: match[1],
      innerTypes: match[2].split(',').map(t => t.trim()),
    };
  }

  static isPrimitiveType(typeStr) {
    return TypeInfo.PRIMITIVES.hasOwnProperty(typeStr);
  }
}

// ============================================================================
// Error Reporting
// ============================================================================

class ParseError extends Error {
  constructor(message, location = null) {
    super(message);
    this.name = 'ParseError';
    this.location = location;
  }

  toString() {
    if (this.location) {
      return `ParseError at ${this.location.line}:${this.location.column}: ${this.message}`;
    }
    return `ParseError: ${this.message}`;
  }
}

class SourceLocation {
  constructor(line, column, file = null) {
    this.line = line;
    this.column = column;
    this.file = file;
  }

  toString() {
    if (this.file) {
      return `${this.file}:${this.line}:${this.column}`;
    }
    return `${this.line}:${this.column}`;
  }
}

// Export all classes
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    // Top-level
    NetworkNode, ASTNode,
    // Frequencies
    FrequencyDef, Field,
    // Hyphae
    HyphalDef, StateField,
    // Rules
    Rule, SignalMatch, RestTrigger, CycleTrigger,
    // Statements
    Statement, EmitStatement, AssignmentStatement, ConditionalStatement,
    ReportStatement, SpawnStatement, DieStatement,
    // Expressions
    Expression, Literal, Identifier, FieldAccess, BinaryOp, UnaryOp,
    FunctionCall, ObjectConstruction,
    // Topology
    TopologyDef, SpawnDef, SocketDef, Config,
    // Types
    TypeInfo,
    // Errors
    ParseError, SourceLocation,
  };
}
