export const config = {
  runtime: 'edge', 
};

// =========================================================
// 🔴 BORRA LO QUE HAY Y PEGA TU NUEVA CLAVE AQUÍ 🔴
// =========================================================
const API_KEY = "AIzaSyCy91Z4OzUFqtsptGMvQEXL33kBkdMM3oI"; 
// =========================================================

// Lista de modelos de respaldo (Si falla uno, prueba el otro)
const MODELS_TO_TRY = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro"];

export default async function handler(req) {
  if (req.method !== 'POST') return new Response("Method not allowed", { status: 405 });

  try {
    const body = await req.json();
    const { action, prompt, base64Image } = body;

    // --- ACCIÓN 1: TEXTO (Con Respaldo Anti-Caídas) ---
    if (action === 'text') {
      const contentsPart = { parts: [{ text: prompt }] };
      
      if (base64Image) {
        contentsPart.parts.push({
          inline_data: { mime_type: "image/jpeg", data: base64Image }
        });
      }

      let lastError = "";
      
      // Bucle de intentos: Prueba los modelos en orden
      for (const model of MODELS_TO_TRY) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [contentsPart],
                generationConfig: { responseMimeType: "application/json" }
              })
            }
          );

          if (response.ok) {
            const data = await response.json();
            return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
          } else {
             const err = await response.json();
             lastError = err.error?.message || response.statusText;
          }
        } catch (e) {
          lastError = e.message;
        }
      }
      
      throw new Error(`Todos los modelos fallaron. Último error: ${lastError}`);
    }

    // --- ACCIÓN 2: IMAGEN ---
    if (action === 'image') {
      // Intentamos con Imagen 3 (más estable)
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
      
      return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response("Acción desconocida", { status: 400 });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
