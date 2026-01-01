# Mycelial Quick Reference
## A Cheat Sheet for Syntax & Common Patterns

---

## Basics

### Define a Frequency

```mycelial
frequency task {
  data: string
  priority: u32
}
```

### Define a Hyphal

```mycelial
hyphal worker {
  state {
    count: u32
  }

  on signal(task, t) {
    state.count = state.count + 1
    emit result { data: state.count }
  }
}
```

### Create a Network

```mycelial
network MyNetwork {
  frequencies {
    task { data: string }
    result { data: i64 }
  }

  hyphae {
    hyphal worker {
      state { count: u32 }
      on signal(task, t) {
        emit result { data: 42 }
      }
    }
  }

  topology {
    fruiting_body input
    fruiting_body output

    spawn worker as W1
    socket input -> W1 (frequency: task)
    socket W1 -> output (frequency: result)
  }
}
```

---

## Signal Handling

### Receive a Signal

```mycelial
on signal(task, t) {
  # t is now bound to the signal payload
  state.count = state.count + 1
}
```

### Emit a Signal

```mycelial
emit result { data: 42 }
```

### Multiple Emissions

```mycelial
on signal(task, t) {
  emit ack { }              # Simple signal
  emit work { data: t.data }
  emit metric { count: 1 }
}
```

### Pattern Matching with Guards

```mycelial
on signal(task, t) where t.priority > 5 {
  # Only handle high-priority tasks
  emit urgent { payload: t.data }
} else if signal(task, t) {
  # Handle regular tasks
  emit normal { payload: t.data }
}
```

---

## State Management

### Initialize State with Values

```mycelial
state {
  counter: u32 = 0
  queue: queue<string>
  results: vec<i64>
  mapping: map<string, i64>
}
```

### Read State

```mycelial
if state.counter > 10 {
  emit alert { }
}
```

### Modify State

```mycelial
state.counter = state.counter + 1
state.queue.push("item")
state.results.clear()
```

---

## Conditionals

### Simple If

```mycelial
if x > 0 {
  emit positive { }
}
```

### If-Else

```mycelial
if x > 0 {
  emit positive { }
} else {
  emit non_positive { }
}
```

### If-Else-If Chain

```mycelial
if x > 10 {
  emit high { }
} else if x > 0 {
  emit medium { }
} else {
  emit low { }
}
```

---

## Control Flow

### Lifecycle: Spawn New Agent

```mycelial
on signal(grow) {
  spawn worker as new_worker
  report action: "spawned"
}
```

### Lifecycle: Die Gracefully

```mycelial
on signal(terminate) {
  report action: "terminating"
  die
}
```

### Periodic Tasks

```mycelial
on cycle 10 {
  # Runs every 10 cycles
  emit heartbeat { }
}
```

### Cleanup at End of Cycle

```mycelial
on rest {
  state.queue.drain()
  report health: "ready"
}
```

---

## Network Topology

### Define Entry/Exit Points

```mycelial
topology {
  fruiting_body input
  fruiting_body output
}
```

### Spawn Agents

```mycelial
spawn worker as W1
spawn worker as W2
spawn aggregator as A1
```

### Connect with Sockets

```mycelial
socket input -> W1 (frequency: task)
socket W1 -> A1 (frequency: result)
socket A1 -> output (frequency: result)
```

### Broadcast to Multiple Agents

```mycelial
socket coordinator -> * (frequency: broadcast)
  # Sends to all connected hyphae
```

### Multiple Sockets Same Agents

```mycelial
socket W1 -> A1 (frequency: result)
socket W1 -> A1 (frequency: metric)
  # Different frequencies on same path
```

---

## Data Types

### Primitives

```mycelial
u32        # Unsigned 32-bit integer
i64        # Signed 64-bit integer
f64        # 64-bit floating point
string     # Text
binary     # Raw bytes
boolean    # true or false
```

### Collections

```mycelial
vec<i64>          # Dynamic array
queue<string>     # FIFO queue
map<string, i64>  # Key-value map
```

### Custom Types (via Frequencies)

```mycelial
frequency person {
  name: string
  age: u32
}

# Then use 'person' as a type
on signal(data, p: person) {
  emit summary { name: p.name, age: p.age }
}
```

---

## Functions & Expressions

### Arithmetic

```mycelial
x + y
x - y
x * y
x / y
x % y
```

### Comparison

```mycelial
x == y
x != y
x > y
x < y
x >= y
x <= y
```

### Logic

```mycelial
x && y      # AND
x || y      # OR
!x          # NOT
```

### Field Access

```mycelial
signal.data
state.counter
person.name
```

### Built-in Functions (Examples)

```mycelial
len(vec)              # Length of collection
sum(vec<i64>)         # Sum of numbers
mean(vec<f64>)        # Average
format("x={}", val)   # String formatting
now()                 # Current timestamp
```

---

## Configuration

### Set Runtime Parameters

```mycelial
config {
  cycle_period_ms: 100
  max_buffer_size: 1000
  enable_health_monitoring: true
}
```

---

## Common Patterns

### Request-Response

**Sender:**
```mycelial
on signal(query, q) {
  emit request { id: next_id(), payload: q.data }
}

on signal(response, r) {
  emit complete { result: r.data }
}
```

**Responder:**
```mycelial
on signal(request, req) {
  let answer = lookup(req.payload)
  emit response { id: req.id, data: answer }
}
```

### Fan-Out / Fan-In

**Distributor:**
```mycelial
on signal(task, t) {
  emit work { id: 1, payload: t.data }
  emit work { id: 2, payload: t.data }
  emit work { id: 3, payload: t.data }
}
```

**Aggregator:**
```mycelial
state {
  responses: map<u32, i64>
  expected: u32 = 3
}

on signal(work_done, w) {
  state.responses[w.id] = w.result
  if len(state.responses) == state.expected {
    emit final { value: sum(state.responses) }
    state.responses = {}
  }
}
```

### Pipeline

```mycelial
topology {
  fruiting_body input
  fruiting_body output

  spawn stage1 as S1
  spawn stage2 as S2
  spawn stage3 as S3

  socket input -> S1 (frequency: data)
  socket S1 -> S2 (frequency: data)
  socket S2 -> S3 (frequency: data)
  socket S3 -> output (frequency: data)
}
```

### Load Balancing

```mycelial
topology {
  fruiting_body tasks
  fruiting_body results

  spawn worker as W1
  spawn worker as W2
  spawn worker as W3
  spawn balancer as LB

  socket tasks -> LB (frequency: task)
  socket LB -> W1 (frequency: task)
  socket LB -> W2 (frequency: task)
  socket LB -> W3 (frequency: task)
  socket W1 -> results (frequency: result)
  socket W2 -> results (frequency: result)
  socket W3 -> results (frequency: result)
}
```

**Balancer logic:**
```mycelial
state {
  queue: queue<task>
  worker_load: map<string, u32>
}

on signal(task, t) {
  state.queue.push(t)
  route_next()
}

on signal(worker_ready, w) {
  state.worker_load[w.id] = 0
  route_next()
}

def route_next() {
  if state.queue.len > 0 {
    let task = state.queue.pop()
    let worker = pick_least_loaded()
    emit task { payload: task } -> worker
    state.worker_load[worker] = state.worker_load[worker] + 1
  }
}
```

### Health Monitoring

```mycelial
on signal(heartbeat) {
  state.cycles = state.cycles + 1

  if state.cycles > 100 {
    report health: "degraded"
    die
  }

  emit heartbeat { } -> neighbors
}
```

### Consensus (Simple Voting)

```mycelial
state {
  votes: map<string, u32>
  vote_threshold: u32 = 3
}

on signal(vote, v) {
  state.votes[v.choice] = state.votes[v.choice] + 1

  if state.votes[v.choice] >= state.vote_threshold {
    emit decision { choice: v.choice }
  }
}
```

---

## Error Handling

### Check and Respond

```mycelial
on signal(task, t) {
  if is_valid(t.data) {
    emit result { data: process(t.data) }
  } else {
    emit error { message: "Invalid input", code: 400 }
  }
}
```

### Fallback via Relay

Instead of explicit try/catch, the network **routes around failures**:

```mycelial
socket primary -> destination (frequency: result)
socket backup -> destination (frequency: result)
  # Both can send; destination receives from either
```

---

## Comments

```mycelial
# Single line comment

/*
Multi-line comment
can span multiple
lines
*/

on signal(task, t) {
  # Comment inline
  state.count = state.count + 1
}
```

---

## Summary Table

| Concept | Syntax | Example |
|---------|--------|---------|
| Frequency | `frequency NAME { fields }` | `frequency task { data: string }` |
| Hyphal | `hyphal NAME { state, rules }` | `hyphal worker { ... }` |
| State | `state { fields }` | `state { count: u32 = 0 }` |
| Signal In | `on signal(freq, binding)` | `on signal(task, t) { ... }` |
| Signal Out | `emit freq { fields }` | `emit result { data: 42 }` |
| Conditional | `if expr { } else { }` | `if x > 0 { ... }` |
| Socket | `socket src -> dst (frequency)` | `socket input -> W1 (frequency: task)` |
| Spawn | `spawn type as name` | `spawn worker as W1` |
| Die | `die` | `die` |
| Report | `report metric: value` | `report health: "ok"` |
| Config | `config { key: value }` | `config { cycle_period_ms: 100 }` |

---

## Style Guide (Recommendations)

```mycelial
# Use snake_case for identifiers
hyphal my_worker { }

# Indent with 2 spaces
hyphal worker {
  state {
    count: u32
  }

  on signal(task, t) {
    # 4 spaces for nested logic
    if state.count > 10 {
      emit alert { }
    }
  }
}

# Name signals with verb or noun clarity
emit task_complete { }  # What happened
emit error { }          # Error state

# Order rules: handle common cases first, edge cases last
on signal(task, t) where is_valid(t) { }
on signal(task, t) { }
on rest { }
```

---

## Next Steps

- **Try the examples**: Copy a pattern and modify it
- **Build a small network**: Start with 2-3 hyphae and expand
- **Read the examples** in `07-EXAMPLES/` once they're written
- **Experiment with patterns**: Fan-out/fan-in, pipelines, consensus

