import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-native': 'react-native-web',
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://smart-campus-quickfix-server.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'https://smart-campus-quickfix-server.onrender.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
