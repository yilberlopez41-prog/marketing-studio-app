// 🔴 NO AGREGAR "runtime: edge". ESTO ES NODE.JS PURO.

const API_KEY = "AIzaSyCy91Z4OzUFqtsptGMvQEXL33kBkdMM3oI"; 

export default async function handler(req, res) {
  // 1. Configuración de CORS (Para que no te bloquee el navegador)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 2. Manejo de "Preflight" (Opciones antes del envío)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 3. Solo aceptamos POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { action, prompt, base64Image } = req.body;

    // --- LÓGICA DE TEXTO ---
    if (action === 'text') {
      const contentsPart = { parts: [{ text: prompt }] };
      
      if (base64Image) {
        contentsPart.parts.push({
          inline_data: { mime_type: "image/jpeg", data: base64Image }
        });
      }

      // Intentamos directo con Flash (Más rápido y barato)
      // Si falla, podrías cambiar a 'gemini-pro'
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [contentsPart],
            generationConfig: { responseMimeType: "application/json" }
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Error en Google AI");
      }

      return res.status(200).json(data);
    }

    // --- LÓGICA DE IMAGEN ---
    if (action === 'image') {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instances: [{ prompt: prompt + ", professional photography, 4k" }],
            parameters: { sampleCount: 1 }
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
         throw new Error(data.error?.message || "Error generando imagen");
      }
      
      return res.status(200).json(data);
    }

    return res.status(400).json({ error: "Acción desconocida" });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
