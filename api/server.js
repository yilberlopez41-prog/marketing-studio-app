// api/server.js
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  // 1. Configurar CORS para permitir que tu frontend hable con esta función
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Manejar la solicitud "preflight" (opciones) del navegador
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 2. Validar que sea una petición POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt } = req.body;
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      throw new Error("Falta la API Key en las variables de entorno de Vercel");
    }

    // 3. Conectar con Google Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 4. Responder al frontend con el formato esperado
    return res.status(200).json({
      candidates: [{
        content: { parts: [{ text: text }] }
      }]
    });

  } catch (error) {
    console.error("Error en la API:", error);
    return res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
}
