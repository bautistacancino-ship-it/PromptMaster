import { Resend } from 'resend';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { suggestion, email } = req.body;
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.warn("RESEND_API_KEY not found. Suggestion captured in logs:", suggestion);
      // Fallback for demo purposes if key is missing, return success but log it
      return res.status(200).json({ 
        message: "Sugerencia recibida (Modo demo: configura RESEND_API_KEY en Vercel para recibirla por correo)." 
      });
    }

    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from: 'Prompt Master <onboarding@resend.dev>',
      to: ['bautista.cancino@gmail.com'],
      subject: 'Nueva sugerencia de Prompt Master',
      html: `
        <h2>Nueva Sugerencia</h2>
        <p><strong>De:</strong> ${email || 'Usuario Anónimo'}</p>
        <p><strong>Sugerencia:</strong></p>
        <p style="white-space: pre-wrap;">${suggestion}</p>
      `,
    });

    if (error) {
      console.error("Resend Error:", error);
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ message: "Sugerencia enviada con éxito" });
  } catch (error: any) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: error.message || "Error al enviar la sugerencia" });
  }
}
