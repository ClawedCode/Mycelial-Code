# Mycelial Core Primitives
## The Building Blocks of Bio-Inspired Computation

---

## 1. Hyphal Agent

The fundamental unit of execution. A lightweight, event-driven actor.

```
PRIMITIVE: Hyphal[T]
- ID: unique identifier
- State: T (local mutable state)
- Rules: event -> action
- Connections: edges to other hyphae (outgoing)
- Lifecycle: spawn, sense, act, rest, die
```

**Responsibilities:**
- Maintain local state
- Listen for incoming signals (nutrients)
- Apply local rules based on state + signal
- Emit outgoing signals
- Manage own lifecycle (grow, split, decay)

---

## 2. Signal (Nutrient)

A packet of data flowing through the network.

```
PRIMITIVE: Signal[D]
- Type: frequency/message type
- Data: D (payload)
- Origin: hyphal ID
- Destination: hyphal ID or broadcast
- Sequence: ordering in a stream
- TTL: time-to-live or hop limit
```

**Properties:**
- Immutable
- Can carry any data type
- Can travel multiple hops through relays
- Can split/merge at relay points
- Has a "taste"—a type/frequency for routing

---

## 3. Socket (Connection)

A unidirectional channel between two hyphae or between hyphal and relay.

```
PRIMITIVE: Socket[D]
- From: hyphal or relay ID
- To: hyphal or relay ID
- Frequency: the type of signal this carries
- Capacity: buffer size
- State: open, throttled, closed
```

**Behavior:**
- Automatic backpressure (signal queuing/dropping based on capacity)
- Can detect and signal congestion
- Can be pruned if unused
- Adaptive routing based on health

---

## 4. Relay

An intermediate node for routing and buffering. Not a full hyphal agent—simpler.

```
PRIMITIVE: Relay
- ID: unique identifier
- Incoming sockets: list of inbound connections
- Outgoing sockets: list of outbound connections
- Buffer: queued signals
- Rules: routing logic (forward, duplicate, aggregate, transform)
```

**Purpose:**
- Extend network range
- Implement message routing patterns
- Aggregate signals from multiple sources
- Broadcast to multiple destinations
- Implement backpressure

---

## 5. Frequency

A semantic type and protocol for signals. Think of it as a "language" hyphae use to communicate.

```
PRIMITIVE: Frequency
- Name: human-readable identifier
- Schema: what the signal payload contains
- Codec: how to serialize/deserialize
- Cadence: expected temporal pattern (continuous, tidal, sporadic)
- Precedence: priority in congested conditions
```

**Examples:**
- `nutrient:energy` - power/compute distribution
- `sense:touch` - local sensory stimulus
- `coordinate:growth` - signal to spawn new hyphae
- `health:pulse` - periodic status updates

---

## 6. Cycle

Temporal patterns that define when hyphae wake, sense, and act.

```
PRIMITIVE: Cycle
- Period: how long between wakes (milliseconds, logical steps, or biological analogy)
- Phase: offset relative to network clock
- State: active, dormant, transitioning
- Rules: what happens at each phase
```

**Tidal Cycle Example:**
- Phase 0 (Sense): Check for incoming signals
- Phase 1 (Act): Apply local rules, emit outgoing signals
- Phase 2 (Rest): Sleep/buffer refill
- Repeat

---

## 7. Topology

The blueprint of how hyphae and relays are connected at startup.

```
PRIMITIVE: Topology
- Hyphae: list of initial agents (type, state, location)
- Sockets: list of initial connections
- Relays: list of intermediate routing nodes
- Invariants: constraints (min degree, max latency, etc.)
```

**Important:** Topology can change at runtime as hyphae spawn and decompose.

---

## 8. Rule Engine

How a hyphal agent decides what to do. The "logic" of the organism.

```
PRIMITIVE: Rules[S, D]
- Input: state S, signal D, local context
- Pattern match: does this signal match my rules?
- Transformation: how does my state change?
- Emission: what signal(s) do I emit?
- Lifecycle: do I spawn, split, or die?
```

**Possible rule syntax:**
- Pattern matching on signal type
- Conditional logic on state
- Functional transformations
- Guard clauses based on local context

---

## 9. Feedback Loops & Emergence

Mechanisms for information to create emergent global behavior.

```
PRIMITIVE: Feedback
- Negative feedback: dampen growth (e.g., "if network is congested, slow spawning")
- Positive feedback: amplify growth (e.g., "if task is urgent, spawn more workers")
- Resonance: patterns that synchronize across hyphae
```

---

## 10. Health & Diagnostics

The immune system of the network.

```
PRIMITIVE: Health
- Vitality: how well each hyphal agent is functioning
- Dissonance: detection of anomalies or errors
- Autopsy: post-mortem of failed nodes
- Recovery: how the network repairs itself
```

**Observables:**
- Signal latency through paths
- Buffer fill rates
- Node responsiveness
- Topology changes over time

---

## Synthesis: A Simple Example

```
spawn Hyphal(id=A, state={count: 0})
spawn Hyphal(id=B, state={count: 0})

socket A -> B (frequency=nutrient:energy)

rule for A:
  on signal(nutrient:energy, value=v):
    if state.count < 10:
      state.count += 1
      emit signal(nutrient:energy, value=v/2) -> B
    else:
      emit signal(coordinate:growth) -> relay:birth
```

This describes two agents that pass energy back and forth, incrementing a counter, and spawning new agents when the threshold is hit.

---

## Next Steps

1. Decide on the **rule specification language** (pattern matching? state machines? functional?)
2. Define the **wire protocol** for signals across network boundaries
3. Design the **runtime scheduler** and tidal cycle mechanics
4. Create the **topology DSL** for describing networks
5. Build a **simulator** before writing a compiler

