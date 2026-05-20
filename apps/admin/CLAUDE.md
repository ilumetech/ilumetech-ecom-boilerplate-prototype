# apps/admin — Next.js Internal Dashboard

# Inherits all rules from root CLAUDE.md.

# Rules here are specific to the internal admin dashboard app.

## Purpose

The admin dashboard is the internal management tool for store operators.
It covers order management, inventory, CMS, shipping, and reporting.
It is NOT customer-facing — optimize for functionality and clarity, not aesthetics.

## Stack

- Next.js App Router (no Pages Router — never use pages/)
- TypeScript only
- Ant Design (antd) for all UI components
- Tailwind CSS for layout and spacing only — never override Antd styles with Tailwind
- TanStack Query (React Query) for all server state and data fetching
- Clerk for auth — use @clerk/nextjs hooks and middleware

## Folder Structure

apps/admin/
app/
(auth)/ Auth routes (sign-in, sign-up)
(dashboard)/ Protected routes — all admin pages live here
layout.tsx Dashboard shell (Antd Layout: Sider, Header, Content)
[module]/ One folder per domain module
page.tsx List/index view
[id]/page.tsx Detail view
components/
ui/ Generic reusable wrappers around Antd components
[module]/ Module-specific components
lib/
api/ Typed API service functions (one file per module)
hooks/ Custom React hooks
utils/ Helper functions
types/ Admin-only types (import shared types from packages/types)

## Component Rules

- Default to Server Components — only add "use client" when necessary
- "use client" is required for: useState, useEffect, event handlers, TanStack Query hooks, all Antd components
- Antd components are all client-side — wrap them in client components
- Keep components small — if a component exceeds ~150 lines, split it
- No inline styles unless Antd's style prop requires it
- No hardcoded colors — use Antd theme tokens or Tailwind semantic classes

## Antd Usage Rules

- Use Antd Table for all data tables — built-in pagination, sort, filter
- Use Antd Form for all forms — not react-hook-form
- Use Antd Modal for all dialogs
- Use Antd message/notification for all toast feedback
- Never build custom components for things Antd already covers
- Configure Antd theme globally in app/layout.tsx via ConfigProvider — never override per component
- Never wrap Antd compound children (Descriptions.Item, Form.Item, Menu.Item, Table.Column) with <Can> — use useCan() with conditional rendering instead

## Antd Table + TanStack Query Pattern

const [filters, setFilters] = useState({ page: 1, limit: 10, search: '' })

const { data, isLoading } = useQuery({
queryKey: ['products', 'list', filters],
queryFn: () => productApi.getAll(filters)
})

const handleTableChange = (pagination, filters, sorter) => {
setFilters({ page: pagination.current, limit: pagination.pageSize, ...filters })
}

<Table
  dataSource={data?.data}
  loading={isLoading}
  pagination={{ total: data?.meta?.total, current: filters.page }}
  onChange={handleTableChange}
/>

## Data Fetching Rules

- All API calls go through lib/api/ service functions — never raw fetch in components
- Use TanStack Query for all client-side data fetching
- Query keys must be consistent: ['module', 'list', filters] or ['module', 'detail', id]
- Always handle loading and error states — use Antd Spin and message.error()
- Mutations must invalidate relevant queries on success

## API Service Pattern

// lib/api/product.ts — one file per domain module
export const productApi = {
getAll: (params: QueryDto) => apiFetch('/products?' + toQueryString(params)),
getById: (id: string) => apiFetch('/products/' + id),
create: (body: CreateProductDto) => apiFetch('/products', { method: 'POST', body }),
update: (id: string, body: UpdateProductDto) => apiFetch('/products/' + id, { method: 'PATCH', body }),
delete: (id: string) => apiFetch('/products/' + id, { method: 'DELETE' }),
}

## Auth Rules

- proxy.ts handles route protection — never create middleware.ts, it is deprecated
- Exported function must be named proxy, not middleware
- proxy.ts runs on Node.js runtime only — do not configure edge runtime
- Use useAuth() and useUser() from @clerk/nextjs for auth state
- Never use useOrganization() — no org layer in this architecture
- Never store auth tokens manually — Clerk handles this
- Permission checks: use custom usePermissions() hook that reads from /auth/me API endpoint
- Hide UI elements the user has no permission for — never rely on API alone
- User permissions are fetched from your own API, not from Clerk JWT

## Client State

- Use useState for local UI state (modals open, selected rows, filter values)
- Do not add Zustand unless useState becomes genuinely painful across many components
- TanStack Query is the source of truth for all server data — do not duplicate into state

## Tailwind Rules

- Tailwind is for layout and spacing only (flex, grid, gap, margin, padding, width)
- Never use Tailwind to style Antd components — use Antd theme tokens via ConfigProvider
- No arbitrary values (e.g. w-[347px]) — use standard Tailwind scale
- Mobile-first responsive: sm/md/lg breakpoints

## UX Constraints

- Row click = detail view. Never add a separate eye icon.
- Aksi column max 2 icons (edit + delete). Use Dropdown if more needed.
- Empty cells = em dash (—), never N/A or blank.
- Search triggers on Enter key or icon click only. No debounce. Use Input.Search.
- Never show confirmation modal on create or edit save.
- Always guard unsaved changes on exit (dirty form check before close/navigate).
- Error handling: always use handleError util. Never call message.error directly.
- Detail modal state driven by URL query param: ?detail=<id>. Close modal via router.replace, never router.push.
- Edit form submit must send dirty fields only (partial PATCH). Use getDirtyFields(formValues, originalValues) from lib/utils/get-dirty-fields.ts. If no fields changed: show message.info('Tidak ada perubahan'), do not call API. Create forms always send all fields — this rule applies to edit only.

## Page vs Modal Rule

- Flat master data (< 8 fields, no relations) → modal (create + edit)
- Master data with related transaction data → full page
- Transactional modules → full page always

## Label Mapping

- lib/labels/[entity].ts is the single source of truth for all Indonesian display labels per entity.
- Never hardcode Indonesian labels inline in components, table columns, or form fields.

## What Claude should always ask before doing

- Adding a new npm dependency
- Creating a new top-level folder in apps/admin/
- Changing the dashboard layout or Antd ConfigProvider theme
- Adding a new auth flow or changing middleware
- Overriding Antd component styles globally
