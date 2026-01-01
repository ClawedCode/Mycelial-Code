# Mycelial Formal Grammar
## BNF Specification for Lexical and Syntactic Analysis

---

## Overview

This grammar specifies the complete syntax of Mycelial. It's written in Extended Backus-Naur Form (EBNF) with:
- `|` for alternatives
- `*` for zero or more repetitions
- `+` for one or more repetitions
- `?` for optional elements
- `( )` for grouping
- `{ }` for user-provided content (semantic actions)

---

## Top-Level Structure

```ebnf
Program ::= (NetworkDef | Frequency)*

NetworkDef ::= 'network' IDENTIFIER '{'
                 Frequencies?
                 Hyphae?
                 Topology?
                 Config?
               '}'

Frequencies ::= 'frequencies' '{'
                  (Frequency)*
                '}'

Frequency ::= IDENTIFIER '{' (Field)* '}'

Field ::= IDENTIFIER ':' Type

Hyphae ::= 'hyphae' '{' (HyphalDef)+ '}'

HyphalDef ::= 'hyphal' IDENTIFIER '{'
                State?
                (Rule)+
              '}'

State ::= 'state' '{' (StateField)* '}'

StateField ::= IDENTIFIER ':' Type ('=' Literal)?

Rule ::= RuleHead RuleBody

RuleHead ::= 'on' RuleType

RuleType ::= SignalMatch | 'rest' | 'cycle' NUMBER

SignalMatch ::= 'signal' '(' IDENTIFIER (',' IDENTIFIER)? ('where' Predicate)? ')'

RuleBody ::= '{' (Statement)* '}'

Topology ::= 'topology' '{'
               (TopologyStatement)*
             '}'

TopologyStatement ::= FruitingBody
                    | Spawn
                    | SocketDef

FruitingBody ::= 'fruiting_body' IDENTIFIER

Spawn ::= 'spawn' IDENTIFIER 'as' IDENTIFIER

SocketDef ::= 'socket' Path '->' Path ('(' 'frequency' ':' IDENTIFIER ')')?

Path ::= IDENTIFIER | '*'

Config ::= 'config' '{' (ConfigItem)* '}'

ConfigItem ::= IDENTIFIER ':' Literal
```

---

## Expressions & Statements

### Statements

```ebnf
Statement ::= Assignment
            | Conditional
            | Emit
            | Report
            | Spawn
            | Die

Assignment ::= 'let'? IDENTIFIER '=' Expression
             | Path '=' Expression

Conditional ::= 'if' Expression '{' (Statement)* '}'
                ('else' 'if' Expression '{' (Statement)* '}' )*
                ('else' '{' (Statement)* '}')?

Emit ::= 'emit' IDENTIFIER '{' (EmitField)* '}'

EmitField ::= IDENTIFIER ':' Expression (',' | ε)

Report ::= 'report' IDENTIFIER ':' Literal

Spawn ::= 'spawn' IDENTIFIER 'as' IDENTIFIER

Die ::= 'die'
```

### Expressions

```ebnf
Expression ::= LogicalOr

LogicalOr ::= LogicalAnd ('||' LogicalAnd)*

LogicalAnd ::= Equality ('&&' Equality)*

Equality ::= Comparison (('==' | '!=') Comparison)*

Comparison ::= Addition (('>' | '<' | '>=' | '<=') Addition)*

Addition ::= Multiplication (('+' | '-') Multiplication)*

Multiplication ::= Unary (('*' | '/' | '%') Unary)*

Unary ::= ('!' | '-')? Primary

Primary ::= Literal
          | IDENTIFIER
          | FunctionCall
          | FieldAccess
          | '(' Expression ')'

Literal ::= NUMBER
          | STRING
          | BOOLEAN
          | '{' (Field)* '}'

FunctionCall ::= IDENTIFIER '(' (Expression (',' Expression)*)? ')'

FieldAccess ::= IDENTIFIER ('.' IDENTIFIER)+

Predicate ::= Expression (('&&' | '||') Expression)*
```

### Types

```ebnf
Type ::= PrimitiveType
       | GenericType
       | CustomType

PrimitiveType ::= 'u32'
                | 'i64'
                | 'f64'
                | 'string'
                | 'binary'
                | 'boolean'

GenericType ::= ('vec' | 'queue' | 'map') '<' Type (',' Type)? '>'

CustomType ::= IDENTIFIER
```

---

## Tokens & Lexical Rules

### Identifiers and Keywords

```ebnf
IDENTIFIER ::= [a-zA-Z_][a-zA-Z0-9_]*

KEYWORD ::= 'network' | 'frequencies' | 'hyphae' | 'hyphal'
          | 'state' | 'on' | 'signal' | 'emit' | 'report'
          | 'spawn' | 'fruiting_body' | 'socket' | 'topology'
          | 'config' | 'where' | 'if' | 'else' | 'let'
          | 'die' | 'rest' | 'cycle' | 'frequency'
          | 'u32' | 'i64' | 'f64' | 'string' | 'binary' | 'boolean'
          | 'vec' | 'queue' | 'map'
          | 'true' | 'false'

# Identifiers cannot be keywords
IDENTIFIER ::= (?!KEYWORD)[a-zA-Z_][a-zA-Z0-9_]*
```

### Literals

```ebnf
NUMBER ::= [0-9]+ ('.' [0-9]+)?

STRING ::= '"' ([^"\\] | '\\' . )* '"'
         | ''' ([^'\\] | '\\' . )* '''

BOOLEAN ::= 'true' | 'false'

WHITESPACE ::= [ \t\n\r]+

COMMENT ::= '#' [^\n]* '\n'
          | '/*' . '*/'
```

### Operators & Delimiters

```ebnf
ARROW ::= '->'

OPERATOR ::= '+' | '-' | '*' | '/' | '%'
           | '==' | '!=' | '<' | '>' | '<=' | '>='
           | '&&' | '||' | '!'
           | '='

DELIMITER ::= '{' | '}' | '(' | ')' | '[' | ']'
            | ',' | ':' | ';' | '.' | '@' | '*'
```

---

## Precedence & Associativity

### Operator Precedence (highest to lowest)

```
1. Primary            ( ), ., [], Literals, Identifiers
2. Unary              !, -, +
3. Multiplicative     *, /, %
4. Additive           +, -
5. Relational         <, >, <=, >=
6. Equality           ==, !=
7. Logical AND        &&
8. Logical OR         ||
9. Assignment         =
```

### Associativity

```
Left-associative:  +, -, *, /, %, <, >, <=, >=, ==, !=, &&, ||
Right-associative: =, !
```

---

## Error Recovery

When a parsing error occurs, the parser should:

1. **Report the error** at the current token with expected alternatives
2. **Skip tokens** until a synchronization point
3. **Continue parsing** from the next valid construct

Synchronization points:
- Start of a new top-level definition (`network`, `frequency`, `hyphal`)
- Start of a new statement (after `{` or `;`)
- End of a block (`}`)

---

## Context-Free Grammar (Simplified)

For those implementing a parser, here's the simplified CFG:

```
Program         → (Network)*
Network         → NETWORK IDENT LBRACE FreqSection HyphSection TopoSection ConfigSection RBRACE
FreqSection     → FREQUENCIES LBRACE (Frequency)* RBRACE
Frequency       → IDENT LBRACE (Field)* RBRACE
Field           → IDENT COLON Type
HyphSection     → HYPHAE LBRACE (Hyphal)+ RBRACE
Hyphal          → HYPHAL IDENT LBRACE State? (Rule)+ RBRACE
State           → STATE LBRACE (StateField)* RBRACE
StateField      → IDENT COLON Type (ASSIGN Literal)?
Rule            → RuleHead LBRACE (Stmt)* RBRACE
RuleHead        → ON (SignalMatch | REST | CycleSpec)
SignalMatch     → SIGNAL LPAREN IDENT (COMMA IDENT)? (WHERE Expr)? RPAREN
Stmt            → Assignment | Conditional | Emit | Report | Spawn | Die
TopoSection     → TOPOLOGY LBRACE (TopoStmt)* RBRACE
TopoStmt        → FruitingBody | Spawn | Socket
ConfigSection   → CONFIG LBRACE (ConfigItem)* RBRACE
```

---

## Example Parse Tree

Here's an example of how the weather network would be parsed:

```
Network
├── IDENT: "WeatherMonitor"
├── Frequencies
│   ├── Frequency: "reading"
│   │   ├── Field: "temperature" : f64
│   │   ├── Field: "humidity" : f64
│   │   └── Field: "location" : string
│   ├── Frequency: "alert"
│   │   ├── Field: "message" : string
│   │   └── Field: "severity" : u32
│   └── Frequency: "sync"
├── Hyphae
│   ├── Hyphal: "sensor"
│   │   ├── State
│   │   │   ├── StateField: "last_reading" : reading
│   │   │   └── StateField: "failure_count" : u32 = 0
│   │   ├── Rule (on signal(sync))
│   │   │   ├── Statement: Emit
│   │   │   │   └── reading { ... }
│   │   │   └── Statement: Assignment
│   │   │       └── state.failure_count = 0
│   │   └── Rule (on signal(alert, a) where a.severity > 3)
│   │       └── Statement: Report
│   ├── Hyphal: "analyzer"
│   │   └── ...
│   └── Hyphal: "alerter"
│       └── ...
└── Topology
    ├── FruitingBody: "heartbeat_source"
    ├── FruitingBody: "notification_output"
    ├── Spawn: sensor as S1
    ├── Spawn: sensor as S2
    └── Socket: heartbeat_source -> S1 (frequency: sync)
```

---

## Special Cases & Disambiguation

### 1. Distinguishing `on signal(...)` from `on signal(...) where`

```ebnf
RuleHead ::= 'on' ('signal' LPAREN SignalPattern OptionalWhere RPAREN | 'rest' | CycleClause)

SignalPattern ::= IDENTIFIER (',' IDENTIFIER)?

OptionalWhere ::= ('where' Expr)?
```

Resolution: Always parse the entire parenthesized expression first, then check for `where`.

### 2. Statement vs Expression Ambiguity

In contexts like `emit`, we parse field names followed by `:`, which is distinct from comparisons:

```ebnf
Emit ::= 'emit' IDENT LBRACE (EmitField)* RBRACE

EmitField ::= IDENT ':' Expression
```

Resolution: In the `emit` context, an identifier followed by `:` is always a field assignment, not a comparison.

### 3. Type vs Variable Reference Ambiguity

When you see `IDENTIFIER` in a statement, is it a variable reference or a type name?

```ebnf
Statement ::= 'let' IDENT '=' Expr  # Assignment
            | Path '=' Expr           # Update existing

Path ::= IDENT ('.' IDENT)*
```

Resolution: If preceded by `let`, it's a new binding. Otherwise, it references an existing variable.

---

## Grammar Validation Checklist

- [ ] All non-terminals are reachable from the start symbol
- [ ] All non-terminals can derive a terminal string (no infinite recursion)
- [ ] Operator precedence is correctly represented
- [ ] No ambiguities in shift/reduce conflicts
- [ ] Whitespace and comments are properly handled
- [ ] Error recovery points are well-defined

---

## Next Steps

1. **Implement a Lexer** - Tokenize input according to the token rules
2. **Implement a Parser** - Build a recursive descent or LR parser
3. **Create an AST** - Define Abstract Syntax Tree node types
4. **Add Type Checking** - Semantic analysis pass
5. **Test on Examples** - Validate against real programs

