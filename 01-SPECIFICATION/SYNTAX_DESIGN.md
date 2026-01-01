# Mycelial Syntax Design
## A Notation for Bio-Inspired Networks

---

## Philosophy

The syntax should:
- **Mirror the metaphor**: Hyphae, signals, growth, rest—not "threads," "messages," "scheduling"
- **Prioritize clarity**: Network topology should be visually obvious
- **Feel natural**: Reading it should evoke the biological system, not traditional programming
- **Stay minimal**: Every syntax element earns its place
- **Support composition**: Build complex systems from simple pieces

---

## Level 1: The Fundamentals

### 1.1 Frequency Definition

A frequency is a signal type. Define what messages mean.

```mycelial
frequency task {
  data: string
  priority: u32
}

frequency result {
  data: i64
}

frequency heartbeat {
  # Empty payload—just the presence of the signal matters
}

frequency error {
  message: string
  code: u32
}
```

**Notes:**
- Frequencies are named types for signals
- `data` field holds the payload
- Additional fields are metadata
- Use for pattern matching and validation

### 1.2 Hyphal Definition

Define an agent: its state, and the rules it follows.

```mycelial
hyphal worker {
  state {
    queue: queue<task>
    processed: u64
  }

  on signal(task, t) {
    if state.queue.len < 10 {
      state.queue.push(t)
      emit result { data: 42 }
    } else {
      emit error { message: "queue full", code: 429 }
    }
  }

  on signal(heartbeat) {
    # Just log vitality
    report health: "alive"
  }

  on rest {
    # Optional: cleanup at end of cycle
    state.queue.drain()
  }
}
```

**Rules:**
- `state {}` block: mutable local state (analogous to fields in a struct)
- `on signal(frequency, binding) {}`: pattern match for incoming signals
- `on rest {}`: optional cleanup at end of cycle
- `emit`: send a signal to connected hyphae
- `report`: send diagnostics to health monitor

### 1.3 Socket Definition

Connect hyphae and define signal flow.

```mycelial
socket input -> worker (frequency: task)
socket worker -> aggregator (frequency: result)
socket aggregator -> output (frequency: result)
```

**Notes:**
- Unidirectional: `source -> destination`
- Must specify the frequency flowing on this socket
- Multiple sockets can connect the same pair with different frequencies
- Sockets have implicit buffering (backpressure handled by runtime)

---

## Level 2: Network Assembly

### 2.1 Full Network Definition

Bring it together: topology + hyphae + sockets.

```mycelial
network TaskProcessor {
  # Define frequencies used in this network
  frequencies {
    task { data: string, priority: u32 }
    result { data: i64 }
    error { message: string, code: u32 }
  }

  # Define hyphal agents
  hyphae {
    hyphal worker {
      state {
        queue: queue<task>
        processed: u64
      }

      on signal(task, t) {
        state.queue.push(t)
        state.processed += 1

        # Do some work
        let output = process(t.data)
        emit result { data: output }
      }

      on signal(error, e) {
        # Handle errors from downstream
        report health: "degraded"
      }
    }

    hyphal aggregator {
      state {
        results: vec<i64>
      }

      on signal(result, r) {
        state.results.push(r.data)
        if state.results.len == 10 {
          emit result { data: sum(state.results) }
          state.results = []
        }
      }
    }
  }

  # Define topology
  topology {
    # Fruiting bodies (external I/O)
    fruiting_body input
    fruiting_body output

    # Hyphae instances (can spawn multiple of same type)
    spawn worker as W1
    spawn worker as W2
    spawn aggregator as A1

    # Socket connections
    socket input -> W1 (frequency: task)
    socket input -> W2 (frequency: task)
    socket W1 -> A1 (frequency: result)
    socket W2 -> A1 (frequency: result)
    socket A1 -> output (frequency: result)
  }

  # Optional: Configuration
  config {
    cycle_period_ms: 100
    max_buffer_size: 1000
    enable_health_monitoring: true
  }
}
```

### 2.2 Nested Networks (Composition)

A network can contain other networks. Create fractal hierarchies.

```mycelial
network Pipeline {
  frequencies {
    data { payload: binary }
    status { message: string }
  }

  hyphae {
    # A sub-network acts like a single hyphal agent
    network ProcessingStage {
      # ... internal definition
    }
  }

  topology {
    fruiting_body input
    fruiting_body output

    spawn ProcessingStage as stage1
    spawn ProcessingStage as stage2

    socket input -> stage1 (frequency: data)
    socket stage1 -> stage2 (frequency: data)
    socket stage2 -> output (frequency: data)
  }
}
```

---

## Level 3: Advanced Features

### 3.1 Pattern Matching

Match on signal fields to route logic.

```mycelial
on signal(task, t) where t.priority > 8 {
  # High-priority task—do it first
  emit result { data: urgent_process(t.data) }
} else if signal(task, t) {
  # Regular task
  emit result { data: normal_process(t.data) }
}
```

### 3.2 Conditional Emission

Emit different signals based on state.

```mycelial
on signal(query, q) {
  let answer = lookup(q.key)

  if answer.found {
    emit result { data: answer.value }
  } else {
    emit error { message: "not found", code: 404 }
  }
}
```

### 3.3 Multiple Emit

Send multiple signals in one rule.

```mycelial
on signal(task, t) {
  emit ack { }  # Acknowledge receipt
  emit work { payload: t.data }  # Forward the work
  emit metric { count: 1 }  # Report activity
}
```

### 3.4 Broadcast Sockets

Send to multiple destinations.

```mycelial
socket coordinator -> * (frequency: broadcast)
  # Asterisk means "all connected hyphae"
```

### 3.5 Lifecycle Hooks

Control when hyphae spawn, split, or die.

```mycelial
on signal(grow) {
  # Signal to spawn a new sibling
  spawn new_hyphal as worker_N
  report action: "spawned"
}

on signal(shrink) {
  # Signal to die gracefully
  report action: "dying"
  die
}

# Optional: periodically check health
on cycle N {
  if state.health < 10 {
    die
  }
}
```

---

## Level 4: Syntax Summary

### Keywords

```
network, hyphae, frequencies, topology
hyphal, state, on, signal, emit, report
spawn, fruiting_body, socket, frequency
config, die, if, else, where
```

### Operators

```
->     : Socket direction (source to dest)
:      : Type annotation or field separator
,      : List separator
{}     : Block/scope
.      : Field access
*      : Broadcast/wildcard
@      : Location annotation (optional for spatial networks)
=      : Assignment
```

### Types

```
u32, i64, string, binary, boolean
queue<T>, vec<T>, map<K, V>
Custom types via frequency definitions
```

### Built-in Functions

```
emit(frequency, payload)    : Send signal
report(metric, value)       : Health status
spawn(hyphal_type, name)    : Create new agent
die                         : Graceful termination
sum(vec), len(queue), etc.  : Standard library
```

---

## Level 5: A Complete Example

### Weather Monitoring Network

```mycelial
network WeatherMonitor {
  frequencies {
    reading {
      temperature: f64
      humidity: f64
      location: string
      timestamp: u64
    }

    alert {
      message: string
      severity: u32  # 1=low, 5=critical
    }

    sync {
      # Empty—just a heartbeat
    }
  }

  hyphae {
    hyphal sensor {
      state {
        last_reading: reading
        failure_count: u32
      }

      on signal(sync) {
        # Periodically take a reading
        let temp = read_temperature()
        let humidity = read_humidity()

        emit reading {
          temperature: temp,
          humidity: humidity,
          location: "station-1",
          timestamp: now()
        }

        state.failure_count = 0
      }

      on signal(alert, a) where a.severity > 3 {
        # Log critical issues
        report health: "degraded"
        state.failure_count += 1
      }
    }

    hyphal analyzer {
      state {
        readings: vec<reading>
        threshold_high: f64 = 35.0
        threshold_low: f64 = -10.0
      }

      on signal(reading, r) {
        state.readings.push(r)

        # Threshold detection
        if r.temperature > state.threshold_high {
          emit alert {
            message: format("High temp: {}", r.temperature),
            severity: 4
          }
        } else if r.temperature < state.threshold_low {
          emit alert {
            message: format("Low temp: {}", r.temperature),
            severity: 4
          }
        }

        # Periodically summarize
        if state.readings.len >= 100 {
          let avg_temp = mean(state.readings.map(r.temperature))
          emit summary {
            avg: avg_temp,
            count: state.readings.len
          }
          state.readings = []
        }
      }
    }

    hyphal alerter {
      state {
        active_alerts: vec<alert>
      }

      on signal(alert, a) {
        state.active_alerts.push(a)

        # Deduplicate similar alerts
        if count_similar(state.active_alerts, a) < 3 {
          emit notification {
            message: a.message,
            channel: "email"
          }
        }

        # Clear old alerts periodically
        state.active_alerts.retain(a.age < 3600)
      }
    }
  }

  topology {
    fruiting_body heartbeat_source
    fruiting_body notification_output

    spawn sensor as S1
    spawn sensor as S2
    spawn sensor as S3
    spawn analyzer as A1
    spawn alerter as ALT1

    # Heartbeat drives sensors
    socket heartbeat_source -> S1 (frequency: sync)
    socket heartbeat_source -> S2 (frequency: sync)
    socket heartbeat_source -> S3 (frequency: sync)

    # Sensors feed analyzer
    socket S1 -> A1 (frequency: reading)
    socket S2 -> A1 (frequency: reading)
    socket S3 -> A1 (frequency: reading)

    # Analyzer feeds alerter
    socket A1 -> ALT1 (frequency: alert)

    # Alerts go to external system
    socket ALT1 -> notification_output (frequency: notification)
  }

  config {
    cycle_period_ms: 1000
    enable_health_monitoring: true
    max_buffer_size: 10000
  }
}
```

---

## Level 6: Syntax Variants to Consider

### Option A: Minimal (Current)
Keep syntax lean. Rely on inference and convention.

**Pros:**
- Easy to read
- Less ceremony
- Natural flow

**Cons:**
- Might be ambiguous in edge cases
- Harder to parse deterministically

### Option B: Explicit Types Everywhere
Require type annotations for all state and signals.

```mycelial
hyphal worker {
  state {
    queue: queue<task>
    count: i64
  }

  on signal(task: task_freq, t: task_freq) -> result {
    state.queue.push(t)
    state.count = state.count + 1
    emit result { data: 42 as i64 }
  }
}
```

**Pros:**
- Type-safe
- Self-documenting
- Compiler can catch errors early

**Cons:**
- Verbose
- Might obscure intent with noise

### Option C: Functional (Lisp-like)
Use S-expressions for rules.

```mycelial
(defhyphal worker
  (state (queue (queue task)) (count i64))
  (on-signal task (t)
    (push (state queue) t)
    (emit result (+ (state count) 1))))
```

**Pros:**
- Uniform syntax
- Easy to parse
- Macro-friendly

**Cons:**
- Less readable to non-Lisp programmers
- Feels detached from the domain

---

## Recommendation

**Use Option A (Minimal)** as the primary syntax.

**Rationale:**
- Matches the biological metaphor (simplicity, elegance)
- Easy to learn and read
- Inference can handle type checking
- Aligns with "ruthless simplicity" from the manifesto

Allow **Option B (Explicit Types)** as optional annotations for clarity where needed.

---

## Next Steps

1. **Create BNF Grammar** - Formal specification for parsing
2. **Design Error Messages** - What should the compiler say when syntax is wrong?
3. **Build a Lexer/Parser** - Implement the grammar in code
4. **Write Examples** - Validate syntax against real use cases
5. **Get Feedback** - Test readability and intuitiveness

