import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Project Pages deploy at /DsaSheet/, so all asset URLs must be prefixed.
export default defineConfig({
    base: "/DsaSheet/",
    plugins: [react()],
});
