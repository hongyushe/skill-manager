import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

const OUT = path.join(process.cwd(), "docs", "screenshots");
fs.mkdirSync(OUT, { recursive: true });

const BASE = "http://localhost:3000";
const VP = { width: 1440, height: 900 };

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport(VP);

  // Helper: screenshot with wait
  async function shot(name, url, { fullPage = false, wait = 1500, clip } = {}) {
    console.log(`Capturing ${name}...`);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 20000 });
    await new Promise((r) => setTimeout(r, wait));
    await page.screenshot({ path: path.join(OUT, name), fullPage, clip });
    console.log(`  -> ${name}`);
  }

  // 1. Dashboard full
  await shot("dashboard-full.png", `${BASE}/`, { fullPage: true });

  // 2. Dashboard hero (no fullPage, just viewport)
  await shot("dashboard.png", `${BASE}/`);

  // 3. Skills grid area (scroll down a bit)
  await page.goto(`${BASE}/`, { waitUntil: "networkidle2", timeout: 20000 });
  await new Promise((r) => setTimeout(r, 1500));
  await page.evaluate(() => window.scrollBy(0, 300));
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(OUT, "dashboard-skills.png") });
  console.log("  -> dashboard-skills.png");

  // 4. Tools page
  await shot("tools-page.png", `${BASE}/tools`, { fullPage: true });

  // 5. Manage page
  await shot("manage-page.png", `${BASE}/manage`, { fullPage: true });

  // 6. Settings page
  await shot("settings.png", `${BASE}/settings`, { fullPage: true });

  // 7. Settings - Lobster section (scroll to it)
  await page.goto(`${BASE}/settings`, { waitUntil: "networkidle2", timeout: 20000 });
  await new Promise((r) => setTimeout(r, 1500));
  await page.evaluate(() => {
    const el = document.querySelector("h2, h3, label");
    const all = Array.from(document.querySelectorAll("*"));
    const lobster = all.find(e => e.textContent?.includes("Lobster"));
    if (lobster) lobster.scrollIntoView({ block: "center" });
  });
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(OUT, "settings-lobster.png") });
  console.log("  -> settings-lobster.png");

  // 8. Skill detail page — pick the first available skill
  // First list skills to find one
  await page.goto(`${BASE}/api/skills`, { waitUntil: "networkidle2", timeout: 10000 });
  const skillsText = await page.evaluate(() => document.body.innerText);
  let skills = [];
  try { const parsed = JSON.parse(skillsText); skills = Array.isArray(parsed) ? parsed : parsed.skills || []; } catch {}
  const firstSkill = skills[0] || "news-monitor";

  // 9. Skill detail — generic
  await shot("skill-detail.png", `${BASE}/skills/${firstSkill}`);

  // 10. News monitor (if exists)
  const newsSkill = skills.find(s => s.includes("news") || s.includes("新闻") || s.includes("monitor")) || firstSkill;

  await shot("news-monitor.png", `${BASE}/skills/${newsSkill}`, { fullPage: true });

  // 11. News monitor full with result area visible
  await shot("news-monitor-full.png", `${BASE}/skills/${newsSkill}`);

  // 12. News monitor result — try to find a skill with execution history
  // Look for any skill with a result
  let resultSkill = null;
  for (const skill of skills) {
    try {
      const res = await page.goto(`${BASE}/api/skills/${skill}`, { waitUntil: "networkidle2", timeout: 5000 });
      const data = JSON.parse(await page.evaluate(() => document.body.innerText));
      if (data.history?.execution_logs?.length > 0) {
        resultSkill = skill;
        break;
      }
    } catch {}
  }

  if (resultSkill) {
    await page.goto(`${BASE}/skills/${resultSkill}`, { waitUntil: "networkidle2", timeout: 20000 });
    await new Promise((r) => setTimeout(r, 1500));
    // Scroll to latest result section
    await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll("h2, section"));
      const resultSection = all.find(e => e.textContent?.includes("Latest Result") || e.textContent?.includes("最新结果"));
      if (resultSection) resultSection.scrollIntoView({ block: "start" });
    });
    await new Promise((r) => setTimeout(r, 500));
    await page.screenshot({ path: path.join(OUT, "news-monitor-result.png") });
    console.log("  -> news-monitor-result.png");
  } else {
    // Just screenshot the first skill detail as fallback
    await shot("news-monitor-result.png", `${BASE}/skills/${firstSkill}`);
  }

  // 13. Trump monitor (if exists)
  const trumpSkill = skills.find(s => s.includes("trump")) || null;
  if (trumpSkill) {
    await shot("trump-monitor.png", `${BASE}/skills/${trumpSkill}`);
  }

  // 14. LLM wiki (if exists)
  const wikiSkill = skills.find(s => s.includes("wiki") || s.includes("llm")) || null;
  if (wikiSkill) {
    await shot("llm-wiki.png", `${BASE}/skills/${wikiSkill}`);
  }

  await browser.close();
  console.log("\nDone! All screenshots saved to", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
