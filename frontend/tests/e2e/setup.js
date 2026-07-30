import { Builder, Browser } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

let driver;

beforeAll(async () => {
  // Setup Chrome to run headlessly
  const options = new chrome.Options();
  options.addArguments('--headless=new');
  options.addArguments('--disable-gpu');
  options.addArguments('--no-sandbox');
  options.addArguments('--window-size=1280,800');

  driver = await new Builder()
    .forBrowser(Browser.CHROME)
    .setChromeOptions(options)
    .build();

  // Export driver to be accessible in test files globally
  global.driver = driver;
});

afterAll(async () => {
  if (driver) {
    await driver.quit();
  }
});
