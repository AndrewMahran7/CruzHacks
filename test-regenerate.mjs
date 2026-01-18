import fs from "fs";

// Check if we have analysis result from previous test
if (!fs.existsSync("./analysis-result.json")) {
  console.error("❌ Error: analysis-result.json not found");
  console.error("Run test-analyze.mjs first to create this file");
  process.exit(1);
}

const analysisResult = JSON.parse(fs.readFileSync("./analysis-result.json", "utf8"));

// Use production by default, or pass "local" as argument
const useLocal = process.argv[2] === "local";
const API_URL = "http://localhost:3000/api/regenerate"

const body = {
  sessionId: "test-session-cabo",
  screens: [
    {
      id: "screen-1",
      analysis: analysisResult
    }
  ]
  // No previousSession - this is the first screenshot
};

console.log("🔄 Testing Regenerate API");
console.log(`📍 URL: ${API_URL}`);
console.log(`📸 Screens: ${body.screens.length}`);
console.log(`🆔 Session ID: ${body.sessionId}\n`);

const res = await fetch(API_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const text = await res.text();
console.log("Status:", res.status);
console.log("\n=== FULL RESPONSE ===");

try {
  const json = JSON.parse(text);
  console.log(JSON.stringify(json, null, 2));
  
  // VALIDATION CHECKS
  console.log("\n=== VALIDATION ===");
  console.log(`✅ Has sessionSummary: ${!!json.sessionSummary}`);
  console.log(`✅ Has sessionCategory: ${!!json.sessionCategory}`);
  console.log(`✅ Has formattedNotes: ${!!json.formattedNotes} (NEW FIELD - ${json.formattedNotes?.length || 0} chars)`);
  console.log(`✅ Has noteStyle: ${!!json.noteStyle} (NEW FIELD)`);
  console.log(`✅ Has entities: ${Array.isArray(json.entities)}`);
  console.log(`✅ Has suggestions: ${Array.isArray(json.suggestions)}`);
  
  // KEY INFORMATION
  console.log("\n=== SESSION INFO ===");
  console.log(`📋 Category: ${json.sessionCategory}`);
  console.log(`📝 Summary: ${json.sessionSummary}`);
  console.log(`📓 Note Style: ${json.noteStyle}`);
  console.log(`📚 Suggested Title: ${json.suggestedNotebookTitle || 'none'}`);
  
  // THE MAIN FEATURE - FORMATTED NOTES
  console.log("\n=== FORMATTED NOTES (MARKDOWN) ===");
  console.log("─".repeat(60));
  if (json.formattedNotes) {
    console.log(json.formattedNotes);
  } else {
    console.log("❌ No formatted notes generated!");
  }
  console.log("─".repeat(60));
  
  // SUGGESTIONS
  if (json.suggestions && json.suggestions.length > 0) {
    console.log("\n=== SUGGESTIONS ===");
    json.suggestions.forEach((suggestion, i) => {
      console.log(`\n${i + 1}. ${suggestion.type.toUpperCase()}`);
      if (suggestion.type === 'question') {
        console.log(`   Q: ${suggestion.text}`);
      } else if (suggestion.type === 'ranking') {
        console.log(`   Basis: ${suggestion.basis}`);
        suggestion.items.forEach((item, j) => {
          console.log(`   ${j + 1}. ${item.entityTitle}: ${item.reason}`);
        });
      } else if (suggestion.type === 'next-step') {
        console.log(`   → ${suggestion.text}`);
      }
    });
  }
  
  // ENTITIES
  console.log(`\n=== ENTITIES (${json.entities?.length || 0}) ===`);
  if (json.entities && json.entities.length > 0) {
    json.entities.forEach((entity, i) => {
      console.log(`${i + 1}. ${entity.title || "Untitled"} (${entity.type})`);
    });
  }
  
  // Save result
  fs.writeFileSync("regenerate-result.json", JSON.stringify(json, null, 2));
  console.log("\n✅ Result saved to regenerate-result.json");
  
  // Save just the notes for easy viewing
  if (json.formattedNotes) {
    fs.writeFileSync("notes.md", json.formattedNotes);
    console.log("✅ Formatted notes saved to notes.md");
  }
  
} catch (e) {
  console.log("❌ Failed to parse JSON response:");
  console.log(text.substring(0, 1000)); // Show first 1000 chars
  console.error("\nParse error:", e.message);
}