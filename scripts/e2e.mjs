import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 960 });
await page.goto("http://localhost:3100", { waitUntil: "networkidle0", timeout: 60000 });
await page.$$eval("button", (bs) => { const b = bs.find((x) => (x.textContent || "").includes("Load the rail-travel sample")); if (b) b.click(); });
await new Promise((r) => setTimeout(r, 700));
// demo banner visible before submit?
const banner = await page.evaluate(() => document.body.innerText.toLowerCase().includes("demo mode"));
console.log("DEMO_BANNER_PRE_SUBMIT:", banner);
await page.evaluate(() => document.getElementById("app").scrollIntoView());
await new Promise((r) => setTimeout(r, 500));
await page.screenshot({ path: "/tmp/shot-banner.png" });
await page.$$eval("button", (bs) => { const b = bs.find((x) => (x.textContent || "").includes("Check this answer")); if (b) b.click(); });
let found = false;
for (let i = 0; i < 20; i++) {
  found = await page.evaluate(() => document.body.innerText.toLowerCase().includes("claim by claim"));
  if (found) break;
  await new Promise((r) => setTimeout(r, 1000));
}
console.log("RESULTS_RENDERED:", found);
await new Promise((r) => setTimeout(r, 1500));
await page.screenshot({ path: "/tmp/shot-final-results.png", fullPage: true });
const t = await page.evaluate(() => document.body.innerText.toLowerCase());
console.log("HAS_TEXT_MATCH_LABEL:", t.includes("text match"));
console.log("HAS_ANNOTATED:", t.includes("your answer, annotated"));
await browser.close();
process.exit(found ? 0 : 2);
