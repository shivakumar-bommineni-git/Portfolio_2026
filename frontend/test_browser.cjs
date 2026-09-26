const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  page.on("console", (msg) =>
    console.log("BROWSER CONSOLE:", msg.type(), msg.text()),
  );
  page.on("pageerror", (err) => console.log("BROWSER ERROR:", err.toString()));
  page.on("requestfailed", (req) =>
    console.log("REQUEST FAILED:", req.url(), req.failure().errorText),
  );

  console.log("Navigating to http://localhost:5174/dashboard");
  try {
    await page.goto("http://localhost:5174/dashboard", {
      waitUntil: "networkidle0",
      timeout: 10000,
    });
  } catch (e) {
    console.log("Goto error:", e.message);
  }

  await browser.close();
})();
