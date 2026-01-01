# Mycelial Language Specification
## Complete Definition of Syntax, Semantics, and Grammar

---

## Overview

This directory contains the formal specification for the Mycelial Programming Language. It defines:
- **Syntax**: How you write Mycelial programs
- **Semantics**: What those programs mean and how they execute
- **Grammar**: Formal rules for parsing
- **Examples**: Concrete programs demonstrating the language

---

## Documents

### 1. [SYNTAX_DESIGN.md](SYNTAX_DESIGN.md)
**Defines the concrete syntax of Mycelial**

Contains:
- Level 1: Fundamentals (frequencies, hyphae, sockets)
- Level 2: Network assembly (complete programs)
- Level 3: Advanced features (pattern matching, conditionals, lifecycle)
- Level 4: Summary of keywords, operators, types
- Level 5: A complete weather monitoring network example
- Level 6: Alternative syntax approaches considered

**Use this to**: Understand how to write Mycelial code

### 2. [GRAMMAR.md](GRAMMAR.md)
**Formal BNF specification for parsing**

Contains:
- Top-level program structure
- Expression and statement definitions
- Type system
- Lexical rules (tokens, identifiers, literals)
- Operator precedence and associativity
- Error recovery strategies
- Parse tree example

**Use this to**: Implement a lexer/parser, or understand parsing rules

### 3. [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
**Cheat sheet with quick examples**

Contains:
- Syntax snippets for every language feature
- Common patterns (fan-out/fan-in, pipelines, load balancing)
- Data types and type system
- Error handling approaches
- Comments and style guide
- Quick reference table

**Use this to**: Find syntax examples quickly, remember features

---

## Example Programs

See `07-EXAMPLES/` for runnable examples:

### Basic Examples
- **hello_world.mycelial** - Simplest program
- **pipeline.mycelial** - Sequential data processing

### Distributed Patterns
- **distributed_search.mycelial** - Parallel search with aggregation
- **map_reduce.mycelial** - Data parallelism pattern
- **consensus.mycelial** - Voting with distributed tally

Each example includes:
- Complete working code
- Comments explaining the logic
- Execution trace showing how data flows
- Key properties and use cases

---

## Language Concepts

### Frequencies
Signal types that define communication protocols between hyphae.

```mycelial
frequency task {
  data: string
  priority: u32
}
```

### Hyphae
Autonomous agents with local state and rules.

```mycelial
hyphal worker {
  state {
    queue: queue<task>
  }

  on signal(task, t) {
    state.queue.push(t)
    emit result { data: process(t.data) }
  }
}
```

### Sockets
Directional connections between hyphae that carry signals of a specific frequency.

```mycelial
socket input -> worker (frequency: task)
socket worker -> output (frequency: result)
```

### Networks
Complete programs describing topology, hyphae, and signal flows.

```mycelial
network MyNetwork {
  frequencies { ... }
  hyphae { ... }
  topology { ... }
  config { ... }
}
```

---

## Key Design Decisions

### 1. Local Rules, Global Behavior
Each hyphal follows simple local rules. Global behavior emerges without central coordination.

### 2. Asynchronous Signals
Communication is one-way signals, not blocking remote calls. This enables parallelism.

### 3. Automatic Backpressure
Socket buffers manage flow. No explicit queue management needed.

### 4. No Explicit Synchronization
Instead of locks, hyphae use signal patterns. Consensus emerges naturally.

### 5. Type-Safe Signals
Each signal type is defined upfront with its schema. Helps catch errors early.

### 6. Composable Networks
Networks can contain other networks, enabling hierarchical decomposition.

---

## Syntax At a Glance

| Concept | Syntax | Purpose |
|---------|--------|---------|
| Define signal type | `frequency NAME { fields }` | Protocol definition |
| Define agent | `hyphal NAME { state, rules }` | Agent logic |
| Match signal | `on signal(freq, var)` | Event handler |
| Send signal | `emit freq { fields }` | Communication |
| Create connection | `socket source -> dest (frequency)` | Topology |
| Spawn agent | `spawn type as name` | Dynamic creation |
| Report status | `report metric: value` | Diagnostics |
| Conditionals | `if expr { } else { }` | Control flow |

---

## Types Supported

**Primitives:**
- `u32` - 32-bit unsigned integer
- `i64` - 64-bit signed integer
- `f64` - 64-bit floating point
- `string` - Text
- `binary` - Raw bytes
- `boolean` - true/false

**Collections:**
- `vec<T>` - Dynamic array
- `queue<T>` - FIFO queue
- `map<K, V>` - Key-value map

**Custom:**
- Any frequency can be used as a type (for signal payloads)

---

## Common Patterns

The language naturally supports:

1. **Producer-Consumer**
   - One hyphal produces, another consumes via socket

2. **Fan-Out/Fan-In**
   - One sender to multiple workers, aggregated results back

3. **Pipeline**
   - Chain of hyphae, each transforming data

4. **Map-Reduce**
   - Distribution, parallel processing, aggregation

5. **Request-Response**
   - Paired signals flowing both directions

6. **Broadcast**
   - One sender to many receivers via `*` wildcard

7. **Load Balancing**
   - Relay distributes tasks to least-loaded workers

8. **Consensus**
   - Multiple voters reach agreement through signals

---

## Error Handling Philosophy

Mycelial doesn't use try/catch. Instead:

1. **Redundancy**: Multiple paths mean failures are rerouted
2. **Feedback**: Health monitoring detects problems
3. **Graceful Degradation**: Network continues with reduced capacity
4. **Automatic Recovery**: Failed nodes are isolated; healthy ones continue

Errors are treated like biological problems: the organism survives by routing around damage.

---

## Next Steps

### For Implementers:
1. Use `GRAMMAR.md` to build a lexer/parser
2. Create an AST (Abstract Syntax Tree) from parse tree
3. Implement semantic analysis (type checking)
4. Build code generation to bytecode or lower-level IR
5. Implement the runtime (see `02-CORE/`)

### For Language Users:
1. Read `SYNTAX_DESIGN.md` to learn the language
2. Study examples in `07-EXAMPLES/`
3. Use `QUICK_REFERENCE.md` as a cheat sheet
4. Write simple programs and build up complexity

### For Researchers:
1. Analyze semantics in `00-VISION/EXECUTION_MODEL.md`
2. Verify properties: deadlock-freedom, fairness, correctness
3. Study emergent behavior in the examples
4. Design optimization strategies (see `09-BENCHMARKS/`)

---

## Specification Validation

This specification is validated by:
- ✅ Formal grammar (EBNF)
- ✅ Concrete syntax examples
- ✅ Multiple working programs
- ✅ Execution traces
- ✅ Error cases documented

Gaps to address:
- ⏳ Type system formalism
- ⏳ Proof of deadlock-freedom
- ⏳ Formalization of cycle semantics
- ⏳ Rigorous testing framework

---

## Design Philosophy

The specification follows these principles:

1. **Elegance**: Minimal syntax, maximum expressiveness
2. **Clarity**: Code should be readable and intent obvious
3. **Consistency**: Similar things look similar
4. **Pragmatism**: Support real distributed patterns
5. **Bio-inspiration**: Language mirrors biological systems

---

## Version History

- **v0.1.0** (Dec 2025): Initial specification
  - Syntax design complete
  - Grammar formalized
  - Examples working
  - Ready for implementation

---

## Questions & Future Work

### Open Questions:
1. Should state be serializable for checkpointing?
2. How strict should type checking be?
3. What's the right balance between implicit and explicit?
4. Should there be a macro system?

### Potential Extensions:
- Spatial networks (hyphae with locations)
- Time-based events (delays, deadlines)
- Constraint systems (for optimization)
- Formal verification (proving correctness)

---

## Contributing

To improve the specification:
1. Check examples against syntax rules
2. Propose new patterns with working code
3. Find ambiguities in grammar
4. Test edge cases
5. Suggest clarity improvements

---

**Last Updated**: December 29, 2025
**Status**: Specification Complete - Ready for Implementation

