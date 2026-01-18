# API Documentation

## Endpoints

### 1. POST /api/analyze

Analyzes a single screenshot and extracts structured information.

### 2. POST /api/summarize

Creates a condensed, intelligent summary from session entities with AI-powered insights.

### 3. POST /api/regenerate

Regenerates session-level analysis from multiple screenshot analyses.

### 4. POST /api/chat

AI-powered chat for editing markdown notes or answering questions about session content.

### 5. GET /api/sessions

Lists all sessions for a user.

### 6. GET /api/sessions/[id]

Retrieves detailed information for a specific session.

---

## POST /api/analyze

Base URL (Production): `https://relay-that-backend-ibaiy8nho-andrewmahran7s-projects.vercel.app`

Base URL (Local): `http://localhost:3000`

## Request

### Headers
```
Content-Type: application/json
```

### Body
```json
{
  "image": "data:image/png;base64,iVBORw0KGg..."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `image` | string | Yes | PNG data URL with base64 encoded image |

## Response

### Success Response (200 OK)

```json
{
  "rawText": "string",
  "summary": "string",
  "category": "string",
  "entities": [
    {
      "type": "string",
      "title": "string | null",
      "attributes": {
        "key": "value"
      }
    }
  ],
  "suggestedNotebookTitle": "string | null"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `rawText` | string | Full OCR text extracted from screenshot |
| `summary` | string | 1-3 sentence description of screenshot content |
| `category` | string | One of: `trip-planning`, `shopping`, `job-search`, `research`, `content-writing`, `productivity`, `other` |
| `entities` | array | List of extracted items/objects |
| `entities[].type` | string | Entity type (e.g., `hotel`, `product`, `job`, `flight`) |
| `entities[].title` | string\|null | Main name/title of the entity |
| `entities[].attributes` | object | Key-value pairs of entity metadata |
| `suggestedNotebookTitle` | string\|null | Suggested notebook title based on context |

## Example

### Request
```bash
curl -X POST https://relay-that-backend-ibaiy8nho-andrewmahran7s-projects.vercel.app/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "image": "data:image/png;base64,iVBORw0KGgoAAAA..."
  }'
```

### Response
```json
{
  "rawText": "One&Only Palmilla, Los Cabos\n5 stars\n9.8 Exceptional\n652 reviews\n$850/night\nBeachfront Resort",
  "summary": "User is viewing a luxury beachfront hotel in Los Cabos with exceptional ratings and premium pricing.",
  "category": "trip-planning",
  "entities": [
    {
      "type": "hotel",
      "title": "One&Only Palmilla",
      "attributes": {
        "location": "Los Cabos, Baja California",
        "price": "$850/night",
        "rating": "9.8 Exceptional",
        "stars": "5",
        "reviews": "652",
        "amenities": "Beachfront, VIP Access"
      }
    }
  ],
  "suggestedNotebookTitle": "Los Cabos Hotels"
}
```

## Categories

| Category | Description | Example Use Cases |
|----------|-------------|-------------------|
| `trip-planning` | Travel research | Hotels, flights, restaurants, rentals |
| `shopping` | Product research | Electronics, clothing, comparisons |
| `job-search` | Career hunting | Job postings, company research |
| `research` | Information gathering | Articles, documentation, courses |
| `content-writing` | Writing & editing | Drafts, notes, writing tools |
| `productivity` | Task management | Tasks, calendars, project management |
| `other` | Everything else | Generic or unclear content |

## Common Entity Types

| Type | Common Attributes |
|------|-------------------|
| `hotel` | price, rating, location, stars, reviews, amenities, url |
| `product` | price, brand, model, specs, color, availability, url |
| `job` | company, salary, location, employment_type, work_mode |
| `flight` | airline, flight_number, origin, destination, departure, arrival, price, class |
| `restaurant` | cuisine, rating, reviews, price_level, location, hours |
| `article` | author, date, source, read_time, topic, url |
| `course` | instructor, institution, platform, duration, level, price |
| `rental` | bedrooms, bathrooms, size, price, rating, reviews, location |

## Error Handling

The API always returns a valid response. On error, returns:

```json
{
  "rawText": "",
  "summary": "",
  "category": "other",
  "entities": [],
  "suggestedNotebookTitle": null
}
```

No error is thrown - the fallback ensures frontend can continue working.

## CORS

Cross-origin requests are allowed:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`

---

## POST /api/regenerate

Regenerates session-level summary and entities from multiple screenshot analyses.

### Purpose

Called when the session/notebook changes (screenshot added/deleted). Does NOT take images - only takes JSON outputs from `/api/analyze` plus previous session state. Returns updated session-level summary, category, and merged entities WITHOUT restarting the idea.

### Request

#### Headers
```
Content-Type: application/json
```

#### Body
```json
{
  "sessionId": "string",
  "previousSession": {
    "sessionSummary": "string",
    "sessionCategory": "string",
    "entities": [...]
  },
  "screens": [
    {
      "id": "string",
      "analysis": {
        "rawText": "string",
        "summary": "string",
        "category": "string",
        "entities": [...],
        "suggestedNotebookTitle": "string | null"
      }
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sessionId` | string | Yes | Unique session/notebook identifier |
| `previousSession` | object | No | Previous session state (maintains continuity) |
| `previousSession.sessionSummary` | string | Yes* | Previous session summary |
| `previousSession.sessionCategory` | string | Yes* | Previous session category |
| `previousSession.entities` | array | Yes* | Previous merged entities |
| `screens` | array | Yes | All CURRENT screenshots with their analysis |
| `screens[].id` | string | Yes | Screenshot identifier |
| `screens[].analysis` | object | Yes | Full AnalyzeResponse from /api/analyze |

*Required if `previousSession` is provided

### Response

#### Success Response (200 OK)

```json
{
  "sessionId": "string",
  "sessionSummary": "string",
  "sessionCategory": "string",
  "entities": [...],
  "suggestedNotebookTitle": "string | null"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `sessionId` | string | Same session ID from request |
| `sessionSummary` | string | 1-3 sentence description of entire session |
| `sessionCategory` | string | Overall category for the session |
| `entities` | array | Merged/deduplicated entities across all screens |
| `suggestedNotebookTitle` | string\|null | Suggested notebook title |

### Example

#### Request
```bash
curl -X POST http://localhost:3000/api/regenerate \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-123",
    "previousSession": {
      "sessionSummary": "User is researching hotels in Los Cabos",
      "sessionCategory": "trip-planning",
      "entities": [...]
    },
    "screens": [
      {
        "id": "screen-1",
        "analysis": {
          "rawText": "One&Only Palmilla...",
          "summary": "Luxury hotel in Los Cabos",
          "category": "trip-planning",
          "entities": [...],
          "suggestedNotebookTitle": "Los Cabos Hotels"
        }
      }
    ]
  }'
```

#### Response
```json
{
  "sessionId": "session-123",
  "sessionSummary": "User is planning a luxury trip to Los Cabos, comparing high-end resorts and flight options.",
  "sessionCategory": "trip-planning",
  "entities": [
    {
      "type": "hotel",
      "title": "One&Only Palmilla",
      "attributes": {
        "location": "Los Cabos, Mexico",
        "price": "$850/night",
        "rating": "9.8 Exceptional"
      }
    },
    {
      "type": "flight",
      "title": "UA 1234 SFO → SJD",
      "attributes": {
        "airline": "United Airlines",
        "price": "$450",
        "class": "Economy"
      }
    }
  ],
  "suggestedNotebookTitle": "Los Cabos Trip Planning"
}
```

### Behavior Notes

1. **Maintains Continuity**: Uses `previousSession` to avoid restarting or drifting from the core idea
2. **Merges Entities**: Intelligently deduplicates similar entities across screens
3. **Updates Summary**: Refines session-level summary based on all current screens
4. **Never Restarts**: The AI is instructed to maintain the established context
5. **Fallback on Error**: Always returns valid JSON, even if Gemini API fails

### Test Script

Run locally:
```bash
node test-regenerate.mjs
```

### CORS

Cross-origin requests are allowed (same as /api/analyze)

---

## POST /api/summarize

Creates a condensed, intelligent summary from session entities with actionable insights and recommendations.

### Purpose

Takes all entities from a session and uses AI to create:
- A condensed overview (2-4 sentences)
- Key highlights (top 3-5 bullet points)
- Actionable recommendations (2-3 suggestions)
- Merged/deduplicated entities
- An improved session title

### Request

#### Headers
```
Content-Type: application/json
```

#### Body
```json
{
  "sessionId": "string",
  "sessionName": "string",
  "entities": [
    {
      "type": "string",
      "title": "string | null",
      "attributes": {
        "key": "value"
      }
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sessionId` | string | Yes | Unique session identifier |
| `sessionName` | string | Yes | Current session/notebook name |
| `entities` | array | Yes | All entities from the session |
| `entities[].type` | string | Yes | Entity type |
| `entities[].title` | string\|null | Yes | Entity title |
| `entities[].attributes` | object | Yes | Entity metadata |

### Response

#### Success Response (200 OK)

```json
{
  "condensedSummary": "string",
  "keyHighlights": ["string", "string", "string"],
  "recommendations": ["string", "string"],
  "mergedEntities": [...],
  "suggestedTitle": "string"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `condensedSummary` | string | AI-generated 2-4 sentence overview |
| `keyHighlights` | array | 3-5 most important bullet points |
| `recommendations` | array | 2-3 actionable suggestions |
| `mergedEntities` | array | Deduplicated/merged entities |
| `suggestedTitle` | string | AI-suggested session title |

### Example

#### Request
```bash
curl -X POST http://localhost:3000/api/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "abc-123",
    "sessionName": "Trip to Taiwan",
    "entities": [
      {
        "type": "hotel",
        "title": "Grand Hyatt Taipei",
        "attributes": {
          "price": "$250/night",
          "rating": "4.8",
          "location": "Xinyi District"
        }
      },
      {
        "type": "hotel",
        "title": "W Taipei",
        "attributes": {
          "price": "$300/night",
          "rating": "4.6",
          "location": "Xinyi District"
        }
      },
      {
        "type": "restaurant",
        "title": "Din Tai Fung",
        "attributes": {
          "cuisine": "Taiwanese",
          "rating": "4.9"
        }
      }
    ]
  }'
```

#### Response
```json
{
  "condensedSummary": "Planning a trip to Taipei with focus on luxury hotels in Xinyi District. The Grand Hyatt offers better value at $250/night with a higher rating than W Taipei. Din Tai Fung is a must-visit for authentic Taiwanese cuisine.",
  "keyHighlights": [
    "Grand Hyatt Taipei: Best value at $250/night, 4.8 rating",
    "W Taipei: Premium option at $300/night",
    "Din Tai Fung: Top-rated Taiwanese restaurant (4.9★)"
  ],
  "recommendations": [
    "Book Grand Hyatt for best price-to-quality ratio",
    "Make Din Tai Fung reservation in advance - very popular",
    "Both hotels are in Xinyi District - convenient for exploring"
  ],
  "mergedEntities": [
    {
      "type": "hotel-comparison",
      "title": "Taipei Hotels Comparison",
      "attributes": {
        "best_value": "Grand Hyatt ($250, 4.8★)",
        "premium_option": "W Taipei ($300, 4.6★)",
        "location": "Xinyi District"
      }
    },
    {
      "type": "restaurant",
      "title": "Din Tai Fung",
      "attributes": {
        "cuisine": "Taiwanese",
        "rating": "4.9",
        "note": "Must-visit"
      }
    }
  ],
  "suggestedTitle": "Taipei Trip: Hotels & Dining"
}
```

### Use Cases

- **Smart Summaries**: Get AI-generated insights from collected research
- **Decision Support**: Receive recommendations based on gathered data
- **Data Consolidation**: Merge similar entities into comparisons
- **Title Suggestions**: Get better naming for sessions

### Test Script

Run locally:
```bash
node test-summarize.mjs
```

### CORS

Cross-origin requests are allowed (same as /api/analyze)

---

## POST /api/chat

AI-powered chat endpoint that can both edit markdown notes and answer questions about session content.

### Purpose

Provides an intelligent chat interface that:
- **Edits notes** based on user commands ("remove the third item", "add a budget section")
- **Answers questions** about note content and session context
- **Uses session context** including screenshots, summaries, and session metadata
- **Preserves markdown structure** when making edits

### Request

#### Headers
```
Content-Type: application/json
```

#### Body
```json
{
  "sessionId": "string",
  "userMessage": "string",
  "currentNote": "string",
  "context": {
    "screenshots": [
      {
        "id": "string",
        "rawText": "string",
        "summary": "string"
      }
    ],
    "sessionName": "string",
    "sessionCategory": "string"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sessionId` | string | Yes | Unique session identifier |
| `userMessage` | string | Yes | User's chat message/command |
| `currentNote` | string | Yes | Current markdown note content |
| `context` | object | No | Additional context for AI |
| `context.screenshots` | array | No | Screenshot OCR text and summaries |
| `context.sessionName` | string | No | Name of the session |
| `context.sessionCategory` | string | No | Category (travel, shopping, etc.) |

### Response

#### Success Response (200 OK)

```json
{
  "reply": "string",
  "updatedNote": "string",
  "noteWasModified": boolean
}
```

| Field | Type | Description |
|-------|------|-------------|
| `reply` | string | AI's response message to the user |
| `updatedNote` | string | Modified note (if edit) or unchanged (if question) |
| `noteWasModified` | boolean | Whether the note was edited |

### Examples

#### Example 1: Edit Command - Remove Item

**Request:**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-123",
    "userMessage": "Remove the Cross Hotel Osaka from my list",
    "currentNote": "# Japan Trip\n\n## Hotels\n- Grand Hyatt Tokyo: $350/night\n- Cross Hotel Osaka: $180/night",
    "context": {
      "sessionName": "Japan Trip Planning",
      "sessionCategory": "travel"
    }
  }'
```

**Response:**
```json
{
  "reply": "Done! I've removed the Cross Hotel Osaka.",
  "updatedNote": "# Japan Trip\n\n## Hotels\n- Grand Hyatt Tokyo: $350/night",
  "noteWasModified": true
}
```

#### Example 2: Question

**Request:**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-123",
    "userMessage": "What'\''s my total budget for this trip?",
    "currentNote": "# Japan Trip\n\n## Budget\n- Total: $8,000 for 2 people\n- Flights: $2,000\n- Hotels: $4,500",
    "context": {
      "sessionName": "Japan Trip Planning"
    }
  }'
```

**Response:**
```json
{
  "reply": "Your total estimated budget for the trip is $8,000 for 2 people.",
  "updatedNote": "# Japan Trip\n\n## Budget\n- Total: $8,000 for 2 people\n- Flights: $2,000\n- Hotels: $4,500",
  "noteWasModified": false
}
```

#### Example 3: Edit Command - Add Section

**Request:**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-123",
    "userMessage": "Add a Transportation section with JR Pass info",
    "currentNote": "# Japan Trip\n\n## Hotels\n- Grand Hyatt Tokyo: $350/night",
    "context": {
      "sessionName": "Japan Trip Planning"
    }
  }'
```

**Response:**
```json
{
  "reply": "Done! I've added a 'Transportation' section with info about JR Pass.",
  "updatedNote": "# Japan Trip\n\n## Hotels\n- Grand Hyatt Tokyo: $350/night\n\n## Transportation\n- JR Pass: 7-day pass for unlimited train travel",
  "noteWasModified": true
}
```

### Command Types

**Edit Commands** (modifies note):
- "Remove the third recommendation"
- "Rewrite the summary to be shorter"
- "Add a section about budget"
- "Change the title to 'My Japan Adventure'"
- "Delete the second hotel"
- "Make this more concise"

**Questions** (no modification):
- "What hotels did I look at?"
- "Summarize what's in my notes"
- "What was the price of the second hotel?"
- "How many recommendations do I have?"
- "What amenities does the hotel have?" (uses screenshot context)

### Error Responses

#### 400 Bad Request - Missing Required Fields
```json
{
  "error": "Invalid request",
  "message": "userMessage is required and must be a string"
}
```

#### 500 Internal Server Error - Missing API Key
```json
{
  "error": "Missing GEMINI_API_KEY"
}
```

#### Fallback Response - AI Processing Error
```json
{
  "reply": "Sorry, I couldn't process that request, but your note is unchanged.",
  "updatedNote": "<original note content>",
  "noteWasModified": false
}
```

### Features

- **Context-Aware**: Uses screenshot OCR text and summaries to provide better answers
- **Smart Detection**: Automatically determines if message is an edit command or question
- **Markdown Preservation**: Maintains formatting, headings, and structure when editing
- **Graceful Fallback**: Always returns valid response, even if AI fails
- **Full Note Updates**: Returns complete modified note, not just changes

### Test Script

Run locally:
```bash
node test-chat.mjs
```

### CORS

Cross-origin requests are allowed (same as /api/analyze)

