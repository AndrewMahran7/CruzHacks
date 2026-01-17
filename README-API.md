# Screenshot Analysis API

Next.js API endpoints for analyzing screenshots and summarizing sessions with Google Gemini.

## Endpoints

### 1. Analyze Screenshot
```
POST /api/analyze
```

### 2. Summarize Session
```
POST /api/summarize
```

## Request

```typescript
{
  image: string; // PNG data URL: "data:image/png;base64,..."
}
```

## Response

```typescript
{
  rawText: string;                    // Full OCR text
  summary: string;                    // 1-3 sentence description
  category: string;                   // "trip-planning" | "shopping" | "job-search" | "research" | "content-writing" | "productivity" | "other"
  entities: Array<{
    type: string;                     // e.g. "hotel", "product", "job", "article"
    title: string | null;             // Main name/title
    attributes: Record<string, string>; // Key-value metadata
  }>;
  suggestedNotebookTitle: string | null; // Optional notebook title suggestion
}
```

## Example Response

```json
{
  "rawText": "Hotel Deluxe\n5 stars\n$299/night\nSan Francisco, CA",
  "summary": "User is browsing hotel options in San Francisco with pricing and ratings.",
  "category": "trip-planning",
  "entities": [
    {
      "type": "hotel",
      "title": "Hotel Deluxe",
      "attributes": {
        "price": "$299/night",
        "rating": "5 stars",
        "location": "San Francisco, CA"
      }
    }
  ],
  "suggestedNotebookTitle": "San Francisco Hotels"
}
```

## Setup

1. Create `.env.local`:
```bash
GEMINI_API_KEY=your_api_key_here
```

2. Run dev server:
```bash
npm run dev
```

3. Test with hotel.png:
```bash
node test-analyze.mjs
```

## Categories

- **trip-planning**: Hotels, flights, destinations, itineraries
- **shopping**: Products, comparisons, reviews
- **job-search**: Job postings, applications, company research
- **research**: Articles, papers, documentation
- **content-writing**: Drafts, notes, writing tools
- **productivity**: Tasks, calendars, project management
- **other**: Everything else

## Entity Types

Common entity types extracted:
- `hotel` - Hotels with price, rating, location
- `product` - Products with price, specs, brand
- `job` - Job postings with company, salary, location
- `article` - Articles with author, date, source
- `flight` - Flights with airline, time, price
- `restaurant` - Restaurants with cuisine, rating, location
- `generic` - Other structured data

## Error Handling

The API never throws errors. If:
- `GEMINI_API_KEY` is missing
- Gemini API fails
- Response parsing fails

Returns fallback response:
```json
{
  "rawText": "",
  "summary": "",
  "category": "other",
  "entities": [],
  "suggestedNotebookTitle": null
}
```

## Deployment

Deploy to Vercel:

1. Add environment variable in Vercel dashboard:
   - `GEMINI_API_KEY`

2. Deploy:
```bash
vercel --prod
```

## Testing

### Local Test
```bash
node test-analyze.mjs
```

### cURL Test
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"image":"data:image/png;base64,iVBORw0KG..."}'
```

### Production Test
```bash
curl -X POST https://your-app.vercel.app/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"image":"data:image/png;base64,iVBORw0KG..."}'
```

---

## API: Summarize Session

### Endpoint
```
POST /api/summarize
```

### Purpose
Takes all entities from a session and uses AI to create a condensed, intelligent summary with actionable insights.

### Request Format

```typescript
{
  sessionId: string;
  sessionName: string;
  entities: Array<{
    type: string;
    title: string | null;
    attributes: Record<string, string>;
  }>;
}
```

### Response Format

```typescript
{
  condensedSummary: string;      // AI-generated overview (2-4 sentences)
  keyHighlights: string[];       // Top 3-5 bullet points
  recommendations: string[];     // 2-3 AI suggestions based on content
  mergedEntities: Array<{        // Deduplicated/merged entities
    type: string;
    title: string | null;
    attributes: Record<string, string>;
  }>;
  suggestedTitle: string;        // AI-suggested session title
}
```

### Example Request

```json
{
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
}
```

### Example Response

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

### Testing

```bash
node test-summarize.mjs
```

### cURL Test

```bash
curl -X POST http://localhost:3000/api/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-123",
    "sessionName": "Trip Planning",
    "entities": [{"type":"hotel","title":"Grand Hyatt","attributes":{"price":"$250"}}]
  }'
```
