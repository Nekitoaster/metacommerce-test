const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

const SITE =
  "https://www.dns-shop.ru/catalog/17a8d26216404e77/vstraivaemye-xolodilniki/?p=";

const pages = 10; //Здесь нужно выбрать количество страниц с холодильниками, которе есть на сайте
// наличие холодильников все время меняется, и кол-во страниц тоже
function arrayFromLength(number) {
  // Функция для "перелистывания"
  return Array.from(new Array(number).keys()).map((k) => k + 1);
}

async function getPageContent(url) {
  // Функция получения данных с одной страницы
  try {
    const browser = await puppeteer.launch({
      headless: false,
    });
    const page = await browser.newPage();

    await page.goto(url);
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      // тут мы лишнее добро убираем
      if (["image", "font"].includes(request.resourceType())) {
        request.abort();
      } else {
        request.continue();
      }
    });

    await page.waitForTimeout(5000); // Время можно изменить в зависимости от скорости загрузки страницы
    const result = await page.evaluate(() => {
      const nodeArr = [];
      document.querySelectorAll(".catalog-product").forEach((item) => {
        nodeArr.push({
          title: item.querySelector(".catalog-product__name")?.textContent,
          price: item.querySelector(".product-buy__price")?.textContent,
        });
      });
      return nodeArr;
    });
    await browser.close();
    return result;
  } catch (err) {
    throw err;
  }
}

async function start() {
  // функция для получения всех данных, со всех траниц
  try {
    let allContent = [];
    for (const page of arrayFromLength(pages)) {
      const url = `${SITE}${page}`;
      const pageContent = await getPageContent(url);
      allContent = [...allContent, ...pageContent];
      const csvWriter = createCsvWriter({
        path: "products.csv",
        header: [
          { id: "title", title: "Наименование" },
          { id: "price", title: "Цена" },
        ],
      });

      await csvWriter.writeRecords(allContent);
    }
  } catch (err) {
    console.error(err);
  }
}

start();
