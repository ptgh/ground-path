import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React + routing core (always needed)
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Heavy PDF/canvas libs — only loaded when forms/PDFs are used
          'pdf-vendor': ['jspdf', 'html2canvas'],
          // Animation library — used across many pages but heavy
          'gsap-vendor': ['gsap'],
          // Supabase client + auth helpers
          'supabase-vendor': ['@supabase/supabase-js'],
          // Data layer
          'query-vendor': ['@tanstack/react-query'],
          // Form / validation
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
}));
