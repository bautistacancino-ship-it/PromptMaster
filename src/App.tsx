import { useState, FormEvent } from "react";
import { 
  Sparkles, 
  Target, 
  Settings, 
  Layout, 
  Copy, 
  Check, 
  Loader2, 
  ChevronRight, 
  ChevronLeft,
  Store,
  Users,
  Lightbulb,
  MessageSquare,
  Image as ImageIcon,
  Mail,
  Rocket,
  Instagram,
  Palette,
  Info,
  MessageSquarePlus,
  Send,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { generateOptimizedPrompt, PromptFormData } from "./services/geminiService";

// Add global type for AI Studio API
declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const OBJECTIVE_TOOLS: Record<string, { id: string; label: string; icon: any; description: string }[]> = {
  "Vender un producto": [
    { id: "Copywriting de Venta (Fórmula AIDA)", label: "Copywriting de Venta (AIDA)", icon: MessageSquare, description: "Captions y copys persuasivos con gatillos mentales." },
    { id: "Guion de Ventas para Reels/TikTok", label: "Guion de Redes (Conversión)", icon: Instagram, description: "Estructura gancho + problema + solución." },
    { id: "Email marketing Promocional", label: "Email Promocional", icon: Mail, description: "Vende directamente a tu lista con asuntos irresistibles." },
    { id: "Estrategia de Lanzamiento", label: "Estrategia de Lanzamiento", icon: Rocket, description: "Pasos y copys desde el teaser hasta el cierre." },
  ],
  "Educar a la audiencia": [
    { id: "Contenido para Carrusel/Infografía", label: "Estructura de Carrusel", icon: Palette, description: "Desglose diapositiva por diapositiva (Paso a paso)." },
    { id: "Post Didáctico con Storytelling", label: "Post Didáctico Largo", icon: MessageSquare, description: "Enseña contando una historia memorable." },
    { id: "Guion Educativo de 60 segundos", label: "Guion Formato Corto", icon: Instagram, description: "Capta la atención con tips prácticos al grano." },
    { id: "Email Newsletter Semanal de Valor", label: "Newsletter de Valor", icon: Mail, description: "Comparte conocimientos para fidelizar tu base de datos." },
  ],
  "Generar interacción/comunidad": [
    { id: "Dinámica versus (A vs B o Debate)", label: "Interactivos A vs B / Debate", icon: MessageSquare, description: "Dividir opciones para hacerlos comentar activamente." },
    { id: "Storytime interactivo de Marca", label: "Guion Storytime Humano", icon: Instagram, description: "Comparte una anécdota y deja un debate abierto." },
    { id: "Estrategia y Copy para Sorteos", label: "Estrategia de Sorteo", icon: Rocket, description: "Reglas claras y copys entusiastas para participación masiva." },
    { id: "Q&A / Ronda de Preguntas", label: "Preguntas del Público", icon: Users, description: "Fomenta preguntas directas o responde dudas frecuentes." },
  ],
  "Informar sobre una novedad": [
    { id: "Anuncio de Novedad oficial", label: "Comunicado Oficial", icon: Info, description: "Limpio, con todos los detalles ordenados de forma profesional." },
    { id: "Post de Intriga previa", label: "Post Teaser / Intriga", icon: Rocket, description: "Fomenta la curiosidad antes de dar la gran noticia." },
    { id: "Email informativo importante", label: "Email Informativo", icon: Mail, description: "Navega directo al buzón para avisar cambios relevantes." },
    { id: "Post Informativo visual", label: "Post Informativo Rápido", icon: MessageSquare, description: "Diseño ideal para placas informativas sencillas." },
  ],
  "Crear montajes de fotografías reales": [
    { id: "Prompt de Montaje en Nuevo Fondo", label: "Montaje de Fondo", icon: Palette, description: "Traslada tu producto real a un entorno nuevo y fotorrealista." },
    { id: "Prompt para Mejorar Calidad e Iluminación", label: "Refinar Calidad y Luz", icon: Sparkles, description: "Refina brillos, nitidez, sombras y luces de forma premium." },
    { id: "Prompt de Dirección de Arte Editorial", label: "Composición Editorial", icon: ImageIcon, description: "Añade utilería y ambientación artística digna de revista." },
    { id: "Prompt para Escenario Temático / Estacional", label: "Fondo Temático Estacional", icon: Rocket, description: "Fondo festivo o de temporada (ej: Navidad, Verano, Halloween)." },
  ]
};

const OBJECTIVES = [
  { id: "Vender un producto", label: "Vender un producto", icon: Rocket, description: "Convierte leads en clientes con mensajes persuasivos." },
  { id: "Educar a la audiencia", label: "Educar a la audiencia", icon: Lightbulb, description: "Posiciónate como experto compartiendo valor." },
  { id: "Generar interacción/comunidad", label: "Generar interacción/comunidad", icon: Users, description: "Fomenta comentarios y engagement genuino." },
  { id: "Informar sobre una novedad", label: "Informar sobre una novedad", icon: MessageSquare, description: "Anuncia lanzamientos, cambios o noticias." },
  { id: "Crear montajes de fotografías reales", label: "Crear montajes fotográficos reales", icon: ImageIcon, description: "Genera prompts para mover tu producto a nuevos fondos, mejorar la calidad y definir iluminación." },
];

const TONES = [
  { id: "Orgánico y natural", label: "Orgánico y natural" },
  { id: "Minimalista y directo", label: "Minimalista y directo" },
  { id: "Profesional y académico", label: "Profesional y académico" },
  { id: "Cercano y amigable", label: "Cercano y amigable" },
  { id: "Humorístico", label: "Humorístico" },
];

const FORMATS = [
  "En una tabla estructurada",
  "En lista de viñetas",
  "Párrafos cortos y separados",
  "Formato de guion de video",
];

const InfoTooltip = ({ text }: { text: string }) => (
  <div className="group relative inline-block ml-1.5 align-middle">
    <Info size={14} className="text-slate-400 cursor-help hover:text-brand-500 transition-colors" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center font-normal leading-tight shadow-xl">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
    </div>
  </div>
);

export default function App() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const [formData, setFormData] = useState<PromptFormData>({
    businessDescription: "",
    targetAudience: "",
    marketingTool: OBJECTIVE_TOOLS[OBJECTIVES[0].id][0].id,
    objective: OBJECTIVES[0].id,
    specificTopic: "",
    brandTone: [],
    restrictions: "",
    outputFormat: FORMATS[0],
    
    // Vender
    uniqueValue: "",
    productBenefit: "",
    objectionToDefeat: "",
    callToAction: "",

    // Educar
    keyConcept: "",
    learningLevel: "Básico (Principiantes)",
    commonMyth: "",

    // Generar interacción
    engagementHook: "",
    communityDynamic: "Debate abierto",

    // Informar novedad
    newsDetail: "",
    newsDateLocation: "",
    newsEmotionLevel: "Alegre y festivo",

    // Montajes fotográficos
    photoOriginalDesc: "",
    photoBackground: "",
    photoStyle: "Fotografía comercial hiperrealista de estudio (Catálogo)",
    photoLighting: "Luz natural suave de ventana con dirección sutil (Estudio casero)",
  });

  const [suggestionModal, setSuggestionModal] = useState(false);
  const [suggestionText, setSuggestionText] = useState("");
  const [suggestionEmail, setSuggestionEmail] = useState("");
  const [sendingSuggestion, setSendingSuggestion] = useState(false);

  const handleInputChange = (field: keyof PromptFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleObjectiveSelect = (objectiveId: string) => {
    const defaultTool = OBJECTIVE_TOOLS[objectiveId]?.[0]?.id || "";
    setFormData(prev => ({
      ...prev,
      objective: objectiveId,
      marketingTool: defaultTool
    }));
  };

  const handleToneToggle = (tone: string) => {
    setFormData(prev => {
      const currentTones = prev.brandTone;
      if (currentTones.includes(tone)) {
        return { ...prev, brandTone: currentTones.filter(t => t !== tone) };
      }
      if (currentTones.length < 2) {
        return { ...prev, brandTone: [...currentTones, tone] };
      }
      return prev;
    });
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const prompt = await generateOptimizedPrompt(formData);
      setResult(prompt);
      setStep(5);
    } catch (error: any) {
      alert(error.message || "Error al generar el prompt. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 4));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleSendSuggestion = async (e: FormEvent) => {
    e.preventDefault();
    if (!suggestionText) return;
    
    setSendingSuggestion(true);
    try {
      const response = await fetch("/api/send-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suggestion: suggestionText, email: suggestionEmail }),
      });
      
      if (response.ok) {
        alert("¡Muchas gracias por tu sugerencia! La hemos recibido correctamente.");
        setSuggestionText("");
        setSuggestionEmail("");
        setSuggestionModal(false);
      } else {
        throw new Error("Error al enviar");
      }
    } catch (error) {
      alert("Hubo un problema al enviar tu sugerencia. Por favor intenta más tarde.");
    } finally {
      setSendingSuggestion(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-brand-100 text-brand-600 rounded-lg">
                <Target size={24} />
              </div>
              <h2 className="text-xl font-display font-bold">
                1. ¿Qué quieres lograr?
                <InfoTooltip text="Define el propósito principal de lo que vamos a escribir." />
              </h2>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {OBJECTIVES.map((obj) => (
                <button
                  key={obj.id}
                  onClick={() => handleObjectiveSelect(obj.id)}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-all text-left ${
                    formData.objective === obj.id 
                    ? "bg-brand-50 border-brand-500 ring-1 ring-brand-500" 
                    : "bg-white border-slate-200 hover:border-brand-300"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${formData.objective === obj.id ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                    <obj.icon size={20} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{obj.label}</div>
                    <div className="text-xs text-slate-500">{obj.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-brand-100 text-brand-600 rounded-lg">
                <Store size={24} />
              </div>
              <h2 className="text-xl font-display font-bold">
                2. Contexto y Detalles
                <InfoTooltip text="Aquí definimos la base de tu marca y el tema del día." />
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Descripción de tu negocio
                  <InfoTooltip text="Explica brevemente qué vendes y cuál es tu esencia." />
                </label>
                <textarea 
                  className="input-field min-h-[70px]"
                  placeholder="Ej: Cafetería de especialidad con granos de origen único."
                  value={formData.businessDescription}
                  onChange={(e) => handleInputChange("businessDescription", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tema secundario o pieza específica de hoy
                  <InfoTooltip text="¿De qué producto o noticia hablaremos en este post puntual?" />
                </label>
                <input 
                  type="text"
                  className="input-field"
                  placeholder="Ej: Lanzamiento de la nueva variedad de café de Colombia."
                  value={formData.specificTopic}
                  onChange={(e) => handleInputChange("specificTopic", e.target.value)}
                />
              </div>

              {/* Dynamic inputs - Objective: VENDER */}
              {formData.objective === "Vender un producto" && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 border-l-2 border-brand-500 pl-4 py-1"
                >
                  <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider">Foco: Conversión y Ventas</p>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Oferta especial o Gancho irresistible
                      <InfoTooltip text="¿Qué descuento, regalo, kit o beneficio exclusivo ofreces en esta campaña?" />
                    </label>
                    <input 
                      type="text"
                      className="input-field ring-1 ring-brand-100"
                      placeholder="Ej: Envíos gratis este fin de semana o 2x1 en la primera compra."
                      value={formData.uniqueValue}
                      onChange={(e) => handleInputChange("uniqueValue", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Beneficio estrella / Solución
                      <InfoTooltip text="¿Qué problema clave resuelve tu producto o qué beneficio lo hace único?" />
                    </label>
                    <input 
                      type="text"
                      className="input-field ring-1 ring-brand-100"
                      placeholder="Ej: Café recolectado a mano que no genera acidez estomacal."
                      value={formData.productBenefit}
                      onChange={(e) => handleInputChange("productBenefit", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Objeción principal a derribar
                      <InfoTooltip text="¿Cuál es la excusa típica para no comprarte? El prompt entrenará a la IA para debatirla sutilmente." />
                    </label>
                    <input 
                      type="text"
                      className="input-field ring-1 ring-brand-100"
                      placeholder="Ej: 'El café de especialidad es muy caro' o 'No sé preparar café filtrado'."
                      value={formData.objectionToDefeat}
                      onChange={(e) => handleInputChange("objectionToDefeat", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Llamado a la Acción (CTA) deseado
                      <InfoTooltip text="¿Qué acción exacta debe realizar la persona al leer?" />
                    </label>
                    <input 
                      type="text"
                      className="input-field ring-1 ring-brand-100"
                      placeholder="Ej: Escribe la palabra 'CAFE' en los comentarios o haz clic en el link de la bio."
                      value={formData.callToAction}
                      onChange={(e) => handleInputChange("callToAction", e.target.value)}
                    />
                  </div>
                </motion.div>
              )}

              {/* Dynamic inputs - Objective: EDUCAR */}
              {formData.objective === "Educar a la audiencia" && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 border-l-2 border-brand-500 pl-4 py-1"
                >
                  <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider">Foco: Autoridad y Valor didáctico</p>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Concepto o Tip súper útil a enseñar
                      <InfoTooltip text="¿Qué técnica, secreto, tip paso a paso o conocimiento práctico vas a regalar hoy?" />
                    </label>
                    <textarea 
                      className="input-field ring-1 ring-brand-100 min-h-[60px]"
                      placeholder="Ej: La regla de oro de la proporción agua-café (1 gramo de café por cada 16 gramos de agua)."
                      value={formData.keyConcept}
                      onChange={(e) => handleInputChange("keyConcept", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Nivel de complejidad pedagógica
                      <InfoTooltip text="Ajusta el nivel técnico de las analogías y explicaciones en el prompt final." />
                    </label>
                    <select 
                      className="input-field bg-white ring-1 ring-brand-100"
                      value={formData.learningLevel}
                      onChange={(e) => handleInputChange("learningLevel", e.target.value)}
                    >
                      <option value="Básico (Principiantes absolute sin jerga técnica)">Básico (Ideal para principiantes, sin jerga técnica)</option>
                      <option value="Intermedio (Con analogías y conceptos comunes)">Intermedio (Con analogías y conceptos comunes)</option>
                      <option value="Avanzado (Para entusiastas o profesionales)">Avanzado (Técnico, preciso y profesional)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Mito o Error común a desmentir
                      <InfoTooltip text="Desmentir un error de la industria genera muchísimo enganche y retención." />
                    </label>
                    <input 
                      type="text"
                      className="input-field ring-1 ring-brand-100"
                      placeholder="Ej: Creer que guardar el café en el refrigerador lo mantiene más fresco."
                      value={formData.commonMyth}
                      onChange={(e) => handleInputChange("commonMyth", e.target.value)}
                    />
                  </div>
                </motion.div>
              )}

              {/* Dynamic inputs - Objective: INTERACCIÓN */}
              {formData.objective === "Generar interacción/comunidad" && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 border-l-2 border-brand-500 pl-4 py-1"
                >
                  <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider">Foco: Engagement y Respuestas</p>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Pregunta ruidosa o Dilema rompehielos
                      <InfoTooltip text="Una pregunta de debate o elección rápida que divida constructivamente la opinión." />
                    </label>
                    <input 
                      type="text"
                      className="input-field ring-1 ring-brand-100"
                      placeholder="Ej: ¿Eres del team café caliente sin importar el verano o amas el Iced Coffee apenas sube la temperatura?"
                      value={formData.engagementHook}
                      onChange={(e) => handleInputChange("engagementHook", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Formato o Dinámica de interacción
                      <InfoTooltip text="¿Mediante qué dinámica quieres fomentar la participación?" />
                    </label>
                    <select 
                      className="input-field bg-white ring-1 ring-brand-100"
                      value={formData.communityDynamic}
                      onChange={(e) => handleInputChange("communityDynamic", e.target.value)}
                    >
                      <option value="Debate abierto (Pregunta y respuesta directa libre)">Debate abierto (Fomentar debate en comentarios)</option>
                      <option value="Dilema Versus o Test de Elección (Elegir A o B)">Dilema Versus (Elegir opción A o opción B)</option>
                      <option value="Sorteo interactivo con base de comentarios">Sorteo interactivo (Reglas claras de participación)</option>
                      <option value="Storytime de anécdotas de la marca preguntando al final">Storytime (Conectar humanamente y preguntar sus historias)</option>
                    </select>
                  </div>
                </motion.div>
              )}

              {/* Dynamic inputs - Objective: INFORMAR NOVEDAD */}
              {formData.objective === "Informar sobre una novedad" && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 border-l-2 border-brand-500 pl-4 py-1"
                >
                  <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider">Foco: Anuncios y Claridad</p>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      ¿Cuál es la gran novedad o noticia estrella?
                      <InfoTooltip text="Explica de qué se trata el cambio (Apertura de local, nuevo stock, horario festivo, etc.)" />
                    </label>
                    <textarea 
                      className="input-field ring-1 ring-brand-100 min-h-[60px]"
                      placeholder="Ej: Abrimos nuestra segunda cafetería, con un sector Coworking y terraza Pet Friendly."
                      value={formData.newsDetail}
                      onChange={(e) => handleInputChange("newsDetail", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Fechas, horarios, ubicación o contacto relevante
                      <InfoTooltip text="Datos de logística fundamentales para el post. Aparecerán ordenados y claros." />
                    </label>
                    <input 
                      type="text"
                      className="input-field ring-1 ring-brand-100"
                      placeholder="Ej: Próximo Sábado 15 de Noviembre - 10:00 AM en Calle Italia 520."
                      value={formData.newsDateLocation}
                      onChange={(e) => handleInputChange("newsDateLocation", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Emoción primordial del anuncio
                      <InfoTooltip text="Modula el nivel de entusiasmo y el tipo de energía que transmite el texto." />
                    </label>
                    <select 
                      className="input-field bg-white ring-1 ring-brand-100"
                      value={formData.newsEmotionLevel}
                      onChange={(e) => handleInputChange("newsEmotionLevel", e.target.value)}
                    >
                      <option value="Alegre, festivo y celebratorio (Expresa orgullo y felicidad)">Alegre, festivo y celebratorio</option>
                      <option value="Intrigante, misterioso e incremental (Ideal para expectativa)">De expectativa / Intriga misteriosa</option>
                      <option value="Corporativo, formal, claro y profesional">Corporativo, formal y claro</option>
                      <option value="Urgencia amigable (Límite de tiempo, aviso clave)">Urgencia amigable (Aviso de última hora)</option>
                    </select>
                  </div>
                </motion.div>
              )}

              {/* Dynamic inputs - Objective: CREAR MONTAJES FOTOGRÁFICOS */}
              {formData.objective === "Crear montajes de fotografías reales" && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 border-l-2 border-brand-500 pl-4 py-1"
                >
                  <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider">Foco: Montajes y Dirección de Arte Visual</p>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Descripción de tu producto u objeto en la foto real
                      <InfoTooltip text="Describe exactamente qué hay en tu foto original para que la IA entienda el elemento central. (Ej: 'Una taza de cerámica azul mate', 'Una zapatilla deportiva roja')." />
                    </label>
                    <input 
                      type="text"
                      className="input-field ring-1 ring-brand-100"
                      placeholder="Ej: Una botella de perfume cilíndrica de vidrio transparente con tapa de madera."
                      value={formData.photoOriginalDesc}
                      onChange={(e) => handleInputChange("photoOriginalDesc", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Nuevo fondo o escenario deseado
                      <InfoTooltip text="¿Dónde quieres posicionar tu producto? Describe detalladamente el entorno, colores y elementos del fondo." />
                    </label>
                    <textarea 
                      className="input-field ring-1 ring-brand-100 min-h-[60px]"
                      placeholder="Ej: Sobre una piedra zen mojada en medio de un arroyo con agua cristalina bajo luz del sol matutina filtrada."
                      value={formData.photoBackground}
                      onChange={(e) => handleInputChange("photoBackground", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Estilo estético / Dirección de arte
                      <InfoTooltip text="Define el estilo artístico y la atmósfera de la imagen final del montaje." />
                    </label>
                    <select 
                      className="input-field bg-white ring-1 ring-brand-100"
                      value={formData.photoStyle}
                      onChange={(e) => handleInputChange("photoStyle", e.target.value)}
                    >
                      <option value="Fotografía comercial hiperrealista de estudio (Catálogo)">Fotografía comercial de catálogo (Estudio nítido y limpio)</option>
                      <option value="Cinematográfico de exteriores con profundidad de campo desenfocada (Bokeh suave)">Cinematográfico de exteriores (Fondo suavemente desenfocado)</option>
                      <option value="Estilo orgánico y rústico (Cálido, hogareño, con plantas o madera)">Estilo rústico u orgánico (Cálido y artesanal)</option>
                      <option value="Minimalista moderno ultrafino (Líneas limpias, sombras artísticas de plantas)">Minimalista moderno (Sombras proyectadas elegantes)</option>
                      <option value="Estilo editorial de alta gama / Revista de lujo y lifestyle">Editorial premium (Revista de diseño y lifestyle)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Iluminación y Calidad de luz
                      <InfoTooltip text="Controla cómo incide la luz sobre el producto y el nuevo escenario." />
                    </label>
                    <select 
                      className="input-field bg-white ring-1 ring-brand-100"
                      value={formData.photoLighting}
                      onChange={(e) => handleInputChange("photoLighting", e.target.value)}
                    >
                      <option value="Luz natural suave de ventana con dirección sutil (Estudio casero)">Luz natural suave de ventana lateral</option>
                      <option value="Iluminación dramática lateral con alto contraste (Sombras de atardecer / Golden Hour)">Luz de hora dorada / Sol de tarde (Sombras largas y cálidas)</option>
                      <option value="Luz de estudio fotográfico profesional difusa por softbox (Perfecta e uniforme)">Luz de estudio difusa (Softbox sin reflejos marcados)</option>
                      <option value="Luz artificial de neón vibrante con reflejos cyberpunk (Colores cibernéticos magenta y azul)">Reflejos de neón Cyberpunk (Magenta, cian y azul)</option>
                      <option value="Retroiluminación solar pura que crea un halo de luz (Rim light) en los bordes">Retroiluminación cálida / Halo brillante (Rim light)</option>
                    </select>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-brand-100 text-brand-600 rounded-lg">
                <Users size={24} />
              </div>
              <h2 className="text-xl font-display font-bold">
                3. Audiencia y Estilo
                <InfoTooltip text="Define a quién le hablamos y con qué personalidad." />
              </h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  ¿Quién es tu cliente ideal?
                  <InfoTooltip text="Sé específico: edad, intereses, miedos o deseos." />
                </label>
                <input 
                  type="text"
                  className="input-field"
                  placeholder="Ej: Jóvenes profesionales amantes del buen café."
                  value={formData.targetAudience}
                  onChange={(e) => handleInputChange("targetAudience", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Tono de voz (Elige hasta 2)
                  <InfoTooltip text="Define cómo 'suena' tu marca al hablar." />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TONES.map((tone) => (
                    <button
                      key={tone.id}
                      onClick={() => handleToneToggle(tone.id)}
                      className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                        formData.brandTone.includes(tone.id)
                        ? "bg-brand-500 border-brand-500 text-white"
                        : "bg-white border-slate-200 text-slate-600 hover:border-brand-300"
                      }`}
                    >
                      {tone.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Restricciones adicionales
                  <InfoTooltip text="Cosas que la IA NO debe hacer (ej: sin emojis)." />
                </label>
                <textarea 
                  className="input-field min-h-[60px]"
                  placeholder="Ej: No usar jerga técnica, limitar emojis a solo 2."
                  value={formData.restrictions}
                  onChange={(e) => handleInputChange("restrictions", e.target.value)}
                />
              </div>

              {/* Contextual Recommendation Box */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-brand-50 border border-brand-100 rounded-2xl flex gap-3 text-slate-600 text-xs md:text-sm"
              >
                <Lightbulb size={20} className="text-brand-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-brand-800">Recomendación para {formData.objective}:</span>{" "}
                  {formData.objective === "Vender un producto" && "El público comprador ama saber qué problema exacto le solucionas. Describe a un cliente ideal que sufra ese dolor para que el prompt lo aborde con empatía y ofertas atractivas."}
                  {formData.objective === "Educar a la audiencia" && "Para posts didácticos, define el nivel de conocimiento inicial de tu audiencia. Evita jergas si son principiantes absolutos para que la IA simplifique los conceptos correctamente."}
                  {formData.objective === "Generar interacción/comunidad" && "Un tono amigable, cercano u humorístico es ideal para que las personas rompan el hielo y dejen sus comentarios. ¡Evita tonos solemnes o excesivamente corporativos!"}
                  {formData.objective === "Informar sobre una novedad" && "Para anuncios importantes, la claridad es prioritaria. Especifica en las restricciones si hay detalles logísticos u horarios clave que NO quieres que la IA asuma o invente."}
                  {formData.objective === "Crear montajes de fotografías reales" && "Para montajes fotográficos realistas, describe con el mayor detalle posible el material y textura del producto original (ej: vidrio pulido, cuero mate) y cómo incide la luz sobre este. Esto da un resultado mucho más cohesionado y reduce fallas de perspectiva en la IA de imagen."}
                </div>
              </motion.div>
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div 
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-brand-100 text-brand-600 rounded-lg">
                <Settings size={24} />
              </div>
              <h2 className="text-xl font-display font-bold">
                4. Herramienta y Formato
                <InfoTooltip text="Configura el entregable final del prompt." />
              </h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  ¿Qué necesitas generar hoy?
                  <InfoTooltip text={`Formatos y piezas recomendadas específicamente para el objetivo: "${formData.objective}"`} />
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(OBJECTIVE_TOOLS[formData.objective] || []).map((tool) => {
                    const isSelected = formData.marketingTool === tool.id;
                    return (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => handleInputChange("marketingTool", tool.id)}
                        className={`flex items-start gap-3 p-4 rounded-xl border transition-all text-left ${
                          isSelected 
                          ? "bg-brand-50 border-brand-500 ring-1 ring-brand-500" 
                          : "bg-white border-slate-200 hover:border-brand-300"
                        }`}
                      >
                        <div className={`p-2 rounded-lg shrink-0 ${isSelected ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                          <tool.icon size={18} />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{tool.label}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5 leading-tight">{tool.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Formato de la respuesta
                  <InfoTooltip text="¿Cómo quieres que se organice visualmente el texto?" />
                </label>
                <select 
                  className="input-field"
                  value={formData.outputFormat}
                  onChange={(e) => handleInputChange("outputFormat", e.target.value)}
                >
                  {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div className="pt-4">
                <button 
                  onClick={handleGenerate}
                  disabled={loading || !formData.businessDescription || !formData.specificTopic}
                  className="btn-primary w-full py-4 text-lg shadow-lg shadow-brand-200"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Generando con Inteligencia...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      Generar Prompt Maestro
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        );
      case 5:
        return (
          <motion.div 
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center p-3 bg-green-100 text-green-600 rounded-full mb-2">
                <Check size={32} />
              </div>
              <h2 className="text-2xl font-display font-bold">¡Prompt Generado!</h2>
              <p className="text-slate-500">Copia y pega este prompt en Gemini, ChatGPT o Claude.</p>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-brand-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative bg-white border border-slate-200 rounded-xl p-6 shadow-xl overflow-hidden">
                <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  <pre className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed text-sm">
                    {result}
                  </pre>
                </div>
                <div className="mt-6 flex gap-3">
                  <button 
                    onClick={() => copyToClipboard(result!)}
                    className="flex-1 btn-primary"
                  >
                    {copied ? (
                      <>
                        <Check size={18} />
                        ¡Copiado!
                      </>
                    ) : (
                      <>
                        <Copy size={18} />
                        Copiar al Portapapeles
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => setStep(1)}
                    className="px-6 py-3 border border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 transition-all"
                  >
                    Nuevo Prompt
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 sm:px-6 bg-slate-50">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <header className="text-center space-y-4">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-brand-100 text-brand-700 rounded-full text-xs font-bold uppercase tracking-wider"
          >
            <Sparkles size={14} />
            Arquitecto de Prompts
          </motion.div>
          <motion.h1 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-display font-bold tracking-tight text-slate-900"
          >
            Prompt <span className="text-brand-600">Master</span>
          </motion.h1>
        </header>

        {/* Form Container */}
        <main className="glass-card rounded-3xl p-6 sm:p-10 relative overflow-hidden">
          {/* Progress Bar */}
          {step < 5 && (
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-100">
              <motion.div 
                className="h-full bg-brand-500"
                initial={{ width: "25%" }}
                animate={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          )}

          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>

          {/* Navigation Buttons */}
          {step < 5 && (
            <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-6">
              <button
                onClick={prevStep}
                disabled={step === 1}
                className="flex items-center gap-2 text-slate-500 hover:text-brand-600 disabled:opacity-0 transition-all font-medium"
              >
                <ChevronLeft size={20} />
                Anterior
              </button>
              
              <div className="flex gap-1">
                {[1, 2, 3, 4].map(i => (
                  <div 
                    key={i} 
                    className={`w-2 h-2 rounded-full transition-all ${i === step ? "bg-brand-500 w-4" : "bg-slate-200"}`}
                  />
                ))}
              </div>

              {step < 4 ? (
                <button
                  onClick={nextStep}
                  className="flex items-center gap-2 text-brand-600 hover:text-brand-700 font-bold transition-all"
                >
                  Siguiente
                  <ChevronRight size={20} />
                </button>
              ) : (
                <div className="w-[100px]" /> // Spacer
              )}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="text-center text-slate-400 text-sm space-y-4">
          <button 
            onClick={() => setSuggestionModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-full hover:text-brand-600 hover:border-brand-500 transition-all shadow-sm"
          >
            <MessageSquarePlus size={16} />
            ¿Tienes alguna sugerencia?
          </button>

          <div className="space-y-1">
            <p>© 2026 Prompt Master • Optimizado para emprendedores</p>
            <p>
              Creado por{" "}
              <a 
                href="https://www.instagram.com/bautistacancino/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-brand-500 hover:underline font-medium"
              >
                @bautistacancino
              </a>
            </p>
          </div>
        </footer>

        {/* Suggestion Modal */}
        <AnimatePresence>
          {suggestionModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSuggestionModal(false)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-2">
                    <MessageSquarePlus className="text-brand-600" />
                    Enviar Sugerencia
                  </h3>
                  <button onClick={() => setSuggestionModal(false)} className="p-2 text-slate-400 hover:text-slate-600">
                    <X size={24} />
                  </button>
                </div>

                <p className="text-slate-500 text-sm">
                  Tu feedback nos ayuda a mejorar Prompt Master. Cuéntanos qué te gustaría ver o qué podemos mejorar.
                </p>

                <form onSubmit={handleSendSuggestion} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tu sugerencia</label>
                    <textarea 
                      required
                      className="input-field min-h-[120px]"
                      placeholder="Escribe aquí tu mensaje..."
                      value={suggestionText}
                      onChange={(e) => setSuggestionText(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tu email (opcional)</label>
                    <input 
                      type="email"
                      className="input-field"
                      placeholder="email@ejemplo.com"
                      value={suggestionEmail}
                      onChange={(e) => setSuggestionEmail(e.target.value)}
                    />
                  </div>
                  <button 
                    disabled={sendingSuggestion}
                    type="submit" 
                    className="btn-primary w-full py-4 text-lg"
                  >
                    {sendingSuggestion ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <>
                        <Send size={18} />
                        Enviar Ahora
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
