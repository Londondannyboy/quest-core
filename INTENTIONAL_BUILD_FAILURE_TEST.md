# Intentional Build Failure Test

This file contains TypeScript code that will cause a build failure to test MCP-Vercel monitoring.

```typescript
// This will cause a TypeScript error
export const brokenFunction = () => {
  const x: number = "this is a string"; // Type error
  return x.nonExistentMethod(); // Another type error
}

// Missing import will cause build failure
export const anotherBrokenFunction = React.useState(); // React not imported

// Syntax error
export const syntaxError = ( => {
  console.log("missing parameter");
};
```

This should trigger a Vercel deployment that fails during the build process.