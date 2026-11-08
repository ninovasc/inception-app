# Contributing to PASIV Engine

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the dev server: `node scripts/serve.js .`
4. Open http://localhost:8099 in your browser

## Testing

### Running Tests

```bash
# Unit tests + TypeScript check
npm test

# Functional tests (with mock browser environment)
node --test tests/functional.test.mjs tests/*-functional.test.mjs

# E2E tests (Playwright)
npm run test:e2e

# All tests
npm run test:all

# Coverage
npm run test:coverage
```

### Test Structure

- `tests/comprehensive.test.mjs` - Static analysis tests (file structure, imports, etc.)
- `tests/runtime.test.mjs` - Runtime behavior tests
- `tests/unit.test.mjs` - Unit tests
- `tests/functional.test.mjs` - Functional tests with mock browser environment
- `tests/*-functional.test.mjs` - Module-specific functional tests
- `tests/pasivFile.test.mjs` - .PASIV file persistence tests
- `tests/e2e/*.spec.js` - E2E tests (Playwright)

### TDD Approach

We follow Test-Driven Development:
1. Write a failing test
2. Write the minimum code to make it pass
3. Refactor

### TypeScript

The project uses TypeScript as a gradual type-checking tool:
- `tsconfig.pure.json` with `checkJs: true`
- Run: `npx tsc --noEmit -p tsconfig.pure.json`
- Add `// @ts-nocheck` to files not yet type-checked
- Remove `// @ts-nocheck` and fix type errors incrementally

### Pre-commit Hook

Install the pre-commit hook:
```bash
cp scripts/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

The hook runs:
- TypeScript check
- Comprehensive tests
- Runtime tests
- Functional tests

### Code Style

- Use ES modules (`import`/`export`)
- No `window.*` global assignments for business logic
- Use `data-action` attributes for event delegation
- Export functions for direct import by other modules
- Add JSDoc type annotations for TypeScript checking

### Pull Requests

1. Create a feature branch
2. Write tests first (TDD)
3. Implement the feature
4. Ensure all tests pass
5. Update documentation if needed
6. Submit PR

## Architecture

- **Event Delegation**: All UI interactions use `data-action` attributes
- **Modular**: Separate modules by responsibility
- **TypeScript Scaffold**: Gradual type checking with `checkJs: true`
- **Persistence**: `.PASIV` JSON files for state export/import
- **No window.* globals**: All functions accessible via direct import or event delegation