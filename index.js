// const puppeteer = require("puppeteer");
const fs = require("fs").promises;
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");


(async () => {
  // add stealth plugin and use defaults (all evasion techniques)
  puppeteer.use(StealthPlugin());

  const browser = await puppeteer.launch({
    headless: false,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });
  const page = await browser.newPage();

  page.setUserAgent(
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36"
  );

  console.log(await browser.userAgent());

  const supermarkets = JSON.parse(await fs.readFile("./supermarkets.json"));
  const beers = JSON.parse(await fs.readFile("./beers.json"));

  console.log(supermarkets.data);
  console.log(beers.data);

  await page.setViewport({ width: 1080, height: 1024 });

  let links = makeLinks(supermarkets.data, beers.data);
  console.log(links);
  // Async loop, but wait for preview item to next one
  await links.reduce(async (a, link) => {
      await a;
      console.log(link);

      await page.goto(link.url);
      console.log(page.url());
  
      // TODO : Put class in json
      await page.waitForSelector(link.tags.waitFor);
      const productList = await page.$$(link.tags.waitFor);
      let fromatedProductList = [];
  
      // TODO : Make a parser file
      await Promise.all(
        productList.map(async (element) => {
          // TODO : Put class in json
          let name = await element.$eval(link.tags.name, (item) =>
            item.innerHTML.trim()
          );
          // TODO : Put class in json
          let format = await element.$eval(
            link.tags.format,
            (item) => item.innerHTML.trim()
          );
          // TODO : Put class in json
          let price = await element.$eval(
            link.tags.price,
            (item) => item.innerHTML.trim()
          );
          // TODO : Put class in json
          let price_L = await element.$eval(
            link.tags.price_L,
            (item) => item.innerHTML.trim()
          );
  
          // TODO : Make an interface
          fromatedProductList.push({
            name: name,
            format: format,
            price: price,
            price_L: price_L,
          });
        })
      );
  
      console.log(fromatedProductList);
    // Put the result in a DB
  }, Promise.resolve());

})();

// TODO : Maybe in an other file
function makeLinks(supermarkets, beers) {
  let links = [];
  supermarkets.forEach((supermarket) => {
    beers.forEach((beer) => {
      
      links.push({
        url: supermarket.link +
        supermarket.query_params.search +
        beer +
        "&" +
        supermarket.query_params.page_number +
        "0" +
        "&" +
        supermarket.query_params.other_params,
        tags: supermarket.tags
      }
        
      );
    });
  });

  return links;
}

// "product-price__amount-value" => prix
// "product-card-title__text" => nom
// "ds-product-card-refonte__perunitlabel" => prix/L
// "ds-product-card-refonte__shimzone--small" => format
