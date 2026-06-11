export interface PromptFormData {
  businessDescription: string;
  targetAudience: string;
  marketingTool: string;
  objective: string;
  specificTopic: string;
  brandTone: string[];
  restrictions: string;
  outputFormat: string;
  
  // Specific fields - Objective: Vender
  uniqueValue?: string;       // Oferta especial / Gancho
  productBenefit?: string;    // Problema que soluciona / Beneficio estrella
  objectionToDefeat?: string; // Objeción principal a derribar
  callToAction?: string;      // Llamado a la acción (CTA)

  // Specific fields - Objective: Educar
  keyConcept?: string;        // Tip o concepto didáctico
  learningLevel?: string;     // Nivel (Básico, Intermedio, Avanzado)
  commonMyth?: string;        // Mito o error común a desmentir

  // Specific fields - Objective: Generar interacción/comunidad
  engagementHook?: string;    // Pregunta rompehielos o dilema
  communityDynamic?: string;  // Tipo de interacción (Sorteo, Debate, Versus, Storytime)

  // Specific fields - Objective: Informar sobre una novedad
  newsDetail?: string;        // La noticia o novedad estrella
  newsDateLocation?: string;  // Fechas, horas o locación
  newsEmotionLevel?: string;  // Emoción (Festiva, Sorpresiva, Formal, Urgente)
}

const SYSTEM_PROMPT = `Rol: Eres un "Arquitecto de Prompts Experto", el motor principal de una aplicación web de marketing para emprendedores.

Objetivo: Tu tarea es recibir los datos que un usuario ingresa en un formulario web altamente especializado y transformarlos automáticamente en un prompt de nivel maestro y sumamente optimizado, listo para que el usuario lo copie y lo use en cualquier IA generativa (como Gemini, ChatGPT o Claude).

Instrucciones de Redacción de Prompt:
A partir de las variables ingresadas por el usuario, debes estructurar el prompt de forma impecable usando la siguiente jerarquía encerrada en corchetes. Redacta el prompt en primera persona (ej: "Actúa como mi redactor...", "Escribe un copy...") de manera que sea un comando de entrada directa para la IA que el usuario copie:

[CONTEXTO]
- Define el rol profesional específico y experto que debe adoptar la IA basándose en el objetivo del negocio (ej. "Actúa como un experto en copywriting directo especializado en ventas de...", "Eres un profesor mentor experto en pedagogía digital...").
- Describe el negocio del usuario, el tema en foco y el cliente ideal.
- Agrega información clave específica proporcionada (como el beneficio del producto, el mito que desmentimos, la dinámica de la comunidad o la fecha del evento).

[TAREA]
- Describe de manera detallada la tarea específica que la IA tiene que crear (el canal de marketing seleccionado por el usuario, por ejemplo, "una grilla de contenidos", "un email irresistible", "un guion dinámico para un videoreel").
- Integra las directrices del objetivo de manera prioritaria (ej. Enfocar en derribar la objeción indicada en ventas, estructurar didácticamente el concepto con el nivel educativo indicado, plantear el gancho/debate interactivo para fomentar comentarios, o estructurar la noticia destacando la urgencia/emoción correcta).
- Detalla los pasos que debe seguir la IA para redactar un contenido sobresaliente (ej. Estructura AIDA si es venta, estructura gancho-aporte-cierre si es educación).

[RESTRICCIONES]
- Especifica el tono de voz seleccionado por el usuario (ej. orgánico, profesional, amigable, etc.).
- Detalla límites prácticos de longitud, restricciones de emojis y las exclusiones explícitas ingresadas por el usuario.

[FORMATO]
- Detalla exactamente cómo estructurar la salida para que sea de lectura cómoda y profesional (tablas con columnas específicas, listas claras, formato guion teatral para videos con directrices visuales, etc.).

Formato de Salida:
Tu única respuesta en pantalla debe ser este prompt maestro generado. No agregues introducciones, confirmaciones, notas al inicio, ni explicaciones al final. Debe comenzar en [CONTEXTO] y terminar en el formato recomendado, completamente pulido para que el usuario solo tenga que pulsar un botón para copiarlo e ir a ejecutarlo.`;

export async function generateOptimizedPrompt(data: PromptFormData): Promise<string> {
  let objectiveSpecificInfo = "";

  if (data.objective === "Vender un producto") {
    objectiveSpecificInfo = `
- Oferta / Promoción irresistible: ${data.uniqueValue || "No especificada"}
- Beneficio principal / Problema que resuelve: ${data.productBenefit || "No especificado"}
- Objeción principal a derribar: ${data.objectionToDefeat || "No especificada"}
- Llamado a la Acción (CTA) deseado: ${data.callToAction || "No especificado"}
    `;
  } else if (data.objective === "Educar a la audiencia") {
    objectiveSpecificInfo = `
- Concepto clave / Aprendizaje de valor: ${data.keyConcept || "No especificado"}
- Nivel de profundidad educativa: ${data.learningLevel || "No especificado"}
- Mito o Error común a desmentir: ${data.commonMyth || "No especificado"}
    `;
  } else if (data.objective === "Generar interacción/comunidad") {
    objectiveSpecificInfo = `
- Pregunta gancho / Dilema rompehielos: ${data.engagementHook || "No especificado"}
- Tipo de dinámica / Formato de interacción: ${data.communityDynamic || "No especificada"}
    `;
  } else if (data.objective === "Informar sobre una novedad") {
    objectiveSpecificInfo = `
- Gran noticia o novedad: ${data.newsDetail || "No especificada"}
- Fechas, horarios, ubicaciones y datos de contacto key: ${data.newsDateLocation || "No especificados"}
- Nivel de emoción / Tonalidad del anuncio: ${data.newsEmotionLevel || "No especificado"}
    `;
  }

  const userInput = `
Herramienta de marketing / Formato elegido: ${data.marketingTool}
Objetivo de la campaña: ${data.objective}
Descripción del negocio: ${data.businessDescription}
Tema específico de la pieza: ${data.specificTopic}
${objectiveSpecificInfo}
Público objetivo de la marca: ${data.targetAudience}
Tonalidad de marca: ${data.brandTone.join(", ")}
Restricciones adicionales: ${data.restrictions}
Formato deseado: ${data.outputFormat}
  `;

  try {
    const response = await fetch("/api/generate-prompt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: userInput,
        systemInstruction: SYSTEM_PROMPT,
      }),
    });

    let result;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      result = await response.json();
    } else {
      const text = await response.text();
      console.error("Non-JSON response:", text);
      throw new Error(`El servidor no respondió correctamente. Asegúrate de que las funciones API estén configuradas en Vercel.`);
    }

    if (!response.ok) {
      throw new Error(result.error || `Error del servidor (${response.status})`);
    }

    const generatedText = result.text;

    if (!generatedText) {
      throw new Error("La IA devolvió una respuesta vacía.");
    }

    return generatedText;
  } catch (error: any) {
    console.error("Error generating prompt:", error);
    throw error;
  }
}
