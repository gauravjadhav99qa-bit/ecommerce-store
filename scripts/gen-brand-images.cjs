const { chromium } = require("playwright");
const path = require("path");

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // logo.png — 512x512 app icon
  await page.setViewportSize({ width: 512, height: 512 });
  await page.goto("file:///" + path.resolve("public/favicon.svg").replace(/\\/g, "/"));
  await page.screenshot({ path: "public/logo.png" });

  // og-image.png — 1200x630 social share card
  const ogPage = await browser.newPage();
  await ogPage.setViewportSize({ width: 1200, height: 630 });
  await ogPage.goto("about:blank");
  await ogPage.setContent(`
    <html><body style="margin:0;font-family:Georgia,serif;background:linear-gradient(135deg,#FDE8D7 0%,#F6EDE2 45%,#E4E9F7 100%);height:630px;display:flex;align-items:center;justify-content:center;">
      <div style="display:flex;align-items:center;gap:40px;padding:0 80px;">
        <svg width="220" height="220" viewBox="0 0 512 512">
          <circle cx="256" cy="272" r="128" fill="#C2517E"/>
          <path d="M256 128c0-32 24-56 56-64-8 32-24 56-56 64z" fill="#5E8C3A"/>
          <circle cx="208" cy="256" r="18" fill="#A33D66"/>
          <circle cx="272" cy="232" r="18" fill="#A33D66"/>
          <circle cx="296" cy="288" r="18" fill="#A33D66"/>
          <circle cx="232" cy="312" r="18" fill="#A33D66"/>
        </svg>
        <div>
          <div style="font-size:72px;font-weight:700;color:#2B2118;line-height:1.05;">Inkberry Press</div>
          <div style="font-size:32px;color:#6B5A4A;margin-top:14px;font-family:Helvetica,Arial,sans-serif;">Printable colouring books &amp; activity PDFs</div>
          <div style="display:inline-block;margin-top:26px;background:#C2517E;color:#fff;padding:14px 28px;border-radius:999px;font-size:24px;font-weight:700;font-family:Helvetica,Arial,sans-serif;">Instant download · Print at home</div>
        </div>
      </div>
    </body></html>
  `);
  await ogPage.screenshot({ path: "public/og-image.png" });
  await ogPage.close();

  await browser.close();
  console.log("Wrote public/logo.png and public/og-image.png");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
