import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// En el computador (npm run dev) esta pequeña extensión hace funcionar /api/datos y /api/nasa
// igual que en Vercel, usando la clave del archivo .env.local
export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));
  return {
    plugins: [
      react(),
      {
        name: "api-local",
        configureServer(server) {
          server.middlewares.use("/api", async (req, res) => {
            const nombre = (req.url || "").split("?")[0].replace(/^\/+/, "");
            if (!["datos", "nasa"].includes(nombre)) { res.statusCode = 404; return res.end("No existe"); }
            const { default: handler } = await server.ssrLoadModule(`/api/${nombre}.js`);
            const r = {
              status(c) { res.statusCode = c; return r; },
              setHeader(k, v) { res.setHeader(k, v); return r; },
              json(o) { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(o)); },
            };
            await handler(req, r);
          });
        },
      },
    ],
  };
});
