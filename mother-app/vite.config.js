import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const sharedWeb = path.resolve(__dirname, 'src', 'web');

export default defineConfig({
  plugins: [
    {
      name: 'jsx-in-js',
      enforce: 'pre',
      async transform(code, id) {
        if (id.endsWith('.js') && !id.includes('node_modules') && code.includes('<')) {
          const babel = await import('@babel/core');
          const result = await babel.transformAsync(code, {
            filename: id,
            sourceMaps: true,
            plugins: [
              ['@babel/plugin-syntax-jsx', {}],
              ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }],
            ],
            babelrc: false,
            configFile: false,
          });
          if (result && result.code) {
            return { code: result.code, map: result.map };
          }
        }
      },
    },
    react(),
  ],
  resolve: {
    alias: {
      'react-native': 'react-native-web',
      '@react-native-async-storage/async-storage': path.resolve(sharedWeb, 'AsyncStorage.js'),
      'react-native-safe-area-context': path.resolve(sharedWeb, 'SafeAreaContext.js'),
      'react-native-screens': path.resolve(sharedWeb, 'Screens.js'),
      'react-native-vector-icons': path.resolve(sharedWeb, 'VectorIcons.js'),
      '@react-native-community/datetimepicker': path.resolve(sharedWeb, 'DateTimePicker.js'),
    },
  },
  define: {
    __DEV__: JSON.stringify(true),
  },
  optimizeDeps: { noDiscovery: true, include: [] },
  server: {
    port: parseInt(process.env.VITE_PORT, 10) || 3002,
    host: true,
  },
});
