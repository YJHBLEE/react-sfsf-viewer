import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    proxy: {
      '/SuccessFactors_API': {
        target: 'https://apisalesdemo8.successfactors.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/SuccessFactors_API/, '/odata/v2'),
        headers: {
           Authorization: 'Basic ' + btoa('sfadmin@SFHUB003119:go100@45')
         }
      },
      '/user-api': {
        target: 'http://localhost:3000',
        bypass: (req, res) => {
          if (req.url.endsWith('/currentUser')) {
            res.end(JSON.stringify({ name: 'sfadmin', displayName: 'Local Admin' }));
            return true;
          }
        }
      }
    }
  }
})