# Contributing to Fluent VX

Thank you for your interest in contributing to Fluent VX! We welcome contributions from the community.

## 🚀 Quick Start

1. Fork the repository
2. Clone your fork: `git clone https://github.com/veelv/fluent-vx.git`
3. Install dependencies: `npm install`
4. Create a feature branch: `git checkout -b feature/your-feature-name`
5. Make your changes
6. Run tests: `npm test`
7. Build the project: `npm run build`
8. Commit your changes: `git commit -m 'Add your feature'`
9. Push to your branch: `git push origin feature/your-feature-name`
10. Open a Pull Request

## 🛠️ Development Setup

### Prerequisites

- Node.js 16+
- npm or yarn

### Local Development

```bash
# Install dependencies
npm install

# Start development mode
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## 📋 Contribution Guidelines

### Code Style

- Use TypeScript for all new code
- Follow the existing code style (Prettier configuration)
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### Commit Messages

Follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Testing
- `chore`: Maintenance

### Pull Requests

- Use a clear, descriptive title
- Provide a detailed description of changes
- Reference any related issues
- Ensure all tests pass
- Update documentation if needed

## 🏗️ Architecture

### Core Modules

- **CLI** (`src/cli/`): Command-line interface
- **Compiler** (`src/compiler/`): Template compilation
- **Router** (`src/router/`): File-based routing
- **Runtime** (`src/runtime/`): Client-side runtime
- **Integrations** (`src/integrations/`): Plugin system

### File Structure

```
src/
├── cli/                    # Command-line tools
├── compiler/              # Template compilation
├── router/                # Routing system
├── runtime/               # Client runtime
├── integrations/          # Plugin architecture
├── accessibility/         # WCAG validation
├── secure/                # Security features
├── server-actions/        # Server functions
└── utils/                 # Utilities
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- test/compiler.test.ts

# Run with coverage
npm test -- --coverage
```

### Writing Tests

- Use Jest as the test runner
- Place tests in `test/` directory
- Follow naming convention: `*.test.ts`
- Test both positive and negative cases

## 📚 Documentation

### API Documentation

- Update `FRAMEWORK-API.md` for new APIs
- Add JSDoc comments to functions
- Update README.md examples

### Template Documentation

- Document new template features
- Provide examples in the docs
- Update syntax highlighting

## 🔌 Creating Integrations

Integrations extend Fluent VX functionality:

```typescript
// my-integration.ts
import { createIntegration } from 'fluent-vx';

export default createIntegration({
  name: 'my-integration',
  version: '1.0.0',
  'build:start': () => {
    console.log('Build started!');
  }
});
```

## 🐛 Reporting Issues

- Use GitHub Issues for bug reports
- Include reproduction steps
- Provide environment details (Node version, OS, etc.)
- Attach relevant code snippets

## 📞 Getting Help

- **Discord**: Join our community
- **GitHub Discussions**: Ask questions
- **Documentation**: Check the docs first

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Fluent VX! 🎉