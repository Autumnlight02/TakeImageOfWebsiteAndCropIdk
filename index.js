import puppeteer from "puppeteer";
import pkg from "puppeteer-autoscroll-down";
import sharp from "sharp";
import fs from "fs";
import { exit } from "process";
const { scrollPageToBottom, scrollPageToTop } = pkg;

if (process.argv[2] === undefined) {
  console.log("ERROR, NO IMG URL GIVEN, ADD IT TO THE END"), console.log();
  exit(1);
}
const outDir =
  "./output/" +
  process.argv[2].replace("https://", "").replace("http://", "") +
  "/";
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
console.log("running variant 1 and 2, working...");

async function createImagesV1() {
  try {
    //
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.setViewport({ width: 1920, height: 1000 });

    await page
      .goto(process.argv[2], { waitUntil: "networkidle0" })
      .catch((e) => {
        console.log("page might have not loaded correctly");
      });
    const heightTemp = await page.evaluate((e) => {
      const h = document.body.getBoundingClientRect().height;
      const heightApp =
        document.body.children[0].getBoundingClientRect().height;
      if (h > heightApp) return h;
      return heightApp;
    });
    await page.setViewport({
      width: 1935,
      height: Math.floor(heightTemp) + 20000,
    });
    await sleep(3000);
    await page.screenshot({ path: "temp.png", fullPage: true });
    await sleep(200);
    await page.setViewport({ width: 1920, height: 1080 });
    await sleep(1000);

    const host = await page.evaluate((e) => {
      return window.location.host;
    });

    const height = await page.evaluate((e) => {
      const h = document.body.getBoundingClientRect().height;
      const heightApp =
        document.body.children[0].getBoundingClientRect().height;
      if (h > heightApp) return h;
      return heightApp;
    });

    await browser.close();

    await sharp("./temp.png")
      .extract({ width: 1920, height: Math.floor(height), left: 0, top: 0 })
      .toFile("final.png")
      .then(function (new_file_info) {
        console.log("Image cropped and saved");
      })
      .catch(function (err) {
        console.log(err);
      });
    await sleep(500);

    await sharp("./final.png")
      .resize({ width: 1440 })
      .jpeg({ quality: 80 })
      .toFile(outDir + host + "-compressed-v1.jpeg");
    await sharp("./final.png")
      .resize({ width: 800 })
      .extract({ width: 800, height: 550, top: 0, left: 0 })
      .jpeg({ quality: 80 })
      .toFile(outDir + host + "-thumbnail-v1.jpeg");
    fs.renameSync("./final.png", outDir + host + "-full-v1.png");
    fs.unlinkSync("./temp.png");

    console.log("variant 1 was sucessfull");
  } catch (e) {
    console.log(e);
  }
}

async function createImagesV2() {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.setViewport({ width: 1920, height: 1080 });

    await page
      .goto(process.argv[2], { waitUntil: "networkidle0" })
      .catch((e) => {
        console.log("page might have not loaded correctly");
      });

    await sleep(3000);

    //@ts-ignore
    await scrollPageToBottom(page, {
      size: 50,
      delay: 250,
    });

    await page.screenshot({ path: "final2.png", fullPage: true });
    await sleep(200);

    //@ts-ignore
    const host = await page.evaluate((e) => {
      return window.location.host;
    });

    //@ts-ignore
    const height = await page.evaluate((e) => {
      const h = document.body.getBoundingClientRect().height;
      const heightApp =
        document.body.children[0].getBoundingClientRect().height;
      if (h > heightApp) return h;
      return heightApp;
    });

    await browser.close();
    await sleep(300);

    await sharp("./final2.png")
      .resize({ width: 1440 })
      .jpeg({ quality: 80 })
      .toFile(outDir + host + "-compressed-v2.jpeg");
    await sharp("./final2.png")
      .resize({ width: 800 })
      .extract({ width: 800, height: 550, top: 0, left: 0 })
      .jpeg({ quality: 80 })
      .toFile(outDir + host + "-thumbnail-v2.jpeg");
    fs.renameSync("./final2.png", outDir + host + "-full-v2.png");
    console.log("variant 2 was sucessfull");
  } catch (e) {
    console.log(e);
  }
}

createImagesV1();
createImagesV2();
