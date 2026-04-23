import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

const OUT = path.join(process.cwd(), "docs", "screenshots");

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // 1. Dashboard - full page
  console.log("1. Dashboard full page...");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle2", timeout: 15000 });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUT, "dashboard-full.png"), fullPage: true });
  console.log("  -> dashboard-full.png");

  // 2. Dashboard - viewport only (cleaner for blog)
  await page.screenshot({ path: path.join(OUT, "dashboard.png"), fullPage: false });
  console.log("  -> dashboard.png (viewport)");

  // 3. Skill detail - news-monitor (most interesting for blog)
  console.log("2. news-monitor detail...");
  await page.goto("http://localhost:3000/skills/news-monitor", { waitUntil: "networkidle2", timeout: 15000 });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUT, "news-monitor.png"), fullPage: false });
  console.log("  -> news-monitor.png");

  // 4. Skill detail - trump-monitor
  console.log("3. trump-monitor detail...");
  await page.goto("http://localhost:3000/skills/trump-monitor", { waitUntil: "networkidle2", timeout: 15000 });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUT, "trump-monitor.png"), fullPage: false });
  console.log("  -> trump-monitor.png");

  // 5. Settings page
  console.log("4. Settings...");
  await page.goto("http://localhost:3000/settings", { waitUntil: "networkidle2", timeout: 15000 });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUT, "settings.png"), fullPage: false });
  console.log("  -> settings.png");

  // 6. Scroll settings to show Lobster section
  console.log("5. Settings - Lobster section...");
  await page.evaluate(() => {
    const el = document.querySelector("h2, h3");
    const allHeadings = [...document.querySelectorAll("h2, h3, label, span")];
    const lobster = allHeadings.find(h => h.textContent?.includes("Lobster") || h.textContent?.includes("lobster"));
    if (lobster) lobster.scrollIntoView({ behavior: "instant", block: "center" });
  });
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(OUT, "settings-lobster.png"), fullPage: false });
  console.log("  -> settings-lobster.png");

  // 7. Skill detail - scroll to show execution result area
  console.log("6. news-monitor - scrolled to results...");
  await page.goto("http://localhost:3000/skills/news-monitor", { waitUntil: "networkidle2", timeout: 15000 });
  await new Promise((r) => setTimeout(r, 1500));
  await page.evaluate(() => {
    const allText = [...document.querySelectorAll("h2, h3, p, span")];
    const result = allText.find(el => el.textContent?.includes("Latest Result") || el.textContent?.includes("Execution History") || el.textContent?.includes("最新结果"));
    if (result) result.scrollIntoView({ behavior: "instant", block: "start" });
  });
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(OUT, "news-monitor-result.png"), fullPage: false });
  console.log("  -> news-monitor-result.png");

  // 8. Skill detail - full page to capture everything
  console.log("7. news-monitor full page...");
  await page.goto("http://localhost:3000/skills/news-monitor", { waitUntil: "networkidle2", timeout: 15000 });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUT, "news-monitor-full.png"), fullPage: true });
  console.log("  -> news-monitor-full.png");

  // 9. Another skill for variety - llm-wiki
  console.log("8. llm-wiki detail...");
  await page.goto("http://localhost:3000/skills/llm-wiki", { waitUntil: "networkidle2", timeout: 15000 });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUT, "llm-wiki.png"), fullPage: false });
  console.log("  -> llm-wiki.png");

  // 10. Dashboard - scroll down to show skills grid
  console.log("9. Dashboard - scrolled to skills...");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle2", timeout: 15000 });
  await new Promise((r) => setTimeout(r, 1500));
  await page.evaluate(() => {
    const allText = [...document.querySelectorAll("h2, h3, span")];
    const skills = allText.find(el => el.textContent?.includes("Skills") || el.textContent?.includes("未配置"));
    if (skills) skills.scrollIntoView({ behavior: "instant", block: "start" });
  });
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(OUT, "dashboard-skills.png"), fullPage: false });
  console.log("  -> dashboard-skills.png");

  await browser.close();
  console.log("\nDone! All screenshots saved to", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
