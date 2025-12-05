# Changelog

All notable changes to **Fluent VX** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.11] - 2025-12-05

### ✨ Added

- **Smart .vx Directory**: Build and dev now use `.vx/` directory for assets
- **Inline Assets**: Production build generates single HTML with inline CSS/JS for better performance
- **Port Configuration**: Updated default ports (dev: 5002, preview: 4100) with auto-increment

### 🔧 Changed

- **Build Output**: Single optimized HTML file instead of separate assets
- **Dev Server**: Generates assets in `.vx/` directory for consistency
- **Preview Server**: Requires build first and uses dedicated port range

### 🐛 Fixed

- **Asset Serving**: Dev server properly serves generated assets
- **Build Cleanup**: Clean `.vx/` directory before each build

---

## [0.1.1] - 2025-12-05

### 🐛 Fixed

- **Parser**: Fixed `parseDataValue` to correctly parse individual data variables without collecting subsequent declarations
- **Event Handlers**: Updated event handlers to properly access reactive data through `window.reactiveData`
- **Data Block Parsing**: Added `tryParseDataBlock` to handle files without data blocks gracefully
- **Framework Initialization**: Enhanced `VX.init()` with client-side routing setup for SPA-like navigation
- **Code Generation**: Improved JavaScript generation for better module support in development

### 🔧 Changed

- Parser now correctly handles optional data blocks in `.vx` files
- Event handlers use reactive data context for proper state updates
- Framework initialization includes routing and navigation setup

---

## [0.1.0] - 2024-12-05

### 🎉 Initial Release

**Fluent VX** is a zero-config frontend framework with automatic routing and optimization, created by **VeelV Team**. Inspired by modern frameworks like Svelte, Astro, and Next.js.

### ✨ Added

#### Core Framework
- **Zero-config architecture** - Works out of the box with minimal setup
- **Automatic file-based routing** - Pages in `src/pages/` become routes automatically
- **Reactive template syntax** - Clean `.vx` files with built-in reactivity
- **Intelligent compilation** - Auto-detects development/production environments
- **Modern build system** - ES modules, TypeScript support, and optimization

#### CLI (Command Line Interface)
- `vx create <name>` - Create new Fluent VX projects
- `vx init` - Initialize Fluent VX in current directory
- `vx dev` - Start development server with hot reload
- `vx build` - Build for production with optimization
- `vx preview` - Preview production builds locally
- `vx add <integration>` - Add integrations to projects
- `vx remove <integration>` - Remove integrations from projects
- `vx iv` - Verify and auto-configure installed integrations

#### Template System
- **Professional template system** - Uses `.stub` files to avoid development-time import errors
- **Dynamic variable replacement** - Templates support `{{projectName}}` and other variables
- **Multiple template types** - Support for TypeScript, JSON, and Markdown templates
- **Automatic processing** - Templates are processed during project creation

#### Integration System
- **Plugin architecture** - Extensible system for adding functionality
- **Automatic dependency management** - Integrations can declare dependencies and conflicts
- **Lifecycle hooks** - Support for build, dev server, and other lifecycle events
- **Validation system** - Ensures integration compatibility
- **Manager system** - Professional integration lifecycle management

#### Routing System
- **File-based routing** - Inspired by Next.js and SvelteKit
- **Dynamic routes** - Support for `[id]` and `[...slug]` patterns
- **Route guards** - Authentication and authorization guards
- **Middleware system** - Route-level middleware support
- **Prefetching** - Intelligent route prefetching for performance
- **History management** - Full browser history API support

#### Compilation System
- **Template compilation** - Converts `.vx` files to optimized HTML/CSS/JS
- **Reactivity system** - Built-in reactive data binding
- **Directive support** - `@if`, `@for`, and custom directives
- **Asset optimization** - Automatic image and font optimization
- **Source maps** - Development source map generation

#### Runtime Features
- **Hydration system** - Selective hydration for performance
- **Client-side routing** - Fast SPA-like navigation
- **State management** - Built-in reactive state
- **Event handling** - Declarative event binding
- **Component system** - Reusable component architecture

#### Security Features
- **Secure HTTP client** - Built-in fetch with retry and timeout
- **Schema validation** - Runtime data validation
- **CSRF protection** - Automatic CSRF token handling
- **Content Security Policy** - CSP header management
- **Rate limiting** - Built-in rate limiting support

#### Server Actions
- **Type-safe server functions** - End-to-end type safety
- **Automatic serialization** - Handles complex data types
- **Error handling** - Comprehensive error management
- **Authentication** - Built-in auth integration
- **Caching** - Intelligent response caching

#### Accessibility
- **WCAG compliance** - Automatic accessibility validation
- **ARIA support** - Built-in ARIA attribute handling
- **Keyboard navigation** - Full keyboard support
- **Screen reader** - Screen reader optimization
- **Color contrast** - Automatic contrast validation

#### Developer Experience
- **TypeScript support** - Full TypeScript integration
- **Hot reload** - Fast development iteration
- **Error overlay** - Helpful development error messages
- **IntelliSense** - Full IDE support
- **Documentation** - Comprehensive API documentation

### 🔧 Changed

- Initial project structure optimized for zero-config experience
- CLI commands streamlined for better developer experience
- Template system redesigned to use `.stub` files for development safety

### 📚 Documentation

- Complete API documentation in `FRAMEWORK-API.md`
- Professional README with examples and guides
- Contributing guidelines for community development
- License and changelog for open source compliance

### 🏗️ Infrastructure

- Professional build system with TypeScript compilation
- Comprehensive test suite setup
- CI/CD ready configuration
- NPM package configuration for publishing
- Git repository setup with proper ignore patterns

---

## Types of changes

- `Added` for new features
- `Changed` for changes in existing functionality
- `Deprecated` for soon-to-be removed features
- `Removed` for now removed features
- `Fixed` for any bug fixes
- `Security` in case of vulnerabilities

---

## Development

This project uses [Semantic Versioning](https://semver.org/). For the versions available, see the [tags on this repository](https://github.com/veelv/fluent-vx/tags).

---

**Full Changelog**: [https://github.com/veelv/fluent-vx/compare/v0.0.0...v0.1.0](https://github.com/veelv/fluent-vx/compare/v0.0.0...v0.1.0)