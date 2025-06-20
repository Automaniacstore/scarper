const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/scrape", async (req, res) => {
  const { productId, country } = req.query;

  if (!productId || !country) {
    return res.status(400).json({ error: "Missing productId or country" });
  }

  const url = `https://www.aliexpress.com/item/${productId}.html`;

  try {
   const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
});
    const page = await browser.newPage();

    // Simuliraj zemlju pomoću headera i jezika
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
    });

    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    const result = await page.evaluate(() => {
      const priceElement = document.querySelector('div.product-price-current span');
      const shippingElement = document.querySelector('.dynamic-shipping-line span');
      const deliveryElement = document.querySelector('.delivery-time span');

      const price = priceElement?.innerText?.replace(/[^\d.]/g, "") || null;
      const shipping = shippingElement?.innerText?.replace(/[^\d.]/g, "") || null;
      const delivery_time = deliveryElement?.innerText?.trim() || null;

      return {
        price: price ? parseFloat(price) : null,
        shipping: shipping ? parseFloat(shipping) : null,
        delivery_time,
        currency: "USD",
      };
    });

    await browser.close();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Scraping failed", details: err.toString() });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
