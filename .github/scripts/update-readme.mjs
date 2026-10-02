import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const screenshotLine = "![Chat page with a mock reply](docs/screenshot.png)";
const maxDiffChars = 100_000;

const apiKey = process.env.README_AI_API_KEY || "";
const baseUrl = (process.env.README_AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
const model = process.env.README_AI_MODEL || "gpt-4.1-mini";

if (!apiKey) {
  console.error("Set the README_AI_API_KEY repository secret to an OpenAI-compatible API key.");
  process.exit(1);
}

const [readme, metaRaw, diffRaw] = await Promise.all([
  readFile(path.join(root, "readme.md"), "utf8"),
  readFile(path.join(root, "pr-meta.json"), "utf8"),
  readFile(path.join(root, "pr.diff"), "utf8"),
]);

const meta = JSON.parse(metaRaw);
let diff = diffRaw;
if (diff.length > maxDiffChars) {
  diff = `${diff.slice(0, maxDiffChars)}\n\n[diff truncated]\n`;
}

const response = await fetch(`${baseUrl}/chat/completions`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model,
    temperature: 0.2,
    max_tokens: 8000,
    messages: [
      {
        role: "system",
        content: [
          "You maintain the project README for a small app.",
          "Update it so a new developer can run the app after the merged pull request.",
          "Keep the existing voice: short, concrete, second person, PowerShell examples.",
          "Change only what the pull request or the current code makes inaccurate.",
          "Do not invent features, commands, ports, or environment variables.",
          "Keep setup steps that are still true.",
          `Keep this image on its own line after the opening paragraph: ${screenshotLine}`,
          "Return only the full README markdown, with no surrounding code fence.",
        ].join(" "),
      },
      {
        role: "user",
        content: [
          `Pull request #${meta.number}: ${meta.title}`,
          "",
          meta.body || "(no description)",
          "",
          "Files:",
          ...(meta.files || []).map((name) => `- ${name}`),
          "",
          "Diff:",
          diff,
          "",
          "Current README:",
          readme,
        ].join("\n"),
      },
    ],
  }),
});

if (!response.ok) {
  const detail = await response.text();
  console.error(`Model request failed (${response.status}): ${detail.slice(0, 500)}`);
  process.exit(1);
}

const data = await response.json();
const choice = data.choices?.[0];
if (!choice || choice.finish_reason === "length") {
  console.error("Model response was empty or truncated. README was not changed.");
  process.exit(1);
}

let text = String(choice.message?.content || "").trim();
const fenced = text.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```$/);
if (fenced) text = fenced[1].trim();

if (!text.startsWith("# ") || !text.includes("docs/screenshot.png")) {
  console.error("Model response is not a README with the screenshot. README was not changed.");
  process.exit(1);
}

if (!text.endsWith("\n")) text += "\n";
await writeFile(path.join(root, "readme.md"), text);
console.log("Updated readme.md");
