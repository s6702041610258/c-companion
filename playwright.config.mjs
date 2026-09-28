import {defineConfig} from '@playwright/test';

export default defineConfig({
 testDir:'./test/browser',
 timeout:30000,
 workers:1,
 use:{baseURL:'http://127.0.0.1:18080',browserName:'chromium'},
 webServer:[
  {command:'node test/mock-hermes.mjs',url:'http://127.0.0.1:18081/v1/models',reuseExistingServer:!process.env.CI,timeout:10000},
  {command:'node test/start-app.mjs',url:'http://127.0.0.1:18080/api/health',reuseExistingServer:!process.env.CI,timeout:10000}
 ]
});
