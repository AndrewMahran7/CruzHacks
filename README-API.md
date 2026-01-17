# Screenshot Analysis API

Stateless Next.js API endpoint for analyzing screenshots with Google Gemini.

## Endpoint

```
POST /api/analyze
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
