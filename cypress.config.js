import { defineConfig } from 'cypress';

export default defineConfig({
  projectId: '351jfb',
  e2e: {
    baseUrl: 'https://e-commerce-de-livros.onrender.com',
    viewportWidth: 1280,
    viewportHeight: 720,
    scrollBehavior: 'center',
    video: false,
    screenshotOnRunFailure: false,
    supportFile: false,
    setupNodeEvents(on, config) {
      on('before:browser:launch', (browser = {}, launchOptions) => {
        if (browser.name === 'electron' && browser.isHeadless) {
          launchOptions.preferences.width = 1920;
          launchOptions.preferences.height = 1080;
        }
        return launchOptions;
      });
    },
  },
});
