import puppeteer from "puppeteer";
import pkg from "puppeteer-autoscroll-down";
import sharp from "sharp";
import fs from "fs";
import { exit } from "process";

if (process.argv[2] === undefined) {
  console.log("ERROR, NO IMG URL GIVEN, ADD IT TO THE END"), console.log();
  exit(1);
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function startScreenshotting() {
  //
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.setViewport({ width: 1920, height: 5000 });

  await page.goto(process.argv[2], { waitUntil: "networkidle0" });
  const heightTemp = await page.evaluate((e) => {
    const h = document.body.getBoundingClientRect().height;
    const heightApp = document.body.children[0].getBoundingClientRect().height;
    if (h > heightApp) return h;
    return heightApp;
  });
  await page.setViewport({
    width: 1920,
    height: Math.floor(heightTemp) + 20000,
  });
  await sleep(7000);
  await page.screenshot({ path: "temp.png", fullPage: true });
  await sleep(200);
  await page.setViewport({ width: 1920, height: 1080 });
  await sleep(1000);

  const host = await page.evaluate((e) => {
    return window.location.host;
  });

  const height = await page.evaluate((e) => {
    const h = document.body.getBoundingClientRect().height;
    const heightApp = document.body.children[0].getBoundingClientRect().height;
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
    .toFile(host + "-compressed.jpeg");
  await sharp("./final.png")
    .resize({ width: 800 })
    .extract({ width: 800, height: 550, top: 0, left: 0 })
    .jpeg({ quality: 80 })
    .toFile(host + "-thumbnail.jpeg");
  fs.renameSync("./final.png", "./" + host + "-full.png");
  fs.unlinkSync("./temp.png");
}

startScreenshotting();
