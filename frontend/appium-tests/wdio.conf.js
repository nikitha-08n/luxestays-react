const path = require('path');

exports.config = {
    runner: 'local',
    port: 4723, // Default Appium server port
    path: '/wd/hub',
    
    specs: [
        './test/specs/**/*.js'
    ],
    
    exclude: [],
    
    maxInstances: 1,
    
    capabilities: [{
        platformName: 'Android',
        'appium:automationName': 'UiAutomator2',
        'appium:deviceName': 'Android',
        // Update this path to the location of your built APK
        'appium:app': path.join(process.cwd(), '../android/app/build/outputs/apk/debug/app-debug.apk'),
        'appium:appPackage': 'com.luxestays.app',
        'appium:appActivity': 'com.luxestays.app.MainActivity',
        'appium:autoGrantPermissions': true,
        // Automatically switch to WebView context to interact with Capacitor DOM
        'appium:autoWebview': true,
        // Set timeouts for slow rendering on real devices
        'appium:newCommandTimeout': 240,
    }],
    
    logLevel: 'info',
    bail: 0,
    baseUrl: 'http://localhost',
    waitforTimeout: 15000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,
    
    services: ['appium'],
    framework: 'mocha',
    
    reporters: ['spec'],
    
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    },
};
