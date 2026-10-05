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
      // implement node event listeners here
    },
  },
});
