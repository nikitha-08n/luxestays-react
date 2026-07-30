describe('LuxeStays Capacitor Mobile App - E2E UI Test', () => {
    it('should load the home page and locate the search bar', async () => {
        // Since we are in autoWebview mode, we can select elements via CSS just like a web test
        const searchInput = await $('input[placeholder*="search" i], input[placeholder*="Search" i]');
        
        // Wait for the search bar to exist on the Home page
        await searchInput.waitForExist({ timeout: 10000 });
        
        expect(await searchInput.isExisting()).toBe(true);
    });

    it('should navigate to the properties listing', async () => {
        // Find the "Explore Homes" or navigation link
        const exploreBtn = await $('a[href="/properties"]');
        
        if (await exploreBtn.isExisting()) {
            await exploreBtn.click();
            
            // Wait for properties to load
            const propertyCard = await $('.glass-panel, a[href^="/properties/"]');
            await propertyCard.waitForExist({ timeout: 15000 });
            
            expect(await propertyCard.isExisting()).toBe(true);
        }
    });
});
