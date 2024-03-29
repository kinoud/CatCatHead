import { fileURLToPath, URL } from "url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      'vue':'vue/dist/vue.esm-bundler.js'
    },
  },
  server: {
    port: 3000,
    proxy:{
      '^/api':{
        target: 'http://127.0.0.1:5000',
        rewrite: (path) => path.replace(/^\/api/,'')
      },
      '/socket.io':{
        target: 'http://127.0.0.1:5000'
      }
    }
  },
});
