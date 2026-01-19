# Ralph Wiggum Iterative Approach

## Overview

This plan provides a structured approach for Cursor agents to iterate on a feature until all acceptance criteria are met. Named after the Simpsons character who keeps trying until things work, this approach ensures features are truly complete before marking them as done.

## Core Principle

**Keep iterating until ALL acceptance criteria pass. Do not stop until validation confirms the feature is complete.**

## Iteration Loop Structure

When implementing a feature using this approach, follow this pattern:

```
WHILE (acceptance criteria not met):
  1. Implement or fix code
  2. Run validation checks
  3. If validation fails, identify issues
  4. Fix issues
  5. Repeat from step 2
END WHILE
```

## Acceptance Criteria Types

Define one or more of the following acceptance criteria for your feature:

### 1. TypeScript Type Checking

```bash
pnpm typecheck
```

- **Success condition**: Exit code 0, no type errors
- **When to use**: Always include for TypeScript projects
- **What to fix**: Type mismatches, missing properties, incorrect assertions, missing imports

### 2. Linting

```bash
pnpm lint
```

- **Success condition**: Exit code 0, no linting errors
- **When to use**: Always include for projects with ESLint
- **What to fix**: Import order, unused imports/variables, style violations, array type syntax

### 3. Unit Tests

```bash
pnpm test
# or
pnpm test:unit
```

- **Success condition**: All tests pass, exit code 0
- **When to use**: When feature has unit tests or existing tests should still pass
- **What to fix**: Failing test assertions, broken test setup, missing test data

### 4. End-to-End Tests

```bash
pnpm test:e2e
# or manually execute E2E test scenario
```

- **Success condition**: E2E test passes, feature works in browser
- **When to use**: For user-facing features that require full integration testing
- **What to fix**: UI bugs, integration issues, missing functionality

### 5. Build Verification

```bash
pnpm build
```

- **Success condition**: Build completes without errors
- **When to use**: When feature affects build process or dependencies
- **What to fix**: Build errors, missing dependencies, compilation issues

### 6. Runtime Validation

- **Success condition**: Feature works correctly in browser, no console errors
- **When to use**: For UI features that need manual verification
- **What to check**: Console errors, runtime exceptions, visual correctness

### 7. Custom Validation Scripts

```bash
pnpm validate:feature
# or custom script
```

- **Success condition**: Custom validation passes
- **When to use**: When project has specific validation requirements
- **What to fix**: Issues identified by custom validation

## Implementation Instructions

### Step 1: Define Acceptance Criteria

At the start of your feature plan, clearly state ALL acceptance criteria:

```markdown
## Acceptance Criteria

This feature is complete when ALL of the following are true:

1. ✅ `pnpm typecheck` passes with exit code 0
2. ✅ `pnpm lint` passes with exit code 0
3. ✅ All existing unit tests pass (`pnpm test`)
4. ✅ Feature works correctly in browser (no console errors)
5. ✅ [Any additional criteria specific to this feature]
```

### Step 2: Implement Feature

Proceed with normal implementation following the feature plan.

### Step 3: Validation Loop

After implementation (or after each significant change), run the validation loop:

1. **Run all acceptance criteria checks**
   ```bash
   pnpm typecheck
   pnpm lint
   pnpm test
   # ... other checks
   ```

2. **If any check fails:**

            - Identify the specific errors/issues
            - Fix them systematically
            - Re-run the failed check
            - Continue until all checks pass

3. **If all checks pass:**

            - Feature is complete
            - Document any edge cases or considerations
            - Mark feature as done

### Step 4: Iteration Guidelines

**DO:**

- Fix errors immediately when found
- Run checks after each significant change
- Address all errors, not just some
- Verify fixes by re-running checks
- Keep iterating until ALL criteria pass

**DON'T:**

- Skip validation checks
- Leave TODO comments for fixing errors later
- Mark feature complete if any criteria fail
- Use `as any` or other type workarounds without justification
- Assume errors will fix themselves

## Example Usage in Feature Plans

When creating a feature plan, include this section:

```markdown
## Implementation Approach

This feature will use the **Ralph Wiggum Iterative Approach**:

1. Implement the feature according to the plan
2. Run validation checks:
   - `pnpm typecheck`
   - `pnpm lint`
   - `pnpm test`
   - Manual browser testing
3. Fix any issues found
4. Repeat steps 2-3 until ALL checks pass
5. Only mark complete when all acceptance criteria are met

## Acceptance Criteria

✅ TypeScript compiles without errors (`pnpm typecheck`)
✅ Linting passes (`pnpm lint`)
✅ All tests pass (`pnpm test`)
✅ Feature works in browser without console errors
✅ [Feature-specific criteria]
```

## Error Resolution Strategies

### TypeScript Errors

- Check import paths and exports
- Verify type definitions match usage
- Fix missing or incorrect type annotations
- Ensure all required properties are provided

### Linting Errors

- Fix import order (external → internal → components)
- Remove unused imports and variables
- Use `Array<T>` instead of `T[]` if required by lint rules
- Fix style violations (spacing, quotes, etc.)

### Test Failures

- Read test error messages carefully
- Check if tests need updates for new functionality
- Verify test data and mocks are correct
- Ensure new code doesn't break existing tests

### Runtime Errors

- Check browser console for errors
- Verify all dependencies are installed
- Check for missing environment variables
- Verify API endpoints and data structures

## When to Stop Iterating

**Stop ONLY when:**

- All acceptance criteria pass
- All validation checks return success
- Feature works as specified
- No errors remain (type, lint, test, runtime)

**Do NOT stop if:**

- Some criteria pass but others fail
- Errors exist but seem "minor"
- Feature "mostly works"
- You've iterated "enough times"

## Best Practices

1. **Run checks frequently**: Don't wait until the end to validate
2. **Fix errors immediately**: Address issues as they're found
3. **One issue at a time**: Fix systematically, don't try to fix everything at once
4. **Verify fixes**: Always re-run checks after fixing
5. **Document edge cases**: Note any special considerations or limitations
6. **Keep it simple**: Don't over-engineer solutions to pass validation

## Integration with Existing Workflow

This approach complements the existing `.cursorrules` requirements:

- `.cursorrules` defines WHAT to check (typecheck, lint, etc.)
- This plan defines HOW to iterate until checks pass
- Use both together for complete feature validation

## Notes

- This approach may require multiple iterations - that's expected and correct
- The goal is quality, not speed
- Better to iterate more than to ship broken code
- Each iteration should make progress toward passing all criteria