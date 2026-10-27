import {defineConfig} from 'astro/config';
export default defineConfig({site:'https://comics.makingthings.work',output:'static',trailingSlash:'always',server:{host:'127.0.0.1',port:8789},vite:{server:{strictPort:true}}});
