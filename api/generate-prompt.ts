import OpenAI from "openai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt, systemInstruction } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(400).json({ 
        error: "Configuración requerida: Por favor, configura tu OPENAI_API_KEY en las variables de entorno de Vercel." 
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

    return res.status(200).json({ text: response.choices[0].message.content });
  } catch (error: any) {
    console.error("OpenAI Error:", error);
    
    if (error.status === 429) {
      return res.status(429).json({ 
        error: "Cuota excedida en OpenAI: Por favor, revisa tu plan y detalles de facturación en platform.openai.com." 
      });
    }
    
    return res.status(500).json({ error: error.message || "Error al conectar con OpenAI" });
  }
}
