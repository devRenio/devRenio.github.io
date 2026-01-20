import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // GitHub Pages 저장소 이름인 /samuel/을 정확히 입력해야 합니다.
  base: "/samuel/",
});
