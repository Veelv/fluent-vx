# Fluent VX

[![npm version](https://badge.fury.io/js/fluent-vx.svg)](https://badge.fury.io/js/fluent-vx)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![GitHub stars](https://img.shields.io/github/stars/veelv/fluent-vx?style=social)](https://github.com/veelv/fluent-vx)
[![GitHub issues](https://img.shields.io/github/issues/veelv/fluent-vx)](https://github.com/veelv/fluent-vx/issues)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/veelv/fluent-vx/actions)

**Zero-config frontend framework with automatic routing and optimization**

Fluent VX is a next-generation frontend framework that prioritizes developer experience with zero configuration. Inspired by modern frameworks like Svelte, Astro, and Next.js, it provides automatic routing, reactive templates, and intelligent optimization out of the box.

## ✨ Features

- 🚀 **Zero Configuration** - Just `vx init` and start coding
- 🛣️ **Automatic File-based Routing** - Pages in `src/pages/` become routes
- ⚡ **Built-in Reactivity** - Reactive data binding without extra setup
- 🎨 **Simple Template Syntax** - Clean `.vx` files with familiar syntax
- 🔧 **Auto Optimization** - Intelligent bundling and minification
- 📦 **Modern Build System** - ES modules, TypeScript support
- 🛠️ **Professional CLI** - Create, develop, build, and deploy
- 🔌 **Extensible Architecture** - Plugin system for integrations

## 🚀 Quick Start

### Create a new project

```bash
# Create a new Fluent VX project
npx vx create my-app
cd my-app

# Install dependencies
npm install

# Start development server
npm run dev
```

### Initialize in existing directory

```bash
# Initialize in current directory
npx vx init

# Install dependencies
npm install

# Start development server
npm run dev
```

That's it! Your app is running at `http://localhost:5172`

## 📁 Project Structure

```
my-app/
├── src/
│   ├── app.vx              # Main application layout
│   ├── pages/              # File-based routing
│   │   ├── index.vx        # Home page (/)
│   │   └── about.vx        # About page (/about)
│   └── styles/
│       └── global.css      # Global styles
├── fluent-vx.config.ts     # Configuration (optional)
├── package.json
└── README.md
```

## 🎨 Template Syntax

Fluent VX uses a simple, reactive template syntax:

```vx
// pages/index.vx
#data
  title = "Hello World"
  count = 0
  items = ["Vue", "React", "Svelte"]
#end data

#view
  <div class="container">
    <h1>{{ title }}</h1>
    <p>Count: {{ count }}</p>
    <button @click="count++">Increment</button>

    <ul>
      @for(item in items)
        <li>{{ item }}</li>
      @end for
    </ul>

    @if(count > 5)
      <p>Count is high!</p>
    @end if
  </div>
#end view

#style
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }
#end style
```

## 🛣️ Routing

Routes are automatically created from files in `src/pages/`:

```
src/pages/
├── index.vx        →  /
├── about.vx        →  /about
├── blog.vx         →  /blog
├── blog/
│   ├── index.vx    →  /blog
│   └── [id].vx     →  /blog/:id
└── [...slug].vx    →  /blog/*
```

## 🔧 CLI Commands

```bash
# Create new project
vx create <name>

# Initialize in current directory
vx init

# Start development server
vx dev

# Build for production
vx build

# Preview production build
vx preview

# Add integration
vx add <integration-name>

# Remove integration
vx remove <integration-name>

# Verify and fix integrations
vx iv
```

## 🔌 Integrations

Fluent VX supports integrations for enhanced functionality:

```bash
# Add Tailwind CSS
vx add tailwind

# Add MDX support
vx add mdx

# Add sitemap generation
vx add sitemap
```

## 📚 Documentation

- [Framework API](FRAMEWORK-API.md) - Complete API reference
- [Configuration Guide](https://fluent-vx.dev/config) - Configuration options
- [Template Syntax](https://fluent-vx.dev/templates) - Template language
- [Routing Guide](https://fluent-vx.dev/routing) - File-based routing
- [Integrations](https://fluent-vx.dev/integrations) - Available integrations

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Inspired by modern frameworks like:
- [Svelte](https://svelte.dev) - Reactive templates
- [Astro](https://astro.build) - Zero-config architecture
- [Next.js](https://nextjs.org) - File-based routing
- [Vite](https://vitejs.dev) - Fast build system

---

Built with ❤️ by [VeelV Team](https://veelv.com.br)