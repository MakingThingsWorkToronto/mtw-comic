import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// Web root is apps/mtw/web; the build lands in apps/mtw/dist/web. In dev the server mounts Vite as
// middleware on the app's own port (server/main.ts --dev), so there is only ever one port.
export default defineConfig({
  root: 'web',
  plugins: [preact()],
  build: { outDir: '../dist/web', emptyOutDir: true, target: 'es2022' },
  esbuild: { target: 'es2022' },
});
