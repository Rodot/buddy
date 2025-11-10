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
- **defaults/** contains meaningful default value constants
  - `xxx.default.ts` with constant `xxxDefault`
  - All defaults should be properly typed constants, not functions
  - Do not create default files for empty arrays or objects - use inline values instead
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
- `/components/` contains all UI components

### E2E

- Always use html id tag to locate components
- If a component don't have an html id tag yet, you can add it

## Main Components Responsibilities

### Key Principles

- **Single Source of Truth**: Conversation service holds the conversation state in localStorage. Never duplicate state.
- **Direct Subscription**: Components subscribe directly to service events. No event re-emission, no state duplication.
- **Minimal Providers**: Providers only provide service instances, never duplicate state from services.

### Services

- `transcription.service.ts` Manages real-time audio transcription via OpenAI Realtime API and emits transcription/VAD/connection events
- `conversation.service.ts` Manages conversation state in localStorage (single source of truth) and emits new answer events
- `completion.service.ts` Fetches AI completions and emits thinking state events
- `engine.service.ts` Orchestrates the conversation loop (transcription → conversation → completion) without re-emitting events

### Providers

- `engine.provider.tsx` Only provides engine service instance to React tree

### Pages

- `root.tsx` Handles routing and fullscreen management based on transcription connection events
- `connect.tsx` Provides language selection UI and initiates engine connection
- `chat.tsx` Displays chat UI and subscribes directly to transcription, conversation, and completion service events
