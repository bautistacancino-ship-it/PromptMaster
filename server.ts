import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // OpenAI API Route
  app.post("/api/generate-prompt", async (req, res) => {
    try {
      const { prompt, systemInstruction } = req.body;
      const apiKey = process.env.OPENAI_API_KEY;

      if (!apiKey) {
        return res.status(400).json({ 
          error: "Configuración requerida: Por favor, configura tu OPENAI_API_KEY en el panel de Secrets." 
        });
      }

      const openai = new OpenAI({ apiKey });

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
      });

      res.json({ text: response.choices[0].message.content });
    } catch (error: any) {
      console.error("OpenAI Error:", error);
      
      if (error.status === 429) {
        return res.status(429).json({ 
          error: "Cuota excedida en OpenAI: Por favor, revisa tu plan y detalles de facturación en platform.openai.com. Es posible que necesites añadir saldo a tu cuenta." 
        });
      }
      
      res.status(500).json({ error: error.message || "Error al conectar con OpenAI" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
