import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const screenshotPath = path.join(root, "docs", "screenshot.png");
const appUrl = process.env.APP_URL || "http://127.0.0.1:5173";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

try {
  await page.goto(appUrl, { waitUntil: "networkidle" });
  await page.getByPlaceholder("Type a message").fill("hello");
  await page.getByRole("button", { name: "Send" }).click();
  await page.getByText("[mock] You said: hello").waitFor({ timeout: 20000 });
  await mkdir(path.dirname(screenshotPath), { recursive: true });
  await page.screenshot({ path: screenshotPath });
} finally {
  await browser.close();
}

console.log(`Wrote ${screenshotPath}`);
