<div align="center">

# API Contract Guardian

### Detect breaking API contract changes before they reach consumers.

A VS Code extension that detects breaking API contract changes across Git revisions in JavaScript, TypeScript, and supported Python APIs.

[![Version](https://img.shields.io/badge/version-3.0.0-blue?style=for-the-badge)](#releases)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge\&logo=typescript\&logoColor=white)](https://www.typescriptlang.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge\&logo=javascript\&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![VS Code](https://img.shields.io/badge/VS%20Code-007ACC?style=for-the-badge\&logo=visualstudiocode\&logoColor=white)](https://code.visualstudio.com/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge\&logo=nodedotjs\&logoColor=white)](https://nodejs.org/)
[![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge\&logo=git\&logoColor=white)](https://git-scm.com/)
[![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](LICENSE)

**Git-aware API analysis · Repository-wide discovery · Cross-file routing · VS Code diagnostics**


</div>

---
## 📦 Installation

API Contract Guardian is available on the Visual Studio Marketplace.

### Install from VS Code

1. Open Visual Studio Code.
2. Open the Extensions panel using `Ctrl + Shift + X`.
3. Search for **API Contract Guardian**.
4. Select API Contract Guardian by **komallsingh**.
5. Click **Install**.

![Install API Contract Guardian from the VS Code Marketplace](images/marketplace-install.png)

You can also visit the [API Contract Guardian Marketplace page](https://marketplace.visualstudio.com/items?itemName=komallsingh.api-contract-guardian) to view the extension and install it.

### Install from VSIX

You can also download the `.vsix` file from the project's [GitHub Releases](https://github.com/komallsingh/api-contract-guardian/releases) and install it manually:

1. Open the Extensions panel in VS Code.
2. Click the **...** menu.
3. Select **Install from VSIX...**.
4. Choose the downloaded `.vsix` file.

---

## Overview

APIs often evolve faster than their consumers.

An endpoint may be removed, a response field may disappear, or a response type may change without an obvious signal to the developer working on the API.

**API Contract Guardian** analyzes API contracts across Git revisions and surfaces potentially breaking changes directly inside VS Code.

Instead of discovering compatibility problems at runtime, developers can identify contract changes while working on the codebase.

### Guardian detects

* Removed API endpoints
* Removed response fields
* Response field type changes
* Potentially affected JavaScript and TypeScript consumers
* Added, modified, and deleted API source files
* Cross-file Express router composition
* Nested router mounts
* JavaScript and TypeScript module relationships
* Static route discovery for supported FastAPI routers and Flask blueprints
* Python relative-import and package re-export relationships
* API contract differences across Git revisions

---

## What Problem Does It Solve?

Consider an API that originally returns:

```json
{
  "id": 1,
  "name": "Komal",
  "email": "komal@example.com"
}
```

If `email` is removed in a later revision, existing consumers that depend on that field may break even though the server still starts successfully.

Guardian uses the previous Git revision as a source of the previous API contract and compares it with the current repository.

The result is a development-time signal for potentially breaking API changes.

---

## Why API Contract Guardian?

### Git-aware

Git already contains previous versions of the source code.

Guardian uses Git revisions to derive and compare API contracts instead of requiring developers to manually maintain historical contracts.

### Static analysis

Guardian analyzes JavaScript, TypeScript, and a supported subset of Python source code rather than executing the application.

This allows contract analysis during development without requiring the API server to be running.

### Repository-wide discovery

V2 analyzes the repository as a connected system rather than treating every API source file independently.

An API can be distributed across multiple modules, imports, exports, routers, and mount points.

### Structure-based detection

Guardian does not depend on fixed endpoint names or variable names such as `app` or `router`.

It analyzes the structure and relationships of the source code to identify Express applications, routers, routes, and mounts.

---

# V1 — Core API Contract Detection

V1 established the foundation of Guardian: it inspects API source files for route definitions and response payloads, compares the previous and current Git revisions, and reports breaking contract changes directly in VS Code.

### V1 capabilities

* [x] Detect removed API endpoints
* [x] Detect removed response fields
* [x] Detect changed response field types
* [x] Extract response contracts from `res.json()` patterns
* [x] Identify potentially affected JavaScript and TypeScript consumers
* [x] Compare Git revisions
* [x] Report findings through the VS Code Problems panel
* [x] Support JavaScript and TypeScript source analysis
* [x] Perform file-level API contract comparison

```mermaid
flowchart LR
    A["Git revision"] --> B["API source files"]
    B --> C["Route detection"]
    C --> D["Response contract extraction"]
    D --> E["API contract model"]
    E --> F["Compare prior vs current contract"]
    F --> G["Breaking changes"]
    G --> H["Consumer analysis"]
    H --> I["VS Code diagnostics"]
```

V1 provided the baseline contract-comparison model that later versions extended to repository-wide discovery and route composition.

---

# V2 — Repository-Wide API Discovery

V2 expands Guardian from file-level analysis to repository-wide discovery. Instead of evaluating each API file in isolation, it indexes source files, resolves imports and exports, detects Express apps and routers, composes nested mounts, and compares the resulting API contracts across Git revisions.

### V2 capabilities

* [x] Repository-wide source discovery
* [x] Recursive JavaScript and TypeScript source discovery
* [x] Generated/dependency directory filtering
* [x] Cross-file module indexing
* [x] Relative import resolution
* [x] JavaScript and TypeScript extension resolution
* [x] `index.js` / `index.ts` module resolution
* [x] Default and named imports/exports
* [x] Express application and router detection
* [x] `express.Router()` detection
* [x] Route detection without fixed variable names
* [x] `app.use()`-style mount detection
* [x] Router-to-router mounts
* [x] Nested router composition
* [x] Multiple mounts of the same router
* [x] Final composed route paths
* [x] Repository-wide API contract discovery
* [x] Git revision comparison
* [x] Consumer impact analysis
* [x] VS Code diagnostics

```mermaid
flowchart TD
    A["Git revision"] --> B["Repository discovery"]
    B --> C["Source file loading"]
    C --> D["Module indexing + import resolution"]
    D --> E["Express app / router detection"]
    E --> F["Route + mount detection"]
    F --> G["Cross-file route composition"]
    G --> H["API contract extraction"]
    H --> I["Compare previous vs current contracts"]
    I --> J["Breaking changes"]
    J --> K["Consumer impact analysis"]
    K --> L["VS Code diagnostics"]
```

The major architectural change in V2 is that discovery happens across the repository before comparison, which allows Guardian to reason about APIs that span multiple files and router layers.

---

# V3 — Python Route Discovery

V3 adds static Python route discovery for supported FastAPI and Flask patterns. The repository-aware analysis can discover routes across related files where the routing structure is statically clear, including common FastAPI router composition and Flask blueprint-style registration patterns.

### V3 capabilities

* [x] Python file detection
* [x] FastAPI-style route detection for common decorator patterns
* [x] Flask-style route detection for common decorator patterns
* [x] Static route composition for supported repository patterns
* [x] Python contract extraction for supported route implementations
* [x] Git-aware comparison for supported Python APIs
* [x] Integration with the same VS Code diagnostics workflow

### Python static-analysis limitations

Python support is intentionally conservative and statically based. Guardian does not execute Python applications, and it does not attempt to resolve every possible dynamic framework pattern or runtime-generated route. Supported behavior is limited to the patterns that are reliably detectable in the source code, such as common FastAPI and Flask decorator usage and straightforward route composition. Dynamic imports, non-standard framework conventions, and highly dynamic Python routing may not be fully inferred.

```mermaid
flowchart LR
    A["Project scan"] --> B["Python source discovery"]
    B --> C["Decorator + route detection"]
    C --> D["FastAPI / Flask pattern matching"]
    D --> E["Repository-aware route composition"]
    E --> F["Python API contracts"]
    F --> G["Contract comparison"]
    G --> H["Breaking changes + diagnostics"]
```

Python support follows Guardian’s static-analysis model; it is not a full runtime Python API analysis engine.

---

# V1 → V2 → V3 Evolution

| Version | Primary focus | Key capabilities | Key constraint |
| ------- | ------------- | ---------------- | -------------- |
| V1 | Core contract detection | Route extraction, response-field comparison, Git-based diffing, VS Code diagnostics | File-level analysis |
| V2 | Repository-wide discovery | Cross-file module resolution, route composition, nested mounts, repository-wide contract discovery | JavaScript / TypeScript static analysis |
| V3 | Python route discovery | Supported FastAPI and Flask route discovery, repository-aware route composition, Python contract comparison | Static analysis only; not full dynamic Python runtime analysis |

The evolution is straightforward: V1 established the contract model, V2 expanded discovery across the repository, and V3 added supported Python patterns to the same comparison-and-diagnostics workflow.

---

# Core Architecture Workflow

```mermaid
flowchart TD
    A["Project scan"] --> B["Repository discovery"]
    B --> C["Source file loading"]
    C --> D["Language parser selection"]
    D --> E["JavaScript / TypeScript / Python analysis"]
    E --> F["Route + mount + import resolution"]
    F --> G["API contract extraction"]
    G --> H["Compare previous vs current contracts"]
    H --> I["Breaking change detection"]
    I --> J["Consumer impact analysis"]
    J --> K["VS Code diagnostics"]
```

---

# Example

## Contract Change

An API initially returns:

```json
{
  "id": 1,
  "name": "Komal",
  "email": "komal@example.com"
}
```

A later Git revision removes `email`.

Guardian compares the two contracts and reports:

```text
Response field "email" was removed from GET /api/v1/customers
```

If a statically detectable consumer accesses `data.email`, Guardian can additionally report potential consumer impact.

---

# V2 Example — Cross-File Express Router Composition

An Express endpoint can be declared in one file, mounted under a version prefix in another file, and then mounted under an application-wide prefix in the entry point. Guardian follows supported static imports and exports to compose these prefixes into the final API path.

The following example uses three files.

### 1. `server.ts` — mount the API router

The application mounts the API router under `/api`:

```typescript
import express from "express";
import apiRouter from "./routes/apiRoutes";

const app = express();

app.use("/api", apiRouter);
```

This contributes the `/api` prefix.

### 2. `routes/apiRoutes.ts` — mount the customer router

The API router imports the customer router by a named export, aliases it locally as `customers`, and mounts it under `/v1`:

```typescript
import express from "express";
import {
  customerRouter as customers
} from "./customerRoutes";

const apiRouter = express.Router();

apiRouter.use("/v1", customers);

export default apiRouter;
```

This contributes the `/v1` prefix. The import alias does not change which exported router Guardian resolves.

### 3. `routes/customerRoutes.ts` — declare the endpoint

The customer router defines the route and exports the router:

```typescript
import express from "express";

const customerRouter = express.Router();

customerRouter.get("/customers", (req, res) => {
  res.json({ id: 1 });
});

export { customerRouter };
```

This contributes the `/customers` route path.

### Composed endpoint

Guardian combines the mount prefixes from the first two files with the route path from the third file:

| Source | Path contribution |
| --- | --- |
| `server.ts` | `/api` |
| `routes/apiRoutes.ts` | `/v1` |
| `routes/customerRoutes.ts` | `/customers` |
| **Final endpoint** | **`GET /api/v1/customers`** |

The same composition applies to other supported HTTP methods declared on the customer router. For example, a `POST /customers` route in the third file becomes `POST /api/v1/customers`.

### What Guardian can resolve

This example reflects the cross-file patterns covered by the route-composition tests:

- Relative imports with default or named exports.
- Named imports that use a local alias.
- Nested router mounts across multiple files.
- Literal string mount prefixes and route paths.
- Multiple mounts of the same router, which produce a composed path for each mount.

Guardian performs static analysis; it does not start the Express application. Dynamic mount prefixes, runtime-generated routes, unresolved imports, and relationships that cannot be established from supported static import/export patterns may not be composed. When a mount cannot be resolved, Guardian does not invent a prefix; a route that can still be discovered may remain available under its local path.

# Supported API Patterns

## Express

Guardian currently supports statically detectable Express-style patterns including:

* `express()`
* `express.Router()`
* Express application routes
* Express router routes
* HTTP methods such as `get`, `post`, `put`, `patch`, and `delete`
* `res.json({...})`
* `app.use()`-style mounts
* Router-to-router mounts

## Modules

Guardian supports:

* Relative imports
* Default imports
* Named imports
* Default exports
* Named exports
* JavaScript/TypeScript extension resolution
* `index.js` / `index.ts` module resolution

## Route Composition

Guardian can compose routes across multiple mount levels.

For example:

```text
/api
  + /v1
      + /customers
```

becomes:

```text
/api/v1/customers
```

The same router can also be mounted at multiple paths.

---

# Git Comparison

Guardian uses Git revisions as the source of historical API contracts.

```text
Previous Git Revision
        |
        v
Previous API Contract

Current Git Revision
        |
        v
Current API Contract

        |
        v
Contract Comparison
        |
        v
Potential Breaking Changes
```

V2 performs repository-wide discovery for the revisions being compared.

This is important because an API route may depend on several source files, while only some of those files may have changed.

---

# Consumer Impact Analysis

Guardian can identify statically detectable JavaScript and TypeScript consumers that access changed response fields.

For example, if an API response field is removed and a consumer contains:

```javascript
data.email
```

Guardian can report:

```text
Potentially affected consumer:
response field "email" is used for GET /api/v1/customers
```

Consumer analysis is intentionally conservative.

A consumer warning represents **potential impact**, not guaranteed runtime failure.

---

# VS Code Problems Integration

Detected changes are reported through the VS Code Diagnostics API.

Example findings include:

```text
Error    Response field "email" was removed from GET /api/v1/customers
Warning  Response field "id" changed type from number to string
Warning  Potentially affected consumer: response field "email"
```

This allows developers to inspect API compatibility issues alongside other development problems.
### Example: Python

![API Contract Guardian Problems Panel — Python](images/problem-python.png)

### Example: JavaScript / TypeScript

![API Contract Guardian Problems Panel — JavaScript and TypeScript](images/problem-js.png)
---

# Language Support

## API Detection

Supported:

* JavaScript
* TypeScript
* Python (supported FastAPI and Flask patterns; static analysis)

## Consumer Analysis

Supported:

* JavaScript
* JSX
* TypeScript
* TSX

The language-specific parsing layer is separated from the core contract comparison engine.

---

# Project Structure

The project separates repository discovery, language analysis, contract comparison, and VS Code integration.

```text
src/
│
├── core/
│   ├── API Contract Models
│   ├── Git Integration
│   ├── Contract Loading
│   ├── Contract Comparison
│   ├── API Discovery
│   └── Consumer Analysis
│
├── languages/
│   └── javascript/
│       ├── Parser
│       ├── Route Detection
│       ├── Response Extraction
│       ├── Module Indexing
│       ├── Module Resolution
│       ├── Mount Detection
│       └── Route Composition
│
├── vscode/
│   └── Diagnostics
│
└── test/
    ├── Unit Tests
    ├── Integration Tests
    └── E2E Tests
```

---

# Design Principles

### Static analysis

Guardian analyzes source code rather than executing the API.

### Git-aware comparison

Previous API contracts are derived from Git revisions.

### Repository-wide discovery

API relationships can span multiple files and directories.

### No fixed variable names

Guardian does not require Express objects to be named `app`, `router`, or another predefined name.

### Separation of concerns

The core contract engine is independent from the VS Code diagnostics layer.

### Conservative analysis

Potential consumer impact is reported as a warning rather than being presented as a guaranteed runtime failure.

---

# Current Limitations

API Contract Guardian analyzes statically detectable JavaScript, TypeScript, and supported Python API patterns.

Current limitations include:

* Python support is limited to supported FastAPI and Flask patterns
* Primarily Express-style API detection for JavaScript and TypeScript
* Static analysis rather than runtime execution
* Dynamic route construction may not be resolvable
* Dynamic response objects may not be fully inferable
* Complex cross-file data flow may not be resolved
* Arbitrary HTTP clients may not be recognized
* Framework-specific routing outside supported patterns may not be detected
* Dynamic URLs may not be associated with a specific API endpoint
* Complex runtime-generated modules may not be resolvable

For example, a dynamically constructed URL or response object may not provide enough static information for Guardian to determine the complete API contract.

These limitations are intentional: Guardian prioritizes reliable, statically supported findings over speculative analysis.

---


# Troubleshooting

Use these checks when Guardian does not report an endpoint you expect, or when a reported contract change looks unexpected.

## An endpoint is not detected

Guardian uses static analysis: it reads source code rather than starting your API. It can only report routes that match the patterns its current analyzers recognize.

For JavaScript and TypeScript, start with a straightforward Express route using a literal path and an inline handler:

```typescript
import express from "express";

const app = express();

app.get("/users/:id", (req, res) => {
  res.json({ id: req.params.id, name: "Example" });
});
```

The path `/users/:id` is a string literal, so the route detector can read it without executing the application. Express routers and supported router mounts can also be composed across files when their relationships are statically resolvable.

Compare that with a path assembled at runtime:

```typescript
const prefix = "/users";

app.get(`${prefix}/:id`, (req, res) => {
  res.json({ id: req.params.id });
});
```

The second path is a template expression rather than a string literal. The current JavaScript/TypeScript route detector does not resolve that expression, so it may not detect this route. Prefer a literal route path when practical, or treat the result as a limitation of static analysis rather than proof that the endpoint does not exist.

Other things to check:

- Confirm the route uses a supported Express application or router and an HTTP method Guardian recognizes (`get`, `post`, `put`, `patch`, or `delete`).
- Check whether the handler and route declaration use a pattern the analyzer can inspect. Runtime-generated routes, custom framework conventions, and dynamic imports may not be resolved.
- For Python, only supported FastAPI and Flask decorator and router/blueprint patterns are analyzed; Python code is not executed.
- Confirm the route is in the workspace being scanned and is not excluded as a generated or dependency file.

See [Supported API Patterns](#supported-api-patterns) and [Current Limitations](#current-limitations) for the documented scope.

## A reported contract change does not match expectations

Guardian compares the current source at `HEAD` with the Git revision you enter when running **API Contract Guardian: Scan**. Check that the selected revision is the intended baseline and that both revisions are available in the repository.

Then review the finding against the source:

- **Endpoint removed:** verify that the route was statically detectable in both revisions and that its path and HTTP method did not change.
- **Response field removed or type changed:** inspect the response object in both revisions. Dynamic response objects or values assembled through complex data flow may not be fully inferred.
- **Unexpectedly different path:** check literal route paths and all supported router mount prefixes. A path may not be composed as expected if a mount or import relationship cannot be resolved.
- **Consumer warning:** treat it as a potential impact signal. Static analysis cannot guarantee that a consumer will fail at runtime.

Guardian reports findings based on the source patterns it understands; a missing finding does not prove that an endpoint is absent, and a warning does not guarantee a runtime failure.

## Useful references

- [Supported API Patterns](#supported-api-patterns)
- [Running a Scan](#running-a-scan)
- [Current Limitations](#current-limitations)
- [Development and test commands](#development)

---

# Testing

The project includes multiple levels of testing.

### Unit Tests

Individual components such as:

* Route detection
* Response extraction
* Contract comparison
* Module resolution
* Consumer parsing
* Mount detection
* Route composition

### Integration Tests

Interactions between:

* Git revision loading
* Repository discovery
* Module indexing
* Import resolution
* Express detection
* Route composition
* Contract extraction
* Contract comparison

### End-to-End Tests

The complete extension workflow, including:

* Git-based scanning
* Added API files
* Modified API files
* Deleted API files
* Cross-file routing
* Nested router composition
* Consumer analysis
* VS Code diagnostics
* Cross-platform source-file handling

Run the test suite with:

```bash
npm test
```

---

# Quick Start

## Prerequisites

* VS Code
* Node.js
* npm
* Git

## Clone

```bash
git clone https://github.com/komallsingh/api-contract-guardian.git
cd api-contract-guardian
```

## Install dependencies

```bash
npm install
```

## Compile

```bash
npm run compile
```

## Run tests

```bash
npm test
```

## Type checking

```bash
npm run check-types
```

## Linting

```bash
npm run lint
```

---

# Installing the VSIX

Package the extension with:

```bash
npx @vscode/vsce package
```

For the current manifest version, this generates:

```text
api-contract-guardian-3.0.0.vsix
```

Install it from VS Code:

```text
Extensions
→ ...
→ Install from VSIX...
→ api-contract-guardian-3.0.0.vsix
```

---

# Running a Scan

1. Open a Git repository containing a supported JavaScript, TypeScript, or Python API.
2. Open the VS Code Command Palette.
3. Run:

```text
API Contract Guardian: Scan
```

4. Enter the Git revision to compare against, such as:

```text
HEAD~1
```

5. Open the **Problems** panel to inspect detected contract changes.

---

# Development

Install dependencies:

```bash
npm install
```

Run type checking:

```bash
npm run check-types
```

Run linting:

```bash
npm run lint
```

Run tests:

```bash
npm test
```

Compile the extension:

```bash
npm run compile
```

Package the extension:

```bash
npx @vscode/vsce package
```

---

# Releases

## v3.0.0

### Python Route Discovery

* Static route discovery for supported FastAPI and Flask patterns
* Repository-aware route composition across related Python files
* Git-based Python API contract comparison
* Python API findings in VS Code diagnostics

## v2.0.0

### Repository-Wide API Discovery

Major improvements:

* Repository-wide JavaScript/TypeScript discovery
* Cross-file module indexing
* Import/export resolution
* Express application detection
* Express router detection
* Router mount detection
* Nested router composition
* Multiple router mounts
* Final composed API paths
* Repository-wide API contract discovery
* Git revision comparison
* Consumer impact analysis
* Improved VS Code diagnostics

## v1.0.0

### Core API Contract Detection

Initial capabilities:

* API endpoint detection
* Response contract extraction
* Removed response field detection
* Response field type comparison
* Consumer impact analysis
* Git-based comparison
* VS Code Problems integration

---

# Roadmap

## V1

Core API contract detection.

Status: Complete

## V2

Repository-wide JavaScript/TypeScript discovery.

Status: Complete

Includes:

* Cross-file routing
* Module resolution
* Express router composition
* Repository-wide API discovery
* Git-aware comparison

## V3

Status: Complete

Python route discovery supports common FastAPI router and Flask blueprint patterns through static analysis. Additional language support remains planned:

* Java
* Go

Python discovery is static and syntax-pattern based; it does not execute applications or support all Python syntax and framework patterns.

---

# Contributing

Contributions, bug reports, suggestions, and feature requests are welcome.

### Development workflow

Create a feature branch:

```bash
git checkout -b feature/your-feature
```

Install dependencies:

```bash
npm install
```

Make the required changes and add tests for new behavior.

Before opening a Pull Request, run:

```bash
npm test
npm run lint
npm run check-types
```

Commit your changes:

```bash
git commit -m "Add your feature"
```

Push your branch:

```bash
git push origin feature/your-feature
```

Then open a Pull Request.

---

# Tech Stack

| Category           | Technology                       |
| ------------------ | -------------------------------- |
| Language           | TypeScript                       |
| API Analysis       | JavaScript, TypeScript, Python   |
| Static Analysis    | AST-based parsing                |
| API Framework      | Express, FastAPI, Flask patterns |
| Consumer Analysis  | JavaScript, JSX, TypeScript, TSX |
| Editor Integration | VS Code Extension API            |
| Version Control    | Git                              |
| Runtime            | Node.js                          |
| Testing            | Unit, Integration, E2E           |
| Packaging          | VSIX                             |

---

# License

This project is licensed under the **MIT License**.

See [LICENSE](LICENSE) for details.

---

# Author

**Komal Singh**

Software Developer · Backend Developer · Open Source Contributor

---

<div align="center">

## API Contract Guardian

**Catch breaking API changes before they reach consumers.**

⭐ If you find the project useful, consider starring the repository.
