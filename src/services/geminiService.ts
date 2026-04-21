import { db, OperationType, handleFirestoreError } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export interface PromptFormData {
  businessDescription: string;
  targetAudience: string;
  marketingTool: string;
  objective: string;
  specificTopic: string;
  brandTone: string[];
  restrictions: string;
  outputFormat: string;
  // Specific fields
  uniqueValue?: string; // Vender
  keyConcept?: string; // Educar
  engagementHook?: string; // Interactuar
  newsDetail?: string; // Informar
  productImage?: string; // Data URL for Visual Design
}

const SYSTEM_PROMPT = `Rol: Eres un "Arquitecto de Prompts Experto", el motor principal de una aplicación web de marketing para emprendedores.

Objetivo: Tu tarea es recibir los datos que un usuario ingresa en un formulario web y transformarlos automáticamente en un prompt maestro, altamente optimizado, listo para que el usuario lo copie y lo use en cualquier IA generativa (como Gemini, ChatGPT o Claude).

Reglas de Procesamiento:
A partir de las variables ingresadas por el usuario, debes redactar el prompt final utilizando ESTRICTAMENTE la siguiente estructura. Utiliza los corchetes para separar cada sección:

[CONTEXTO]
Define el rol que debe asumir la IA que recibirá el prompt.
Describe el negocio, el producto estrella y el público objetivo basándote en la información del usuario.
Establece la propuesta de valor.

[TAREA]
Define con verbos de acción precisos qué es exactamente lo que se debe crear (ej. "Redacta un calendario", "Escribe 3 correos", "Diseña un brief visual").
Especifica el objetivo principal de la tarea (vender, educar, generar interacción).

[RESTRICCIONES]
Define el tono de voz exacto de la marca (ej. cercano, profesional, orgánico).
Especifica límites de longitud (cantidad de palabras, número de posts).
Detalla elementos visuales a priorizar o evitar (ej. "priorizar estéticas limpias y minimalistas, evitar lenguaje saturado o emojis excesivos").

[FORMATO]
Indica cómo debe entregarse la información de salida (ej. "Entregar en una tabla con columnas para Día, Texto, Sugerencia de Imagen", o "Entregar en viñetas").

Formato de Salida:
Tu única respuesta debe ser el prompt final generado, escrito en primera persona (como si el usuario le estuviera dando la orden directa a la IA). No incluyas saludos, ni confirmaciones, ni texto previo o posterior. Solo entrega el prompt listo para usar.`;

export async function generateOptimizedPrompt(data: PromptFormData, userId: string): Promise<string> {
  const objectiveSpecificInfo = 
    data.objective === "Vender un producto" ? `Valor único/Oferta: ${data.uniqueValue}` :
    data.objective === "Educar a la audiencia" ? `Concepto clave o tip: ${data.keyConcept}` :
    data.objective === "Generar interacción/comunidad" ? `Gancho o pregunta: ${data.engagementHook}` :
    data.objective === "Informar sobre una novedad" ? `Detalle de la novedad: ${data.newsDetail}` : "";

  const userInput = `
Tarea seleccionada: ${data.marketingTool}
Objetivo: ${data.objective}
Mi negocio: ${data.businessDescription}
Tema específico de este prompt: ${data.specificTopic}
${objectiveSpecificInfo}
${data.productImage ? "[ESTE PROMPT INCLUYE UNA IMAGEN DE REFERENCIA: El usuario ha subido una foto del producto. Asegúrate de que el diseño final integre armoniosamente este producto en la composición visual.]" : ""}
 Mi público: ${data.targetAudience}
Tono de marca: ${data.brandTone.join(", ")}
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

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Error al generar el prompt con OpenAI");
    }

    const generatedText = result.text;

    if (!generatedText) {
      throw new Error("La IA devolvió una respuesta vacía.");
    }

    // Save to Firestore
    const path = `users/${userId}/prompts`;
    try {
      await addDoc(collection(db, path), {
        uid: userId,
        tool: data.marketingTool,
        topic: data.specificTopic,
        prompt: generatedText,
        createdAt: serverTimestamp(),
      });
    } catch (fsError) {
      handleFirestoreError(fsError, OperationType.CREATE, path);
    }

    return generatedText;
  } catch (error: any) {
    console.error("Error generating prompt:", error);
    throw error;
  }
}
