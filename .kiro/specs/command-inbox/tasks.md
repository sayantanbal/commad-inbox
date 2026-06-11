# Implementation Plan: Command Inbox

## Overview

This implementation plan breaks down the Command Inbox feature into discrete, sequential tasks. Each task builds on the previous steps, starting with database setup and authentication, progressing through core email/calendar features, and culminating in advanced AI capabilities and realtime updates. The plan emphasizes incremental validation with checkpoints to ensure core functionality works before adding complexity.

## Tasks

- [ ] 1. Set up project infrastructure and database schema
  - Create Next.js 15 project with App Router and TypeScript
  - Install core dependencies: Drizzle ORM, Zod, shadcn/ui, Tailwind CSS
  - Install and configure the Corsair SDK (`corsair`, `@corsair-dev/gmail`, `@corsair-dev/googlecalendar`, `@corsair-dev/mcp`) with `multiTenancy: true`; run Corsair migrations against the same Postgres database
  - Verify a real Gmail list/send call and a Calendar list call work through Corsair before building anything else
  - Set up Neon Postgres connection with pgvector extension
  - Define database schema (users, classifications, snoozes, drafts, scheduled_sends, webhook_logs tables) using Drizzle
  - Create initial database migration and apply to development database
  - Set up environment variable validation using Zod
  - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.5, 22.7_

- [ ] 2. Implement authentication and tenant isolation
  - [ ] 2.1 Set up Better Auth with Google OAuth provider
    - Configure Better Auth for multi-tenant authentication
    - Create OAuth callback route handler
    - Implement user session management
    - _Requirements: 1.1, 1.2_
  
  - [ ] 2.2 Build Corsair connection flow
    - Create a Corsair tenant per user after OAuth completion (store corsair_tenant_id in users table; no Corsair API key prompt — Corsair is configured app-level)
    - Add Gmail and Calendar connection via Corsair plugin connect flow
    - _Requirements: 1.3, 1.4_
  
  - [ ]* 2.3 Write unit tests for authentication flow
    - Test OAuth token storage and retrieval
    - Test tenant isolation in database queries
    - Verify per-tenant Corsair connection isolation
    - _Requirements: 1.5, 1.6_

- [ ] 3. Build core email thread display
  - [ ] 3.1 Create ThreadList server component
    - Fetch threads via Corsair Gmail plugin
    - Implement thread list rendering with subject, sender, timestamp
    - Add priority badge display using classification data
    - Organize threads by Triage Lane (Reply, Schedule, FYI, Done)
    - _Requirements: 2.1, 2.2, 2.3, 2.7_
  
  - [ ] 3.2 Create ThreadView server component
    - Fetch full thread conversation via Corsair
    - Render messages in chronological order with participant info
    - Display relative timestamps and RSVP chips
    - _Requirements: 2.4, 2.5, 2.6_
  
  - [ ]* 3.3 Write property test for thread object round-trip preservation
    - **Property 2: Thread Object Round-Trip Preservation**
    - **Validates: Requirements 21.6**
    - Generate threads with 1-10 messages, 2-20 participants, 0-5 attachments
    - Test: parse→serialize→parse produces equivalent nested structure

- [ ] 4. Implement calendar week strip
  - [ ] 4.1 Create CalendarWeekStrip server component
    - Fetch Calendar Events via Corsair Google Calendar plugin
    - Render week view with event title, time, attendee count
    - Highlight current time slot
    - Position adjacent to thread view
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6_
  
  - [ ] 4.2 Add week navigation
    - Implement previous/next week navigation
    - Ensure updates complete within 500ms
    - _Requirements: 3.4_
  
  - [ ]* 4.3 Write property test for calendar event round-trip preservation
    - **Property 3: Calendar Event Round-Trip Preservation**
    - **Validates: Requirements 21.7**
    - Generate events with varying attendee counts, time zones, optional fields
    - Test: parse→serialize→parse preserves all fields including datetime precision

- [ ] 5. Checkpoint - Ensure basic display works
  - Verify thread list displays correctly from Corsair
  - Verify calendar week strip shows events
  - Ensure all tests pass, ask the user if questions arise

- [ ] 6. Implement email operations
  - [ ] 6.1 Create reply composer component
    - Build rich text editor with Tiptap (bold, italic, links, lists; HTML email output)
    - Implement keyboard shortcut (R key) to open composer
    - Add Mod+Enter to send, Escape to close
    - _Requirements: 4.1, 4.2, 4.6_
  
  - [ ] 6.2 Implement send email server action
    - Create sendEmail server action calling Corsair Gmail plugin
    - Implement undo send via delayed dispatch: insert scheduled_sends row with send_at = now() + 5s, dispatch after the window in the same request (cron as durable fallback); undo flips status to cancelled and reopens composer
    - Add optimistic UI update using useOptimistic hook
    - Handle success and failure cases with error toasts
    - Preserve drafts on failure
    - _Requirements: 4.3, 4.4, 4.5, 4.7, 19.6_
  
  - [ ] 6.3 Implement Send Later
    - Add Send Later option in composer with time presets and custom picker
    - Store scheduled sends in scheduled_sends table
    - Create /api/cron/process-due handler protected by CRON_SECRET bearer token, triggered every minute by a free external pinger (cron-job.org or Upstash QStash); dispatch due sends via Corsair with idempotent row claiming
    - Allow viewing, editing, and cancelling scheduled sends before send time
    - _Requirements: 4.8, 4.9, 4.10_
  
  - [ ]* 6.4 Write unit tests for email send operations
    - Test optimistic UI state transitions
    - Test error handling and draft preservation
    - Test reply threading
    - Test scheduled send dispatch and cancellation
    - _Requirements: 4.5, 4.10_

- [ ] 7. Implement archive and snooze
  - [ ] 7.1 Create archive server action
    - Implement archiveThread action calling Corsair and setting the thread's lane to Done (merged archive/Done semantics; Done hidden from main triage flow)
    - Add E key shortcut handler
    - Display undo toast for 5 seconds
    - Complete operation within 1 second
    - _Requirements: 5.1, 5.5, 5.7_
  
  - [ ] 7.2 Create snooze server action
    - Implement snoozeThread action with duration prompt
    - Add S key shortcut handler
    - Store snooze time in snoozes table (filter-based: lane views exclude threads with an active snooze; classification/lane never mutated)
    - Implement snooze expiry via the shared /api/cron/process-due handler: delete expired snooze rows and broadcast a realtime update so the thread reappears in its unchanged original lane
    - Display undo toast with revert functionality
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6_
  
  - [ ]* 7.3 Write property test for snooze expiry lane restoration
    - **Property 6: Snooze Expiry Lane Restoration**
    - **Validates: Requirements 5.4**
    - Generate threads in different lanes with snooze times
    - Test: snooze→advance time→check lane matches original
  
  - [ ]* 7.4 Write unit tests for archive and snooze
    - Test undo functionality
    - Test optimistic UI reversion on failure
    - _Requirements: 5.6_

- [ ] 8. Implement webhook processing for realtime updates
  - [ ] 8.1 Create webhook route handler
    - Implement POST /api/webhooks endpoint
    - Verify the Corsair signature from the HTTP request header against the raw request body (before JSON parsing)
    - Reject requests with missing or invalid signature headers with HTTP 401
    - Log all webhook attempts to webhook_logs table
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [ ] 8.2 Implement Gmail webhook processing
    - Fetch new thread from Corsair cache on webhook
    - Process webhook within 2 seconds
    - _Requirements: 6.4, 6.7_
  
  - [ ]* 8.3 Write property test for webhook payload round-trip preservation
    - **Property 1: Webhook Payload Round-Trip Preservation**
    - **Validates: Requirements 21.5**
    - Generate random webhook payloads for Gmail and Calendar types
    - Test: parse→serialize→parse produces equivalent object with all fields preserved
  
  - [ ]* 8.4 Write unit tests for webhook signature verification
    - Test valid signature acceptance
    - Test invalid signature rejection
    - Test webhook logging
    - _Requirements: 6.2, 6.3_

- [ ] 9. Implement AI priority classification
  - [ ] 9.1 Create classification service
    - Set up Gemini Flash (gemini-2.0-flash) API client
    - Implement classifyEmail function analyzing subject and body
    - Assign priority (High, Medium, Low) and lane (Reply, Schedule, FYI, Done)
    - Extract scheduling intent with proposed times and attendees
    - Store classification in classifications table, including denormalized subject/sender/snippet for search result display
    - Complete classification within 1.5 seconds
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_
  
  - [ ] 9.2 Integrate classification with webhook handler
    - Call classification service when webhook processes new email
    - Ensure classification completes before pushing realtime update
    - _Requirements: 6.5, 6.6_
  
  - [ ] 9.3 Implement initial backfill on first connect
    - After Gmail connects, run a background job classifying + embedding the 50 most recent threads from Corsair cache
    - Process in small batches respecting Gemini free-tier rate limits; make idempotent (skip already-classified threads)
    - Show "Setting up your inbox" progress indicator (n/50); populate lanes incrementally via realtime updates
    - _Requirements: 7.8, 7.9, 7.10_
  
  - [ ]* 9.4 Write property test for AI operation determinism
    - **Property 5: AI Operation Determinism**
    - **Validates: Requirements 7.5, 16.6**
    - Generate thread objects with scheduling-related content
    - Test: run classification twice with mocked Gemini responses
    - Validate: identical priority, lane, proposed times, attendees
  
  - [ ]* 9.5 Write unit tests for classification
    - Test fallback to default lane on timeout
    - Test scheduling intent extraction accuracy
    - _Requirements: 7.7_

- [ ] 10. Checkpoint - Ensure email operations and classification work
  - Test sending, replying, archiving, and snoozing emails
  - Verify webhook processing and classification
  - Ensure all tests pass, ask the user if questions arise

- [ ] 11. Implement semantic search with pgvector
  - [ ] 11.1 Set up embedding generation
    - Create embedEmbedding function using text-embedding-004 API
    - Generate embeddings for new emails in webhook handler
    - Store 768-dimensional vectors in classifications table
    - Create HNSW index on embedding column
    - _Requirements: 8.1, 8.2_
  
  - [ ] 11.2 Create semantic search functionality
    - Implement semanticSearch server action
    - Add / key shortcut to open search input
    - Generate query embeddings and perform vector similarity search
    - Return ranked results within 1 second
    - Display results with highlighted snippets
    - _Requirements: 8.3, 8.4, 8.5, 8.6, 8.7_
  
  - [ ]* 11.3 Write unit tests for semantic search
    - Test embedding generation
    - Test vector similarity ranking
    - Test search latency constraints
    - _Requirements: 8.6_

- [ ] 12. Implement Hero Workflow (email to meeting conversion)
  - [ ] 12.1 Create AvailabilityPicker component
    - Extract scheduling intent from thread when M key pressed
    - Display inline calendar overlay with user's availability
    - Show proposed times from email as highlighted chips alongside free slots (intent mode, confidence >= 0.5)
    - Manual-mode fallback when intent is null or confidence < 0.5: free slots only, 30-min default duration, attendees pre-filled from thread participants — M never errors
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.9, 9.10_
  
  - [ ] 12.2 Implement calendar event creation in Hero Workflow
    - Create Calendar Event via Corsair on time slot selection (Enter key)
    - Generate AI-drafted confirmation reply using Gemini Flash
    - Queue confirmation reply for user review
    - Complete workflow within 3 seconds
    - _Requirements: 9.5, 9.6, 9.7, 9.8_
  
  - [ ]* 12.3 Write integration tests for Hero Workflow
    - Test end-to-end email-to-meeting conversion
    - Test 3-second completion constraint
    - _Requirements: 9.8_

- [ ] 13. Implement calendar event management
  - [ ] 13.1 Create calendar event operations
    - Implement createEvent server action calling Corsair
    - Implement updateEvent server action with 1-second completion
    - Implement cancelEvent server action with cancellation emails
    - Add optimistic UI for all calendar operations
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.6_
  
  - [ ] 13.2 Add error handling for calendar operations
    - Revert optimistic UI on failure
    - Display descriptive error messages
    - _Requirements: 10.5_
  
  - [ ] 13.3 Build Defrag My Week view
    - Add DefragView overlay accessible from the calendar week strip
    - Highlight fragmented gaps (<60min) and compute weekly focus time (contiguous free blocks ≥2h)
    - Suggest meeting moves that consolidate fragments; apply accepted moves via updateEvent with attendee notification
    - Hide dismissed suggestions for the session
    - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.5, 25.6_
  
  - [ ]* 13.4 Write unit tests for calendar operations
    - Test event creation, update, and cancellation
    - Test optimistic UI reversion on errors
    - _Requirements: 10.4, 10.5_

- [ ] 14. Build keyboard shortcut system
  - [ ] 14.1 Create platform detection and Shortcut Registry
    - Use react-hotkeys-hook with scopes (global/list/thread/composer) driven by the typed Shortcut Registry
    - Implement platform detection (Mac, Windows, Linux)
    - Map Cmd (⌘) on Mac, Ctrl elsewhere
    - Define single-key shortcuts: J, K, E, R, M, /, ?, X, S
    - Define modifier shortcuts: Mod+K, Mod+Enter, Mod+Shift+F
    - Prevent browser defaults on Mod+K
    - Avoid conflicting shortcuts (Mod+W, Mod+T, etc.)
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.7, 12.9_
  
  - [ ] 14.2 Implement context-aware shortcut handling
    - Disable single-key shortcuts when input/textarea focused
    - Re-enable shortcuts when input unfocused
    - Implement Escape to close topmost modal
    - _Requirements: 12.5, 12.6, 12.8_
  
  - [ ]* 14.3 Write property test for input focus bidirectional shortcut state
    - **Property 4: Input Focus Bidirectional Shortcut State**
    - **Validates: Requirements 12.5, 12.6**
    - Generate DOM states with different input element types focused/unfocused
    - Test: focus→shortcuts disabled→unfocus→shortcuts enabled
  
  - [ ]* 14.4 Write unit tests for keyboard shortcuts
    - Test platform-specific modifier key rendering
    - Test context filtering (list vs thread vs composer)
    - _Requirements: 12.1, 12.5, 12.6_

- [ ] 15. Build Command Palette
  - [ ] 15.1 Create CommandPalette component
    - Open on Mod+K, close on Escape
    - Display all actions from Shortcut Registry
    - Implement fuzzy matching filter
    - Execute selected action and close palette
    - Display keyboard shortcuts next to actions
    - Render in under 100ms
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_
  
  - [ ]* 15.2 Write unit tests for Command Palette
    - Test fuzzy matching accuracy
    - Test action execution
    - Test render performance
    - _Requirements: 11.7_

- [ ] 16. Implement shortcut cheat sheet
  - [ ] 16.1 Create cheat sheet overlay
    - Open on ? key, close on Escape or ?
    - Render shortcuts from Shortcut Registry with platform-specific modifiers
    - Group by context: Global, List, Thread, Composer
    - Display in under 100ms
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_
  
  - [ ]* 16.2 Write unit tests for cheat sheet
    - Test keyboard shortcut rendering
    - Test context grouping
    - _Requirements: 13.3_

- [ ] 17. Checkpoint - Ensure keyboard shortcuts and UI work
  - Test all keyboard shortcuts work as expected
  - Verify Command Palette and cheat sheet
  - Ensure all tests pass, ask the user if questions arise

- [ ] 18. Implement realtime UI updates with Pusher
  - [ ] 18.1 Set up Pusher Channels integration
    - Create Pusher client connection on app load
    - Subscribe to tenant-specific channel: tenant-${userId}-inbox
    - Implement auto-reconnect with exponential backoff
    - Display connection status indicator
    - _Requirements: 18.1, 18.5, 18.6_
  
  - [ ] 18.2 Broadcast updates from webhook handler
    - Push new-email events from webhook handler via Pusher
    - Push calendar-update events
    - _Requirements: 6.6, 18.2_
  
  - [ ] 18.3 Handle realtime updates on client
    - Update UI without full page reload on events
    - Implement 5-second Postgres polling fallback
    - _Requirements: 18.3, 18.4_
  
  - [ ]* 18.4 Write integration tests for realtime updates
    - Test Pusher event handling
    - Test fallback polling
    - _Requirements: 18.4_

- [ ] 19. Implement Agent Chat with MCP
  - [ ] 19.1 Set up Vercel AI SDK chat endpoint
    - Create POST /api/chat route handler
    - Configure Gemini Flash model with Vercel AI SDK
    - Set up Corsair MCP adapter for tool access
    - Define MCP tools: send_email, create_meeting, search_threads, list_availability
    - _Requirements: 15.1, 15.2, 15.3, 15.4_
  
  - [ ] 19.2 Create AgentChat component
    - Use useChat hook from Vercel AI SDK with maxSteps for multi-step tool chains
    - Render chat messages with streaming responses
    - Human-in-the-loop pattern: destructive tools (send_email, create_meeting) have no execute function — tool calls pause and render an approval card
    - On approve: run executeApprovedTool server action (Corsair MCP) and resume the model via addToolResult
    - On deny: send { denied: true } tool result so the model acknowledges without executing
    - Read-only tools (search_threads, list_availability) execute server-side without approval
    - _Requirements: 15.5, 15.6, 15.7_
  
  - [ ] 19.3 Add Agent Chat UI integration
    - Make accessible via keyboard shortcut and tab navigation
    - Test example prompt: "Send a calendar invite to friend@corsair.dev at 9 AM next Thursday, and email him saying I look forward to it"
    - _Requirements: 15.1, 15.8_
  
  - [ ]* 19.4 Write integration tests for Agent Chat
    - Test MCP tool calling flow
    - Test approval/denial handling
    - Test example prompt execution
    - _Requirements: 15.8_

- [ ] 20. Implement AI reply drafts
  - [ ] 20.1 Create draft generation service
    - Analyze thread context when reply composer opens
    - Use Gemini Flash to generate contextual reply
    - Support tone presets: Professional, Friendly, Brief
    - Generate drafts within 2 seconds
    - _Requirements: 16.1, 16.2, 16.5, 16.7_
  
  - [ ] 20.2 Integrate drafts into composer
    - Display AI-generated draft with clear indication
    - Allow user to edit draft before sending
    - Implement tone preset selector with regeneration
    - _Requirements: 16.3, 16.4, 16.6_
  
  - [ ]* 20.3 Write unit tests for reply drafts
    - Test tone preset application
    - Test draft generation latency
    - _Requirements: 16.7_

- [ ] 21. Implement advanced search UI
  - [ ] 21.1 Create advanced search interface
    - Open on Mod+Shift+F
    - Add filter inputs: sender, date range, has attachment, Triage Lane
    - Combine Corsair search API with Pgvector semantic filtering
    - Display results with highlighted matches
    - Return results within 1.5 seconds
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_
  
  - [ ]* 21.2 Write integration tests for advanced search
    - Test filter combination accuracy
    - Test search latency constraints
    - _Requirements: 17.6_

- [ ] 22. Implement mobile PWA and touch gestures
  - [ ] 22.1 Create PWA manifest and mobile layout
    - Add PWA manifest for Android installation
    - Build responsive layout with bottom tab navigation
    - _Requirements: 14.1, 14.2_
  
  - [ ] 22.2 Implement touch gestures
    - Add swipe-right to archive
    - Add swipe-left for snooze options
    - Add long-press for multi-select mode (bulk actions: archive and snooze only)
    - Add floating action button for Command Palette
    - Support touch navigation through tabs
    - _Requirements: 14.3, 14.4, 14.5, 14.6, 14.7_
  
  - [ ]* 22.3 Write integration tests for mobile UI
    - Test touch gesture handling
    - Test responsive layout
    - _Requirements: 14.2, 14.7_

- [ ] 23. Implement visual design and theming
  - [ ] 23.1 Build dark theme UI
    - Apply shadcn/ui and Tailwind dark theme
    - Implement light theme toggle in settings
    - Apply 8px spacing grid consistently
    - Use Inter or Geist font family
    - Add custom focus rings
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.6_
  
  - [ ] 23.2 Add motion and empty states
    - Implement subtle transitions with Framer Motion
    - Create polished empty states with shortcut hints
    - Render in-context ShortcutHint tooltips on hover/focus, sourced from the Shortcut Registry
    - Prevent layout shift during loading
    - _Requirements: 20.5, 20.7, 20.8, 20.9_
  
  - [ ]* 23.3 Write snapshot tests for UI components
    - Test dark and light theme rendering
    - Test empty states
    - _Requirements: 20.1, 20.2_

- [ ] 24. Checkpoint - Ensure all features are integrated
  - Test Hero Workflow end-to-end
  - Verify Agent Chat with MCP tools
  - Test realtime updates and webhooks
  - Ensure all tests pass, ask the user if questions arise

- [ ] 25. Implement comprehensive error handling
  - [ ] 25.1 Add network error handling
    - Implement retry with exponential backoff for Corsair API
    - Handle OAuth token expiration with reauthentication prompt
    - Add auto-reconnect for realtime connection drops
    - Log webhook signature failures to webhook_logs
    - _Requirements: Error Handling section_
  
  - [ ] 25.2 Add parsing and validation error handling
    - Log malformed webhook payloads
    - Display user-friendly error toasts for thread/calendar load failures
    - Return structured Zod validation errors
    - _Requirements: Error Handling section_
  
  - [ ] 25.3 Add user operation error handling
    - Preserve drafts on send failures
    - Revert optimistic UI on operation failures
    - Display 5-second undo toasts with error indicators
    - _Requirements: Error Handling section_
  
  - [ ] 25.4 Add AI operation error handling
    - Implement fallback to default lane on classification timeout
    - Show empty composer on draft generation failure
    - Log and skip embedding generation failures
    - _Requirements: Error Handling section_
  
  - [ ]* 25.5 Write unit tests for error handling
    - Test retry logic and backoff
    - Test optimistic UI reversion
    - Test fallback behaviors

- [ ] 26. Deploy to Vercel and Neon
  - [ ] 26.1 Set up production environment
    - Deploy Next.js app to Vercel
    - Connect to Neon Postgres with pgvector extension
    - Configure production environment variables in Vercel
    - Set up webhook URL using Vercel deployment URL
    - Configure the external cron pinger (cron-job.org or Upstash QStash) to hit /api/cron/process-due every minute with the CRON_SECRET
    - Enable Google OAuth with test users
    - _Requirements: 23.1, 23.2, 23.3, 23.4, 23.5, 23.6_
  
  - [ ] 26.2 Verify production deployment
    - Test initial page load completes under 2 seconds
    - Verify HTTPS serving
    - Test end-to-end Hero Workflow in production
    - _Requirements: 23.7_

- [ ] 27. Create documentation and demo video
  - [ ] 27.1 Write comprehensive README
    - Add architecture diagram showing Corsair integration
    - List all Corsair features used: Gmail plugin, Calendar plugin, webhooks, MCP adapter, search API
    - Document setup process including Google OAuth configuration
    - Include local development instructions with ngrok for webhooks
    - List bonus features: MCP chat, webhooks, shortcuts, command palette, priority filtering, Corsair search API, pgvector search
    - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.7_
  
  - [ ] 27.2 Record demo video
    - Record 3-5 minute YC-style demo video
    - Demonstrate: problem statement, solution overview, Hero Workflow live demo, Agent Chat example, tech stack explanation, Corsair benefits
    - _Requirements: 24.5, 24.6_

- [ ] 28. Final checkpoint - Complete validation
  - Run full test suite including property tests
  - Verify all requirements are met
  - Test production deployment end-to-end
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at critical milestones
- Property tests validate universal correctness properties defined in the design
- Unit tests validate specific examples, edge cases, and error conditions
- Integration tests validate external service interactions and end-to-end workflows
- The implementation uses TypeScript throughout as specified in the design document
- Corsair integration is central to the architecture, providing Gmail, Calendar, MCP, and webhook capabilities
- The workflow emphasizes building core functionality first (email, calendar) before adding advanced AI features

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "2.2"] },
    { "id": 2, "tasks": ["2.3", "3.1", "4.1"] },
    { "id": 3, "tasks": ["3.2", "3.3", "4.2", "4.3"] },
    { "id": 4, "tasks": ["6.1"] },
    { "id": 5, "tasks": ["6.2", "7.1"] },
    { "id": 6, "tasks": ["6.3", "6.4", "7.2", "7.3", "7.4", "8.1"] },
    { "id": 7, "tasks": ["8.2", "8.3", "8.4", "9.1"] },
    { "id": 8, "tasks": ["9.2", "9.3", "9.4", "9.5", "11.1"] },
    { "id": 9, "tasks": ["11.2", "11.3", "12.1"] },
    { "id": 10, "tasks": ["12.2", "12.3", "13.1"] },
    { "id": 11, "tasks": ["13.2", "13.3", "14.1"] },
    { "id": 12, "tasks": ["13.4", "14.2", "14.3", "14.4", "15.1"] },
    { "id": 13, "tasks": ["15.2", "16.1", "16.2"] },
    { "id": 14, "tasks": ["18.1"] },
    { "id": 15, "tasks": ["18.2", "18.3", "18.4", "19.1"] },
    { "id": 16, "tasks": ["19.2", "19.3", "19.4", "20.1"] },
    { "id": 17, "tasks": ["20.2", "20.3", "21.1", "21.2"] },
    { "id": 18, "tasks": ["22.1"] },
    { "id": 19, "tasks": ["22.2", "22.3", "23.1"] },
    { "id": 20, "tasks": ["23.2", "23.3"] },
    { "id": 21, "tasks": ["25.1", "25.2", "25.3", "25.4"] },
    { "id": 22, "tasks": ["25.5", "26.1"] },
    { "id": 23, "tasks": ["26.2", "27.1", "27.2"] }
  ]
}
```
