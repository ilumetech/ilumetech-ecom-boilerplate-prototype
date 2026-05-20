# Negative Space Programming (NSP)

# These rules are mandatory. Apply them to every file you create or modify.

# When refactoring existing code, apply NSP to the entire function touched — not just the new lines.

## Core Rules

- Single responsibility per function — one function does one thing
- Functions must be under 25 lines — extract helpers if exceeded
- Maximum nesting depth: 3 levels — restructure if exceeded
- Always use early returns — never wrap happy path in an if block
- Separate logical sections with a single blank line
- Variable and function names must be descriptive — no abbreviations

## Early Return — Required Pattern

// WRONG — happy path buried in nesting
async function createProduct(dto) {
if (dto.name) {
if (dto.price > 0) {
const product = await prisma.product.create({ data: dto })
return product
}
}
}

// CORRECT — guard clauses first, happy path last
async function createProduct(dto) {
if (!dto.name) throw new BadRequestException('Name is required')
if (dto.price <= 0) throw new BadRequestException('Price must be positive')

const product = await prisma.product.create({ data: dto })
return product
}

## Extract Intermediate Variables

// WRONG — compressed, hard to scan
const result = users.filter(u => u.active && u.role === 'admin' && u.org === orgId).map(u => u.id)

// CORRECT — sequential, scannable
const activeAdmins = users.filter(u => u.active && u.role === 'admin' && u.org === orgId)
const adminIds = activeAdmins.map(u => u.id)

## Forbidden

- Nested ternary expressions — use if/else or early return instead
- Functions that mix multiple responsibilities — split them
- Deep indentation (4+ levels) — restructure with early returns or helper functions
- Clever one-liners that sacrifice readability for brevity
- Leftover console.log, debugging code, or dead code
- Unused imports

## Comments

- Comments explain WHY, not WHAT
- Never restate what the code already says

// WRONG
// loop through users and return ids
const ids = users.map(u => u.id)

// CORRECT
// Clerk requires user ids as strings for batch permission checks
const ids = users.map(u => u.id)

## When Claude Generates Code

- Apply NSP to every function generated — no exceptions
- If a generated function exceeds 25 lines, split it before finishing
- If nesting exceeds 3 levels, stop and restructure before continuing
- Never generate nested ternaries regardless of brevity
- Flag any existing code that violates NSP when touching that file
