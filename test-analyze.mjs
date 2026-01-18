import fs from "fs";

// Check if hotel.png exists
if (!fs.existsSync("./hotel.png")) {
  console.error("❌ Error: hotel.png not found");
  console.error("Create one or specify a different image file");
  process.exit(1);
}

const file = fs.readFileSync("./hotel.png");
const base64 = file.toString("base64");
const dataUrl = `data:image/png;base64,${base64}`;

const body = {
  image: dataUrl,
};

// Use production URL (change to localhost:3000 if testing locally)
// const API_URL = "https://relay-that-backend-ibaiy8nho-andrewmahran7s-projects.vercel.app/api/analyze";
const API_URL = "http://localhost:3000/api/analyze";

console.log("🔍 Testing Analyze API");
console.log(`📍 URL: ${API_URL}`);
console.log(`📸 Image: hotel.png (${(base64.length / 1024).toFixed(2)} KB)\n`);

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
  console.log(`✅ Has rawText: ${!!json.rawText} (${json.rawText?.length || 0} chars)`);
  console.log(`✅ Has summary: ${!!json.summary}`);
  console.log(`✅ Has userIntent: ${!!json.userIntent} (NEW FIELD)`);
  console.log(`✅ Has category: ${!!json.category}`);
  console.log(`✅ Has contextClues: ${!!json.contextClues} (NEW FIELD)`);
  console.log(`✅ Has entities: ${Array.isArray(json.entities)}`);
  
  // KEY INFORMATION
  console.log("\n=== KEY INFORMATION ===");
  console.log(`📋 Category: ${json.category}`);
  console.log(`📝 Summary: ${json.summary}`);
  console.log(`🎯 User Intent: ${json.userIntent || 'NOT SET'}`);
  console.log(`📚 Suggested Title: ${json.suggestedNotebookTitle || 'none'}`);
  
  // NEW FIELDS - CONTEXT CLUES
  console.log("\n=== CONTEXT CLUES (NEW) ===");
  if (json.contextClues) {
    console.log(`🔄 Is Comparison: ${json.contextClues.isComparison}`);
    console.log(`⚖️  Decision Point: ${json.contextClues.decisionPoint || 'none'}`);
    console.log(`🏷️  Related Topics: ${json.contextClues.relatedTopics?.join(', ') || 'none'}`);
  } else {
    console.log("❌ contextClues field missing!");
  }
  
  // ENTITIES
  console.log(`\n=== ENTITIES (${json.entities?.length || 0}) ===`);
  if (json.entities && json.entities.length > 0) {
    json.entities.forEach((entity, i) => {
      console.log(`\n${i + 1}. ${entity.title || "Untitled"} (${entity.type})`);
      Object.entries(entity.attributes || {}).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
    });
  } else {
    console.log("No entities found");
  }
  
  // RAW TEXT PREVIEW
  if (json.rawText) {
    console.log("\n=== RAW TEXT (first 200 chars) ===");
    console.log(json.rawText.substring(0, 200) + (json.rawText.length > 200 ? '...' : ''));
  }
  
  // Save for next test (regenerate)
  fs.writeFileSync("analysis-result.json", JSON.stringify(json, null, 2));
  console.log("\n✅ Result saved to analysis-result.json");
  
} catch (e) {
  console.log("❌ Failed to parse JSON response:");
  console.log(text);
  console.error("\nParse error:", e.message);
}