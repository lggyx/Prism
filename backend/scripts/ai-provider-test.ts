const provider = Bun.env.AI_PROVIDER ?? "mock";
const baseUrl = (Bun.env.AI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/+$/, "");
const model = Bun.env.AI_MODEL ?? "gpt-4.1-mini";
const apiKey = Bun.env.AI_API_KEY;

if (provider !== "openai-compatible") {
  console.error(`AI_PROVIDER must be openai-compatible for this test, got ${provider}.`);
  process.exit(1);
}

if (!apiKey) {
  console.error("AI_API_KEY is required for this test.");
  process.exit(1);
}

console.log("Testing AI provider");
console.log(`provider: ${provider}`);
console.log(`baseUrl: ${baseUrl}`);
console.log(`model: ${model}`);

const startedAt = performance.now();
const response = await fetch(`${baseUrl}/chat/completions`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "Return compact JSON only."
      },
      {
        role: "user",
        content: 'Reply with JSON exactly matching this schema: {"ok": true, "message": string}.'
      }
    ]
  })
});

const latencyMs = Math.round(performance.now() - startedAt);
console.log(`status: ${response.status}`);
console.log(`latencyMs: ${latencyMs}`);

const payloadText = await response.text();

if (!response.ok) {
  console.error("AI request failed.");
  console.error(payloadText.slice(0, 1000));
  process.exit(1);
}

let payload: { choices?: Array<{ message?: { content?: string } }> };
try {
  payload = JSON.parse(payloadText);
} catch {
  console.error("AI response was not valid JSON.");
  console.error(payloadText.slice(0, 1000));
  process.exit(1);
}

const content = payload.choices?.[0]?.message?.content;
if (!content) {
  console.error("AI response did not include choices[0].message.content.");
  console.error(JSON.stringify(payload).slice(0, 1000));
  process.exit(1);
}

try {
  const parsed = JSON.parse(content) as { ok?: boolean; message?: string };
  console.log("modelContent:", JSON.stringify(parsed));
  if (parsed.ok !== true) {
    console.error("AI content did not include ok: true.");
    process.exit(1);
  }
} catch {
  console.error("AI message content was not valid JSON.");
  console.error(content.slice(0, 1000));
  process.exit(1);
}

console.log("AI provider test passed.");
