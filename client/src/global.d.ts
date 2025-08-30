/// <reference types="vite/client" />
/// <reference path="./types/speech.d.ts" />

interface ImportMetaEnv {
  readonly VITESUPABASEURL: string;
  readonly VITESUPABASEANON_KEY: string;
  // add other env variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.css'; 
