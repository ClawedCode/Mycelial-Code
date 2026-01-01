# Mycelial Execution Model
## From Metaphor to Mechanics

---

## The Runtime as Soil

The Mycelial runtime is not a "virtual machine" in the traditional sense. It's an **execution ecosystem**:

```
┌─────────────────────────────────────────────────┐
│              Mycelial Runtime                   │
│  ┌──────────────────────────────────────────┐  │
│  │  Scheduler: Tidal Cycle Orchestration    │  │
│  │  - Wake windows                          │  │
│  │  - Synchronization points                │  │
│  │  - Energy budgets                        │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │  Network Layer: Socket & Relay Mgmt      │  │
│  │  - Signal routing                        │  │
│  │  - Backpressure & flow control           │  │
│  │  - Topology mutations                    │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │  Health Monitor: Vitality & Diagnostics  │  │
│  │  - Latency tracking                      │  │
│  │  - Anomaly detection                     │  │
│  │  - Automatic recovery                    │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │  State Management: Distributed Storage   │  │
│  │  - Per-hyphal state                      │  │
│  │  - Buffer management                     │  │
│  │  - Persistence hooks                     │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## The Tidal Cycle

The heartbeat of the network. Unlike traditional compute loops, Mycelial operates on **biological time**:

### Macro Cycle (Network-wide)
```
[TIDE IN] ──> [SENSE] ──> [PROCESS] ──> [EMIT] ──> [TIDE OUT] ──> [SLEEP]
    ↓           ↓           ↓            ↓           ↓              ↓
  Agents    Input signals  Apply rules  Output   Hyphae growth/   Network
  wake up   arrive & queue  & mutations  signals  decay & repair    quiet
```

### Micro Cycle (Per Hyphal Agent)
Each hyphal agent has its own local cycle, but synchronizes at key points:

```
PHASE 1: SENSE
  └─> Check incoming socket buffers
  └─> Receive all available signals
  └─> Queue them for rule evaluation

PHASE 2: ACT
  └─> Pattern match each signal against rules
  └─> Transform state based on matched rules
  └─> Emit outgoing signals to sockets
  └─> Evaluate lifecycle conditions (spawn/split/die)

PHASE 3: REST
  └─> Flush outgoing buffers
  └─> Compact state storage
  └─> Report health status
  └─> Sleep until next cycle (unless awakened by urgent signal)
```

---

## Signal Flow & Routing

### At Spawn (Initialization)
1. Load topology blueprint
2. Instantiate all hyphae with initial state
3. Establish all socket connections
4. Place relays in network
5. Initialize frontier (which hyphae are "growing")

### During Execution (Per Cycle)
1. **Ingestion**: External signals enter through fruiting bodies
2. **Propagation**: Signals travel through sockets to destination hyphae
3. **Processing**: Each hyphal agent processes its queued signals
4. **Emission**: Agents emit new signals based on rules
5. **Routing**: Relays forward signals along paths
6. **Backpressure**: Full buffers reject or throttle incoming signals
7. **Adaptation**: Network topology changes (new hyphae, closed sockets)

### Example Signal Journey
```
Input "start" -> FruitingBody:input
            ↓
            Relay:1 (fanout to workers)
            ├─> Hyphal:worker_1 (queue signal, pattern match, emit "ack")
            ├─> Hyphal:worker_2 (queue signal, pattern match, emit "ack")
            └─> Hyphal:worker_3 (queue signal, pattern match, emit "ack")
                                ↓
                            Relay:2 (aggregate)
                                ↓
                            Hyphal:supervisor (receives 3 acks, emits "done")
                                ↓
                            FruitingBody:output
```

---

## State Management

### Local State (Per Hyphal Agent)
```rust
Hyphal {
  state: T,           // User-defined type
  inbox: Queue<Signal>,
  outbox: Queue<Signal>,
  vitality: Health,
  age: Timestamp,
  generation: u64
}
```

State is **mutable but local**. No global locks. Hyphae communicate via signals, not shared memory.

### Distributed State (Consensus)
When multiple hyphae need to agree on something:
- They exchange signals repeatedly
- Patterns stabilize over cycles
- A **consensus quorum** forms naturally
- No explicit leader election—emergence through local rules

### Checkpointing & Recovery
```
Every N cycles:
  └─> Snapshot all hyphal states
  └─> Serialize network topology
  └─> Write to persistent storage
  └─> On recovery: restore and resume
```

---

## Concurrency Model

### No Locks, No Waits
Hyphae never block waiting for responses. Instead:

1. **Fire-and-Forget**: Send signal, continue processing
2. **Request-Response Patterns**: Use signal pairing
   ```
   A sends query_signal -> B
   B processes and sends response_signal -> A
   A eventually receives (in next cycle or after)
   ```
3. **Reactive Composition**: Each hyphal processes its queue independently

### Cycle Synchronization
At phase boundaries, the runtime ensures all hyphae have finished before moving to the next phase. This prevents race conditions without explicit locks.

---

## Emergence & Feedback Loops

### Negative Feedback (Regulation)
```
Rule: if (buffer_fill > 80%)
        emit signal(throttle) -> upstream_hyphae
      -> upstream hyphae slow down spawning
      -> buffer pressure releases
```

### Positive Feedback (Growth)
```
Rule: if (task_queue_depth > threshold)
        emit signal(grow) -> relay:birth
      -> relay spawns new worker hyphae
      -> task queue depletes
```

### Resonance (Synchronization)
```
Rule: on signal(heartbeat)
        emit signal(heartbeat) -> neighbors
      -> heartbeat propagates through network
      -> all hyphae synchronize on rhythm
```

---

## Failure & Recovery

### Node Failure
```
Hyphal:A fails
  └─> Sockets to/from A are marked dead
  └─> Health monitor detects loss
  └─> Incoming signals to A redirect via alternate routes (if available)
  └─> If no routes: signal is dropped with "dissonance" event
```

### Network Partition
```
Network splits into two groups (A, B)
  └─> Signals can't cross partition
  └─> Each partition runs independently
  └─> If hyphae query state of other partition: return cached/default
  └─> When partition heals: merge state using conflict resolution rules
```

### Graceful Degradation
```
As hyphae fail:
  └─> Critical paths remain active (redundancy)
  └─> Non-critical paths lose service
  └─> Network operates at reduced capacity
  └─> Health monitor alerts operator
```

---

## Time & Causality

### Logical Time
```
Each signal carries a sequence number and generation ID.
A receives signal from B with seq=42
  └─> A knows this signal was generated after seq=41
  └─> Can detect out-of-order delivery
  └─> Can reconstruct causal relationships
```

### Real Time (Optional)
```
Each cycle can be timestamped with wall-clock time.
Useful for:
  - Deadline-driven computation
  - Real-time constraint checking
  - Performance monitoring
```

### Tidal Time
```
Independent of wall-clock.
Hyphae measure time in cycles, not seconds.
100 cycles at high frequency ≠ 100 cycles at low frequency.
Decouples program logic from real-time pressure.
```

---

## Observability & Debugging

### Real-Time Network Visualization
```
Show live graph:
  - Hyphae (nodes, colored by health)
  - Sockets (edges, thickness = throughput)
  - Signal flow (animated particles)
  - Relays (routing hubs)
```

### Signal Tracing
```
Enable tracing on any frequency:
  - Log all signals of type X
  - Show path taken through network
  - Record latency per hop
  - Detect lost or delayed signals
```

### Health Dashboard
```
Monitor per hyphal agent:
  - Vitality score
  - Signal queue depth
  - State size
  - Emission rate
  - Dissonance events (anomalies)
```

---

## Example Execution Trace

```
CYCLE 1:
  [SENSE]
    Hyphal:A receives signal(start, value=10)
  [ACT]
    A matches rule: "if start then emit (work, value/2) and spawn B"
    A emits signal(work, value=5) -> Hyphal:B
    A emits signal(coordinate:growth) -> relay:birth
  [REST]
    A reports health=excellent

  Relay:birth creates Hyphal:B'

CYCLE 2:
  [SENSE]
    Hyphal:B receives signal(work, value=5)
    Hyphal:B' has no signals
  [ACT]
    B matches rule: "if work and value>0 then emit (result, value*2)"
    B emits signal(result, value=10) -> FruitingBody:output
    B' is idle
  [REST]
    B reports health=good
    B' reports health=dormant

CYCLE 3:
  [SENSE]
    FruitingBody:output has signal(result, value=10)
  [ACT]
    Output delivers signal to external consumer
  [REST]
    Network is quiet
```

---

## Summary

The Mycelial execution model is:
- **Decentralized**: No central scheduler deciding what hyphae do
- **Asynchronous**: Hyphae operate at their own pace within cycle synchronization
- **Resilient**: Redundancy and feedback loops enable automatic recovery
- **Observable**: Rich diagnostics without intrusive instrumentation
- **Bio-inspired**: Operates like an organism, not a machine

