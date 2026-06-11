# Requirements Document

## Introduction

Command Inbox is a keyboard-first, scheduling-centric email and calendar command center that merges Gmail and Google Calendar into a unified interface. The system addresses the scheduling coordination burden faced by consultants, freelancers, founders, and recruiters, where 60%+ of email work involves scheduling. By treating every email as either a reply, a meeting, or noise, Command Inbox reduces the email-to-meeting workflow from 10-15 clicks to a single keystroke, delivering sub-3-second meeting creation versus 2+ minutes in traditional Gmail+Google Calendar workflows.

## Glossary

- **Command_Inbox**: The complete system comprising the user interface, backend services, and integrations
- **User**: A consultant, freelancer, founder, or recruiter who uses Command Inbox to manage email and calendar
- **Corsair**: The integration SDK embedded inside the Command_Inbox application (npm packages `corsair`, `@corsair-dev/gmail`, `@corsair-dev/googlecalendar`, `@corsair-dev/mcp`) that provides Gmail and Google Calendar access via plugins, webhooks, and MCP adapter, with its cache tables stored in the application's own Postgres database
- **Triage_Lane**: A categorization of emails into Reply, Schedule, FYI, or Done based on required action
- **Hero_Workflow**: The email-to-meeting conversion process triggered by the M keystroke
- **Thread**: An email conversation containing one or more messages
- **Calendar_Event**: A meeting or appointment in Google Calendar
- **Command_Palette**: The Mod+K interface for searching and executing actions
- **Priority_Classifier**: The AI component that analyzes incoming emails and assigns priority, lane, and scheduling intent
- **Shortcut_Registry**: The centralized configuration of keyboard shortcuts and their platform-specific representations
- **Agent_Chat**: The MCP-powered conversational interface for executing email and calendar operations
- **Availability_Picker**: The inline interface showing calendar availability within an email thread
- **Webhook_Handler**: The component that receives and processes realtime Gmail and Calendar updates from Corsair
- **Pgvector_Search**: The local semantic search capability using PostgreSQL vector embeddings
- **Multi_Tenant**: Architecture supporting multiple users with isolated data and separate Google OAuth connections
- **Platform_Detection**: The mechanism for identifying user's operating system (Mac, Windows, Android) to render appropriate keyboard hints
- **PWA**: Progressive Web App providing installable mobile experience with touch gestures
- **Send_Later**: The capability to schedule an email to be sent at a future time instead of immediately
- **Defrag_View**: The calendar view that visualizes fragmented gaps between meetings and suggests consolidations to protect focus time

## Requirements

### Requirement 1: Multi-Tenant Authentication

**User Story:** As a User, I want to sign in with my Google account and connect my Gmail and Calendar, so that I can securely access my data in a multi-tenant environment.

#### Acceptance Criteria

1. THE Command_Inbox SHALL provide Google OAuth sign-in via Better Auth
2. WHEN a User successfully authenticates, THE Command_Inbox SHALL create an isolated tenant for that User
3. WHEN a User completes sign-in, THE Command_Inbox SHALL prompt the User to connect Gmail and Google Calendar via Corsair
4. WHEN a User connects Gmail and Calendar, THE Command_Inbox SHALL store the per-tenant connection via the embedded Corsair SDK with multi-tenancy enabled (no per-user Corsair API keys; Users only complete Google OAuth)
5. THE Command_Inbox SHALL maintain data isolation between tenants in the database
6. WHEN a User's OAuth token expires, THE Command_Inbox SHALL prompt for reauthentication

### Requirement 2: Email Thread Display

**User Story:** As a User, I want to view my email threads organized by triage lane, so that I can focus on actionable messages.

#### Acceptance Criteria

1. THE Command_Inbox SHALL retrieve email threads via Corsair Gmail plugin
2. THE Command_Inbox SHALL display threads in a list with subject, sender, timestamp, and priority indicator
3. THE Command_Inbox SHALL organize threads into Triage_Lanes: Reply, Schedule, FYI, and Done
4. WHEN a User selects a thread, THE Command_Inbox SHALL display the full conversation in the thread view
5. THE Command_Inbox SHALL render threads with relative timestamps
6. THE Command_Inbox SHALL display RSVP status chips on threads associated with Calendar_Events
7. THE Command_Inbox SHALL load thread data from Corsair's local database cache within 1 second
8. THE Done lane SHALL contain both archived threads and threads the Priority_Classifier deems no-action; WHEN a User archives a thread, THE Command_Inbox SHALL move it to the Done lane
9. THE Command_Inbox SHALL hide the Done lane from the main triage flow, accessible via a separate view

### Requirement 3: Calendar Week Strip Display

**User Story:** As a User, I want to see my weekly calendar alongside my inbox, so that I can view availability while processing emails.

#### Acceptance Criteria

1. THE Command_Inbox SHALL retrieve Calendar_Events via Corsair Google Calendar plugin
2. THE Command_Inbox SHALL display a week strip showing the current week's events
3. THE Command_Inbox SHALL position the week strip adjacent to the thread view
4. WHEN a User navigates to a different week, THE Command_Inbox SHALL update the week strip within 500 milliseconds
5. THE Command_Inbox SHALL display event title, time, and attendee count for each Calendar_Event
6. THE Command_Inbox SHALL highlight the current time slot in the week strip

### Requirement 4: Email Send and Reply

**User Story:** As a User, I want to send new emails and reply to threads via keyboard shortcuts, so that I can communicate efficiently.

#### Acceptance Criteria

1. WHEN a User presses the R key while viewing a thread, THE Command_Inbox SHALL open a reply composer
2. WHEN a User presses Mod+Enter in the composer, THE Command_Inbox SHALL send the email via Corsair Gmail plugin
3. THE Command_Inbox SHALL display optimistic UI feedback immediately upon send action
4. WHEN the send operation completes, THE Command_Inbox SHALL update the thread view with the sent message
5. IF the send operation fails, THEN THE Command_Inbox SHALL display an error message and preserve the draft
6. THE Command_Inbox SHALL support rich text formatting in the composer
7. WHEN a User sends an email, THE Command_Inbox SHALL send it within 2 seconds
8. WHEN a User selects Send_Later in the composer, THE Command_Inbox SHALL prompt for a scheduled send time
9. WHEN a User confirms a Send_Later time, THE Command_Inbox SHALL store the scheduled send and dispatch the email via Corsair when the scheduled time arrives
10. THE Command_Inbox SHALL allow the User to view, edit, or cancel a scheduled send before its send time

### Requirement 5: Email Archive and Snooze

**User Story:** As a User, I want to archive or snooze emails with single keystrokes, so that I can process my inbox quickly.

#### Acceptance Criteria

1. WHEN a User presses the E key while viewing a thread, THE Command_Inbox SHALL archive the thread via Corsair
2. WHEN a User presses the S key while viewing a thread, THE Command_Inbox SHALL prompt for snooze duration
3. WHEN a User confirms snooze, THE Command_Inbox SHALL hide the thread and store the snooze time in the database
4. WHEN the snooze time expires, THE Command_Inbox SHALL return the thread to the appropriate Triage_Lane
5. WHEN a User archives or snoozes a thread, THE Command_Inbox SHALL display an undo toast for 5 seconds
6. WHEN a User clicks undo, THE Command_Inbox SHALL reverse the archive or snooze action
7. THE Command_Inbox SHALL complete archive operations within 1 second

### Requirement 6: Realtime Email Webhook Processing

**User Story:** As a User, I want new emails to appear in my inbox immediately, so that I can respond to urgent messages without delay.

#### Acceptance Criteria

1. THE Command_Inbox SHALL expose a webhook endpoint at /api/webhooks for Corsair notifications
2. WHEN Corsair sends a webhook notification, THE Command_Inbox SHALL verify the webhook signature from the HTTP request header against the raw request body
3. IF the webhook signature header is missing or invalid, THEN THE Command_Inbox SHALL reject the request with HTTP 401
4. WHEN a valid Gmail webhook arrives, THE Command_Inbox SHALL retrieve the new thread from Corsair cache
5. WHEN a new thread is retrieved, THE Command_Inbox SHALL pass it to the Priority_Classifier
6. WHEN classification completes, THE Command_Inbox SHALL push the update to connected clients via Pusher
7. THE Command_Inbox SHALL process webhook notifications within 2 seconds

### Requirement 7: AI Priority Classification

**User Story:** As a User, I want incoming emails automatically categorized by priority and triage lane, so that I can focus on high-value messages.

#### Acceptance Criteria

1. WHEN the Webhook_Handler receives a new email, THE Priority_Classifier SHALL analyze the subject and body
2. THE Priority_Classifier SHALL use Gemini Flash (gemini-2.0-flash) for classification
3. THE Priority_Classifier SHALL assign a priority level: High, Medium, or Low
4. THE Priority_Classifier SHALL assign a Triage_Lane: Reply, Schedule, FYI, or Done
5. THE Priority_Classifier SHALL extract scheduling intent including proposed times and attendees
6. THE Priority_Classifier SHALL store classification results in the database
7. THE Priority_Classifier SHALL complete classification within 1.5 seconds per email
8. WHEN a User first connects Gmail, THE Command_Inbox SHALL run an initial backfill that classifies and embeds the 50 most recent threads from the Corsair cache in rate-limit-respecting batches
9. WHILE the initial backfill is running, THE Command_Inbox SHALL display a "Setting up your inbox" progress indicator
10. THE Command_Inbox SHALL leave threads older than the backfill window unclassified; they remain reachable via advanced search but do not appear in Triage_Lanes or semantic search

### Requirement 8: Pgvector Semantic Search

**User Story:** As a User, I want to search across all my email history using natural language, so that I can find messages in under 1 second.

#### Acceptance Criteria

1. WHEN the Webhook_Handler processes a new email, THE Command_Inbox SHALL generate an embedding using text-embedding-004
2. THE Command_Inbox SHALL store the embedding in PostgreSQL using the pgvector extension
3. WHEN a User presses the / key, THE Command_Inbox SHALL open a search input
4. WHEN a User enters a search query, THE Pgvector_Search SHALL generate an embedding for the query
5. THE Pgvector_Search SHALL perform vector similarity search against stored embeddings
6. THE Pgvector_Search SHALL return ranked results within 1 second
7. THE Command_Inbox SHALL display search results with highlighted snippets

### Requirement 9: Hero Workflow - Email to Meeting Conversion

**User Story:** As a User, I want to convert an email to a calendar meeting with one keystroke, so that I can schedule meetings in under 3 seconds.

#### Acceptance Criteria

1. WHEN a User presses the M key while viewing a thread, THE Command_Inbox SHALL extract scheduling information from the thread
2. THE Command_Inbox SHALL use the Priority_Classifier's scheduling intent extraction
3. WHEN scheduling information is extracted, THE Availability_Picker SHALL display the User's calendar availability inline
4. THE Availability_Picker SHALL show proposed times from the email alongside available slots
5. WHEN a User presses Enter on a time slot, THE Command_Inbox SHALL create a Calendar_Event via Corsair
6. WHEN the Calendar_Event is created, THE Command_Inbox SHALL generate an AI-drafted confirmation reply
7. THE Command_Inbox SHALL queue the confirmation reply for User review before sending
8. THE Command_Inbox SHALL complete the email-to-meeting workflow within 3 seconds
9. THE M keystroke SHALL work on any thread: IF the scheduling intent is null or its confidence is below 0.5, THEN THE Availability_Picker SHALL open in manual mode showing the User's next free slots with a 30-minute default duration and attendees pre-filled from thread participants
10. WHEN scheduling intent exists with confidence of 0.5 or higher, THE Availability_Picker SHALL display proposed times from the email as highlighted chips above the free slots

### Requirement 10: Calendar Event Management

**User Story:** As a User, I want to create, update, and cancel calendar events with keyboard shortcuts, so that I can manage my schedule without using a mouse.

#### Acceptance Criteria

1. WHEN a User creates a Calendar_Event, THE Command_Inbox SHALL send the event via Corsair Google Calendar plugin
2. WHEN a User updates a Calendar_Event, THE Command_Inbox SHALL modify the event via Corsair within 1 second
3. WHEN a User cancels a Calendar_Event, THE Command_Inbox SHALL delete the event via Corsair and send cancellation emails
4. THE Command_Inbox SHALL display optimistic UI updates for all calendar operations
5. IF a calendar operation fails, THEN THE Command_Inbox SHALL revert the optimistic UI and display an error
6. THE Command_Inbox SHALL support adding attendees, setting event time, and specifying location

### Requirement 11: Command Palette

**User Story:** As a User, I want to access all actions through a searchable command palette, so that I can execute any command without memorizing shortcuts.

#### Acceptance Criteria

1. WHEN a User presses Mod+K, THE Command_Palette SHALL open with focus on the search input
2. THE Command_Palette SHALL display all available actions from the Shortcut_Registry
3. WHEN a User types in the Command_Palette, THE Command_Inbox SHALL filter actions by fuzzy matching
4. WHEN a User selects an action, THE Command_Inbox SHALL execute the action and close the Command_Palette
5. WHEN a User presses Escape, THE Command_Palette SHALL close
6. THE Command_Palette SHALL display keyboard shortcuts next to each action
7. THE Command_Palette SHALL render in under 100 milliseconds

### Requirement 12: Cross-Platform Keyboard Shortcuts

**User Story:** As a User, I want keyboard shortcuts that work natively on my platform without conflicting with OS or browser shortcuts, so that I can use Command Inbox efficiently on any device.

#### Acceptance Criteria

1. THE Platform_Detection SHALL identify the User's operating system on initial load
2. THE Command_Inbox SHALL render Cmd symbol (⌘) on Mac and Ctrl on Windows and Linux
3. THE Shortcut_Registry SHALL map single-key shortcuts: J (next), K (previous), E (archive), R (reply), M (meeting), / (search), ? (help), X (select), S (snooze)
4. THE Shortcut_Registry SHALL map modifier shortcuts using Mod key: Mod+K (palette), Mod+Enter (send), Mod+Shift+F (advanced search)
5. WHEN a User focuses an input, textarea, or contenteditable element, THE Command_Inbox SHALL disable single-key shortcuts
6. WHEN a User unfocuses input elements, THE Command_Inbox SHALL re-enable single-key shortcuts
7. THE Command_Inbox SHALL call preventDefault on Mod+K to prevent browser default behavior
8. WHEN a User presses Escape, THE Command_Inbox SHALL close the topmost modal or panel
9. THE Command_Inbox SHALL avoid binding shortcuts that conflict with browser defaults: Mod+W, Mod+T, Mod+N, Mod+L, Mod+D, Ctrl+Shift+K

### Requirement 13: Shortcut Cheat Sheet

**User Story:** As a User, I want to view all available shortcuts, so that I can learn keyboard navigation.

#### Acceptance Criteria

1. WHEN a User presses the ? key, THE Command_Inbox SHALL display a cheat sheet overlay
2. THE Command_Inbox SHALL render shortcuts from the Shortcut_Registry with platform-specific modifier keys
3. THE Command_Inbox SHALL group shortcuts by context: Global, List, Thread, Composer
4. WHEN a User presses Escape or ?, THE Command_Inbox SHALL close the cheat sheet
5. THE cheat sheet SHALL display in under 100 milliseconds

### Requirement 14: Mobile PWA with Touch Gestures

**User Story:** As a User on Android, I want to use Command Inbox as a Progressive Web App with touch gestures, so that I can manage email and calendar on mobile devices.

#### Acceptance Criteria

1. THE Command_Inbox SHALL provide a PWA manifest for installation on Android
2. THE Command_Inbox SHALL render a responsive layout on mobile devices with bottom tab navigation
3. WHEN a User swipes right on a thread, THE Command_Inbox SHALL archive the thread
4. WHEN a User swipes left on a thread, THE Command_Inbox SHALL open snooze options
5. WHEN a User long-presses a thread, THE Command_Inbox SHALL enter multi-select mode
6. THE Command_Inbox SHALL display a floating action button that opens the Command_Palette on tap
7. THE Command_Inbox SHALL support touch-based navigation through inbox, calendar, and Agent_Chat tabs
8. THE multi-select mode (long-press on mobile, X key on desktop) SHALL support exactly two bulk actions: bulk archive and bulk snooze

### Requirement 15: Agent Chat with MCP

**User Story:** As a User, I want to interact with an AI agent to execute email and calendar operations via natural language, so that I can delegate complex workflows.

#### Acceptance Criteria

1. THE Command_Inbox SHALL provide an Agent_Chat panel accessible via keyboard shortcut or tab
2. THE Agent_Chat SHALL use Corsair MCP adapter for tool access
3. THE Agent_Chat SHALL use Vercel AI SDK with Gemini Flash for conversation
4. WHEN a User sends a message to Agent_Chat, THE Command_Inbox SHALL process the request and call appropriate MCP tools
5. WHEN Agent_Chat attempts to send an email or create a Calendar_Event, THE Command_Inbox SHALL display an approval dialog
6. WHEN a User approves an action, THE Agent_Chat SHALL execute the operation via Corsair
7. WHEN a User denies an action, THE Agent_Chat SHALL acknowledge the denial and not execute
8. THE Agent_Chat SHALL respond to the example prompt: "Send a calendar invite to friend@corsair.dev at 9 AM next Thursday, and email him saying I look forward to it"

### Requirement 16: AI Reply Drafts

**User Story:** As a User, I want the system to generate contextual reply drafts, so that I can respond to emails faster.

#### Acceptance Criteria

1. WHEN a User opens a reply composer, THE Command_Inbox SHALL analyze the thread context
2. THE Command_Inbox SHALL use Gemini Flash to generate a contextual reply draft
3. THE Command_Inbox SHALL display the draft in the composer with clear indication it is AI-generated
4. THE Command_Inbox SHALL allow the User to edit the draft before sending
5. THE Command_Inbox SHALL support tone presets: Professional, Friendly, Brief
6. WHEN a User selects a tone preset, THE Command_Inbox SHALL regenerate the draft with that tone
7. THE Command_Inbox SHALL generate drafts within 2 seconds

### Requirement 17: Advanced Search UI

**User Story:** As a User, I want to perform advanced searches using filters for sender, date range, and labels, so that I can find specific emails quickly.

#### Acceptance Criteria

1. WHEN a User presses Mod+Shift+F, THE Command_Inbox SHALL open the advanced search interface
2. THE Command_Inbox SHALL provide filter inputs for sender, date range, has attachment, and Triage_Lane
3. WHEN a User applies filters, THE Command_Inbox SHALL query via Corsair search API
4. THE Command_Inbox SHALL combine Corsair search with Pgvector_Search for semantic filtering
5. THE Command_Inbox SHALL display search results with highlighted matches
6. THE Command_Inbox SHALL return advanced search results within 1.5 seconds

### Requirement 18: Realtime UI Updates

**User Story:** As a User, I want the interface to update in realtime when new emails arrive or calendar events change, so that I always see current data.

#### Acceptance Criteria

1. THE Command_Inbox SHALL establish a Pusher Channels connection on client load
2. WHEN the Webhook_Handler processes an update, THE Command_Inbox SHALL broadcast via Pusher
3. WHEN a client receives a realtime update, THE Command_Inbox SHALL update the UI without full page reload
4. IF the Pusher connection fails, THEN THE Command_Inbox SHALL fall back to polling Postgres every 5 seconds
5. THE Command_Inbox SHALL display a connection status indicator
6. THE Command_Inbox SHALL reconnect automatically if the realtime connection drops

### Requirement 19: Optimistic UI and Undo

**User Story:** As a User, I want immediate feedback when I take actions, with the ability to undo destructive operations, so that I can work confidently at high speed.

#### Acceptance Criteria

1. WHEN a User executes an action (send, archive, snooze, create event), THE Command_Inbox SHALL update the UI immediately
2. THE Command_Inbox SHALL proceed with the backend operation asynchronously
3. IF the backend operation fails, THEN THE Command_Inbox SHALL revert the optimistic UI change and display an error toast
4. WHEN a User completes a destructive action (archive, send, delete event), THE Command_Inbox SHALL display an undo toast for 5 seconds
5. WHEN a User clicks undo, THE Command_Inbox SHALL reverse the action via Corsair
6. WHEN a User sends an email, THE Command_Inbox SHALL hold the dispatch server-side for 5 seconds; WHEN the User clicks undo within that window, THE Command_Inbox SHALL cancel the send before it reaches Corsair and reopen the composer with the content
7. THE Command_Inbox SHALL provide visual feedback (skeleton loaders, progress indicators) during operations

### Requirement 20: Dark Theme and Visual Design

**User Story:** As a User, I want a polished dark theme interface with consistent spacing and motion, so that I can work comfortably for extended periods.

#### Acceptance Criteria

1. THE Command_Inbox SHALL render a dark theme by default using shadcn/ui and Tailwind
2. THE Command_Inbox SHALL provide a light theme toggle accessible via settings
3. THE Command_Inbox SHALL apply an 8px spacing grid consistently across all components
4. THE Command_Inbox SHALL use Inter or Geist font family for typography
5. THE Command_Inbox SHALL implement subtle motion using Framer Motion for transitions
6. THE Command_Inbox SHALL render custom focus rings (no browser defaults)
7. THE Command_Inbox SHALL display polished empty states with shortcut hints
8. THE Command_Inbox SHALL prevent layout shift during loading
9. THE Command_Inbox SHALL render in-context shortcut hint tooltips on hover and focus of actionable elements, so Users learn keyboard shortcuts passively

### Requirement 21: Data Parsing and Round-Trip Validation

**User Story:** As a developer, I want all data parsers (email headers, calendar event formats, webhook payloads) to be validated with round-trip properties, so that data integrity is guaranteed.

#### Acceptance Criteria

1. THE Command_Inbox SHALL parse webhook payloads using zod schemas
2. THE Command_Inbox SHALL validate email thread data from Corsair using typed schemas
3. THE Command_Inbox SHALL validate Calendar_Event data from Corsair using typed schemas
4. THE Command_Inbox SHALL implement serializers for all parsed data structures
5. FOR ALL valid webhook payloads, parsing then serializing then parsing SHALL produce an equivalent object
6. FOR ALL valid thread objects, parsing then serializing then parsing SHALL produce an equivalent object
7. FOR ALL valid Calendar_Event objects, parsing then serializing then parsing SHALL produce an equivalent object
8. IF parsing fails, THEN THE Command_Inbox SHALL log the error with the raw payload and return a descriptive error message

### Requirement 22: Database Migrations and Type Safety

**User Story:** As a developer, I want type-safe database access with versioned migrations, so that schema changes are reproducible and safe.

#### Acceptance Criteria

1. THE Command_Inbox SHALL use Drizzle ORM for all database operations
2. THE Command_Inbox SHALL define database schemas using Drizzle schema syntax
3. THE Command_Inbox SHALL generate TypeScript types from Drizzle schemas
4. WHEN a schema change is needed, THE Command_Inbox SHALL create a new migration file
5. THE Command_Inbox SHALL apply migrations in sequential order on deployment
6. THE Command_Inbox SHALL validate environment variables using zod on application start
7. IF environment validation fails, THEN THE Command_Inbox SHALL prevent application startup and log missing variables

### Requirement 23: Deployment to Vercel and Neon

**User Story:** As a developer, I want to deploy Command Inbox to Vercel with Neon Postgres, so that the application is accessible online with production-grade infrastructure.

#### Acceptance Criteria

1. THE Command_Inbox SHALL deploy to Vercel using the Next.js 15 App Router
2. THE Command_Inbox SHALL connect to Neon Postgres with pgvector extension enabled
3. THE Command_Inbox SHALL configure environment variables in Vercel for production
4. THE Command_Inbox SHALL use the deployed Vercel URL for Corsair webhook notifications
5. THE Command_Inbox SHALL enable Google OAuth in production mode with test users for judges
6. THE Command_Inbox SHALL serve the application over HTTPS
7. THE Command_Inbox SHALL complete initial page load in under 2 seconds

### Requirement 24: Documentation and Demo Video

**User Story:** As a judge or new user, I want comprehensive documentation and a demo video, so that I can understand the architecture and see the product in action.

#### Acceptance Criteria

1. THE Command_Inbox SHALL provide a README with architecture diagram showing Corsair integration
2. THE README SHALL list all Corsair features used: Gmail plugin, Calendar plugin, webhooks, MCP adapter, search API
3. THE README SHALL document the setup process including Google OAuth configuration
4. THE README SHALL include instructions for local development with ngrok for webhooks
5. THE Command_Inbox SHALL include a recorded YC-style demo video (3-5 minutes)
6. THE demo video SHALL demonstrate: problem statement, solution overview, Hero_Workflow live demo, Agent_Chat example, tech stack explanation, Corsair benefits
7. THE README SHALL list bonus features completed: MCP chat, webhooks, shortcuts, command palette, priority filtering, Corsair search API, pgvector search

### Requirement 25: Defrag My Week View

**User Story:** As a User, I want a view that shows how fragmented my week is and suggests consolidating meetings, so that I can protect contiguous focus time.

#### Acceptance Criteria

1. THE Command_Inbox SHALL provide a Defrag_View accessible from the calendar week strip
2. THE Defrag_View SHALL visualize gaps between Calendar_Events and highlight fragmented time blocks shorter than 60 minutes
3. THE Defrag_View SHALL compute and display total focus time (contiguous free blocks of 2+ hours) for the current week
4. THE Defrag_View SHALL suggest meeting moves that would consolidate fragmented gaps into larger focus blocks, considering only the User's own availability
5. WHEN a User accepts a suggested move, THE Command_Inbox SHALL update the Calendar_Event via Corsair and notify attendees
6. WHEN a User dismisses a suggestion, THE Defrag_View SHALL not propose the same move again in the current session
