import fs from "fs";

const file = fs.readFileSync("./hotel.png");
const base64 = file.toString("base64");
const dataUrl = `data:image/png;base64,${base64}`;

const body = {
  image: dataUrl,
};

console.log("Sending request to analyze endpoint...\n");

const res = await fetch("http://localhost:3000/api/analyze", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const text = await res.text();
console.log("Status:", res.status);
console.log("\nResponse:");

try {
  const json = JSON.parse(text);
  console.log(JSON.stringify(json, null, 2));
  
  console.log("\n--- Summary ---");
  console.log("Category:", json.category);
  console.log("Summary:", json.summary);
  console.log("Suggested Title:", json.suggestedNotebookTitle);
  console.log("Entities Found:", json.entities.length);
  
  if (json.entities.length > 0) {
    console.log("\n--- Entities ---");
    json.entities.forEach((entity, i) => {
      console.log(`\n${i + 1}. ${entity.title || "Untitled"} (${entity.type})`);
      Object.entries(entity.attributes).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
    });
  }
} catch (e) {
  console.log("Raw response (not JSON):");
  console.log(text);
}
