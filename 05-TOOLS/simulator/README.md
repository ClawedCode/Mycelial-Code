# Mycelial Simulator

A web-based interactive simulator for the Mycelial programming language. Parse, validate, and visualize .mycelial programs in real-time.

## Features

- **Parser**: Full recursive descent parser for .mycelial syntax
- **Semantic Analysis**: Type checking and topology validation
- **Runtime**: Executes tidal cycles (SENSE → ACT → REST)
- **Visualization**: Interactive D3.js network graph showing hyphae and signal flow
- **Step-by-Step Execution**: Debug programs cycle by cycle
- **Live Editing**: Edit .mycelial code and see results immediately

## Getting Started

### Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- No build step needed - pure vanilla JavaScript

### Installation

1. Open `index.html` in a web browser
2. Or run a local HTTP server:
   ```bash
   python3 -m http.server 8000
   # Then visit http://localhost:8000
   ```

## Usage

### Loading a Program

1. **Load Example**: Select an example from the dropdown menu
2. **Load File**: Click "Load File" to select a .mycelial file
3. **Drag & Drop**: Drag a .mycelial file onto the editor

### Parsing

1. Click the **Parse** button to parse and validate the program
2. Errors and warnings appear in the error panel
3. If successful, the network topology appears in the visualization

### Execution

1. **Step**: Execute one cycle at a time with the "Step" button
2. **Play**: Auto-play cycles with adjustable speed
3. **Pause**: Pause auto-play
4. **Reset**: Return to cycle 0

### Inspection

Click on a node (hyphal) in the network to view its current state in the inspector panel.

## Project Structure

```
simulator/
├── index.html              Main HTML file
├── styles/
│   ├── main.css           Global styles
│   ├── editor.css         Code editor styles
│   └── graph.css          Graph visualization styles
├── src/
│   ├── parser/
│   │   ├── lexer.js       Tokenization
│   │   ├── parser.js      Recursive descent parser
│   │   ├── ast.js         AST node definitions
│   │   └── source-map.js  Source location tracking
│   ├── analyzer/
│   │   ├── symbol-table.js    Symbol registration
│   │   ├── type-checker.js    Type validation
│   │   └── topology-validator.js  Topology validation
│   ├── runtime/
│   │   ├── scheduler.js       Tidal cycle execution
│   │   ├── hyphal-agent.js    Agent definition
│   │   ├── signal-router.js   Signal routing
│   │   └── evaluator.js       Expression evaluation
│   ├── visualizer/
│   │   ├── graph-renderer.js  D3.js visualization
│   │   ├── animation.js       Signal animations
│   │   └── state-inspector.js State inspection
│   └── ui/
│       ├── app.js         Main app controller
│       └── controls.js    UI control handlers
└── examples/              Symlink to example programs
```

## Architecture

### Data Flow

```
.mycelial Source
        ↓
    [Lexer] → Tokens
        ↓
    [Parser] → AST
        ↓
    [Analyzer] → Validated AST
        ↓
    [Runtime] ← → [Visualizer]
    (Scheduler)     (Graph + Inspector)
```

### Key Components

#### Lexer (`lexer.js`)
Tokenizes .mycelial source code into a stream of tokens.

**Input**: Source code string
**Output**: Array of Token objects

#### Parser (`parser.js`)
Recursive descent parser that builds an Abstract Syntax Tree.

**Input**: Token array
**Output**: NetworkNode (AST root)

#### Semantic Analyzer (`symbol-table.js`)
Validates symbol definitions, type consistency, and topology connectivity.

**Input**: AST
**Output**: Array of validation errors

#### Scheduler (`scheduler.js`)
Executes the tidal cycle model: SENSE → ACT → REST.

**Input**: AST
**Output**: Runtime state after each cycle

#### GraphRenderer (`graph-renderer.js`)
Uses D3.js to visualize the network topology and render live updates.

**Input**: Topology definition + runtime state
**Output**: Interactive SVG graph

## Execution Model

### Tidal Cycle

Each cycle consists of three phases:

1. **SENSE**: Deliver signals from socket buffers to agent inboxes
2. **ACT**: Agents process signals, match rules, emit new signals
3. **REST**: Cleanup, health reporting, signal routing

### Signal Flow

```
Agent A          Socket         Agent B
┌────────┐       buffer         ┌────────┐
│ outbox │ ──→ [signal list] ──→ │ inbox  │
└────────┘                       └────────┘
    ↑                                ↓
    │        Rule Matching           │
    │        & Execution             │
    └────────────────────────────────┘
```

## Example Program

```mycelial
network HelloWorld {
  frequencies {
    greeting { name: string }
    response { message: string }
  }

  hyphae {
    hyphal greeter {
      on signal(greeting, g) {
        emit response { message: format("Hello, {}!", g.name) }
      }
    }
  }

  topology {
    fruiting_body input
    fruiting_body output

    spawn greeter as G1

    socket input -> G1 (frequency: greeting)
    socket G1 -> output (frequency: response)
  }
}
```

## Testing

### Example Programs

1. **hello_world.mycelial** - Basic signal flow
2. **pipeline.mycelial** - 3-stage sequential processing
3. **map_reduce.mycelial** - Data parallelism
4. **distributed_search.mycelial** - Fan-out/fan-in
5. **consensus.mycelial** - Distributed voting

### Running Tests

1. Select each example from the dropdown
2. Click **Parse** - should succeed with no errors
3. Click **Step** multiple times - network should process signals
4. Observe graph updates and state changes

## Browser Support

- **Chrome**: ✅ Full support
- **Firefox**: ✅ Full support
- **Safari**: ✅ Full support (v13+)
- **Edge**: ✅ Full support

## Dependencies

**External Libraries** (loaded from CDN):
- D3.js v7: Graph visualization
- CodeMirror 5: Code editor

**No build tools required** - runs as pure JavaScript in the browser.

## Development

### Adding New Features

1. **New parser rules**: Extend `Parser` class in `parser.js`
2. **New validation rules**: Add methods to `SemanticAnalyzer` in `symbol-table.js`
3. **New runtime features**: Extend `Scheduler` in `scheduler.js`
4. **UI improvements**: Modify `MycelialApp` in `app.js`

### Debugging

1. Open browser DevTools (F12)
2. Check console for parse/runtime errors
3. Inspect `window.app` for current state
4. Use breakpoints in DevTools

## Performance

- **Parse Time**: <100ms for typical programs
- **Cycle Execution**: <10ms per cycle
- **Graph Rendering**: 60 FPS with <100 nodes
- **Memory**: ~5-10MB for typical programs

## Future Enhancements

- [ ] Signal tracing (follow a signal through the network)
- [ ] Timeline scrubbing (go back to previous cycles)
- [ ] Breakpoints on rules
- [ ] Export execution trace as JSON
- [ ] Comparative execution (side-by-side)
- [ ] Performance profiling
- [ ] Formal verification tools
- [ ] 3D visualization option

## Known Limitations

- Complex expressions in rules are simplified
- Nested state modifications need improvement
- Error recovery in parser could be more robust
- State serialization/checkpointing not yet implemented

## Contributing

This is an open-source educational tool. Contributions welcome!

## License

Part of the Mycelial Programming Language project.

---

**Last Updated**: December 29, 2025
**Version**: 0.1.0 (MVP)
