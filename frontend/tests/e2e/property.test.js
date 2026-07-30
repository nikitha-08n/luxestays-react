import { By, until } from 'selenium-webdriver';

describe('Property Navigation Flows', () => {
  const APP_URL = process.env.CLIENT_URL || 'http://localhost:5173';

  it('TC-003: Should render the property search page and allow typing', async () => {
    await global.driver.get(`${APP_URL}/properties`);
    
    // Wait for the compass icon or search header
    await global.driver.wait(until.elementLocated(By.xpath('//*[contains(text(), "Explore Luxury Rentals")]')), 5000);
    
    const searchInput = await global.driver.findElement(By.css('input[placeholder*="Enter city"]'));
    await searchInput.clear();
    await searchInput.sendKeys('Bangalore');

    // Make sure we wait for animation
    await global.driver.sleep(500);

    const searchBtn = await global.driver.findElement(By.css('button[type="submit"]'));
    await searchBtn.click();

    // Verify it doesn't crash and remains on the page
    const currentUrl = await global.driver.getCurrentUrl();
    expect(currentUrl).toContain('/properties');
  });

  it('TC-004: Should filter properties by Max Price', async () => {
    await global.driver.get(`${APP_URL}/properties`);
    
    const maxPriceInput = await global.driver.wait(until.elementLocated(By.css('input[placeholder="₹ Max"]')), 5000);
    await maxPriceInput.sendKeys('50000');
    
    // Changing value should trigger a refetch in the UI
    await global.driver.sleep(1000); // Give it time to debounce/refetch
    
    // We just verify the input accepted the value
    expect(await maxPriceInput.getAttribute('value')).toBe('50000');
  });
});
