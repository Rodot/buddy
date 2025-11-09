# Buddy

## Contribution rules

- Always run and pass `./run_quality.sh` after any change

## Tech stack

### App

- React v19.2 (frontend AND backend using Server Components and Functions)
- React Compiler. Automatic optimization. do NOT use useMemo, useCallback, React,memo, memo. Write straightforward code and let the compiler optimize it.
- React-router v7
- Tanstack Query
- Vite
- No database, client side local storage only

### UI

- Tailwind
- Daisy UI, theme in app/app.css
- Icons from "@mdi/js" using app/components/MdiIcon.tsx

### Quality

- TypeScript
- ESLint
- Prettier
- Markdownlint
- Shellcheck
- Playwright

### Packaging

- All-in-one docker image

## Architecture

### Domain and Dto

Strict separation between the domain model and the Dtos/Api. Only the api layer is aware of the Dtos, the rest of the app uses Models

### Files structure

- **types/domain/** contains `xxxModel.type.ts`
- **types/dto/** contains `xxxDto.type.ts`
- **types/input/** contains `xxxInput.type.ts` (for form input types, should be merged into Models eventually)
- **converters/** contains all DTO/Model conversion functions
  - `xxxFromxxx.convert.ts` with function `xxxFromxxx`
- **defaults/** contains all default value constants
  - `xxx.default.ts` with constant `xxxDefault`
  - All defaults should be properly typed constants, not functions
- **consts/** contains constant definitions
  - `xxx.const.ts` with exported constants in UPPER_SNAKE_CASE
- **providers/** contains React context providers
  - `xxx.provider.tsx`
- **logic/** contains pure functions that handle business logic
  - `xxx.logic.ts`
- **pages/** contains page components
  - `xxx.page.tsx`
- **services/** contains API service layer
  - `xxx.service.ts` (except `api.ts` which is the base API client)

### Queries

- All async queries and mutation are done using TanStack Query
- Read data using custom hooks in `./hooks/use**Query.ts`
- Mutate state by calling mutations in `./hooks/use**Query.ts` that call services

### Components

- Components use hooks for data fetching rather than prop drilling
- `/components/` contains all UI components organized in subdirectories:
  - `/components/dumb/` - `xxx.dumb.tsx` - Purely presentational components, end of the tree
  - `/components/smart/` - `xxx.smart.tsx` - Components that use queries and mutations and dispatch data to dumb ones
  - `/components/layout/` - `xxx.layout.tsx` - Middle of the tree, purely presentational, might pass data through using prop drilling

### E2E

- Always use html id tag to locate components
- If a component don't have an html id tag yet, you can add it
