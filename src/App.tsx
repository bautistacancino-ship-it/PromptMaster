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
  ImagePlus,
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

const MARKETING_TOOLS = [
  { id: "Diseño de Contenido Visual", label: "Diseño de Contenido Visual", icon: Palette, description: "Integra tu foto en un nuevo diseño gráfico" },
  { id: "Grilla de contenido semanal", label: "Grilla de Contenido Semanal", icon: Instagram, description: "Planificación para Instagram/TikTok" },
  { id: "Brief de fotografía de producto", label: "Brief de Fotografía de Producto", icon: ImageIcon, description: "Directrices visuales detalladas" },
  { id: "Copywriting para redes sociales", label: "Copywriting para Redes Sociales", icon: MessageSquare, description: "Captions persuasivas" },
  { id: "Estrategia de lanzamiento", label: "Estrategia de Lanzamiento", icon: Rocket, description: "Plan de marketing para nuevos productos" },
  { id: "Email marketing (Newsletter)", label: "Email Marketing (Newsletter)", icon: Mail, description: "Fidelización o carritos abandonados" },
];

const OBJECTIVES = [
  { id: "Vender un producto", label: "Vender un producto", icon: Rocket, description: "Convierte leads en clientes con mensajes persuasivos." },
  { id: "Educar a la audiencia", label: "Educar a la audiencia", icon: Lightbulb, description: "Posiciónate como experto compartiendo valor." },
  { id: "Generar interacción/comunidad", label: "Generar interacción/comunidad", icon: Users, description: "Fomenta comentarios y engagement genuino." },
  { id: "Informar sobre una novedad", label: "Informar sobre una novedad", icon: MessageSquare, description: "Anuncia lanzamientos, cambios o noticias." },
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
    marketingTool: MARKETING_TOOLS[0].id,
    objective: OBJECTIVES[0].id,
    specificTopic: "",
    brandTone: [],
    restrictions: "",
    outputFormat: FORMATS[0],
    uniqueValue: "",
    keyConcept: "",
    engagementHook: "",
    newsDetail: "",
    productImage: "",
  });

  const [suggestionModal, setSuggestionModal] = useState(false);
  const [suggestionText, setSuggestionText] = useState("");
  const [suggestionEmail, setSuggestionEmail] = useState("");
  const [sendingSuggestion, setSendingSuggestion] = useState(false);

  const handleInputChange = (field: keyof PromptFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
                  onClick={() => handleInputChange("objective", obj.id)}
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
                  className="input-field min-h-[80px]"
                  placeholder="Ej: Cafetería de especialidad con granos de origen único."
                  value={formData.businessDescription}
                  onChange={(e) => handleInputChange("businessDescription", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tema específico para este prompt
                  <InfoTooltip text="¿De qué producto o noticia hablaremos en este post puntual?" />
                </label>
                <input 
                  type="text"
                  className="input-field"
                  placeholder="Ej: Promo de lunes de café en grano."
                  value={formData.specificTopic}
                  onChange={(e) => handleInputChange("specificTopic", e.target.value)}
                />
              </div>

              {/* Adaptive Fields Based on Objective */}
              {formData.objective === "Vender un producto" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Valor único u Oferta especial
                    <InfoTooltip text="¿Por qué deberían comprarte a ti ahora mismo? (Descuento, calidad, etc)." />
                  </label>
                  <input 
                    type="text"
                    className="input-field ring-2 ring-brand-100"
                    placeholder="Ej: 20% de descuento o primer café gratis."
                    value={formData.uniqueValue}
                    onChange={(e) => handleInputChange("uniqueValue", e.target.value)}
                  />
                </motion.div>
              )}

              {formData.objective === "Educar a la audiencia" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Concepto clave o Tip a enseñar
                    <InfoTooltip text="¿Qué aprendizaje útil le vas a regalar a tu seguidor?" />
                  </label>
                  <textarea 
                    className="input-field ring-2 ring-brand-100 min-h-[60px]"
                    placeholder="Ej: Cómo diferenciar un grano arábica de un robusta."
                    value={formData.keyConcept}
                    onChange={(e) => handleInputChange("keyConcept", e.target.value)}
                  />
                </motion.div>
              )}

              {formData.objective === "Generar interacción/comunidad" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Gancho o Pregunta para la comunidad
                    <InfoTooltip text="Una pregunta que obligue a tus seguidores a comentar." />
                  </label>
                  <input 
                    type="text"
                    className="input-field ring-2 ring-brand-100"
                    placeholder="Ej: ¿Eres más de espresso o de latte suave?"
                    value={formData.engagementHook}
                    onChange={(e) => handleInputChange("engagementHook", e.target.value)}
                  />
                </motion.div>
              )}

              {formData.objective === "Informar sobre una novedad" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    ¿Cuál es la gran novedad o noticia?
                    <InfoTooltip text="Lanzamientos, horarios nuevos, eventos, mudanzas..." />
                  </label>
                  <textarea 
                    className="input-field ring-2 ring-brand-100 min-h-[60px]"
                    placeholder="Ej: Abrimos nueva sucursal en el centro el próximo viernes."
                    value={formData.newsDetail}
                    onChange={(e) => handleInputChange("newsDetail", e.target.value)}
                  />
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
                  <InfoTooltip text="El canal o formato de salida que buscas." />
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {MARKETING_TOOLS.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => handleInputChange("marketingTool", tool.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                        formData.marketingTool === tool.id 
                        ? "bg-brand-50 border-brand-500 ring-1 ring-brand-500" 
                        : "bg-white border-slate-200 hover:border-brand-300"
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg ${formData.marketingTool === tool.id ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                        <tool.icon size={16} />
                      </div>
                      <div className="text-sm font-semibold text-slate-900">{tool.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Visual Content Uploader */}
              {formData.marketingTool === "Diseño de Contenido Visual" && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-3"
                >
                  <label className="block text-sm font-medium text-slate-700">
                    Subir foto de producto para el diseño
                    <InfoTooltip text="Sube una foto clara para integrarla en el diseño." />
                  </label>
                  <div className="relative group">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            handleInputChange("productImage", reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                      formData.productImage ? "border-brand-500 bg-brand-50" : "border-slate-200 group-hover:border-brand-300"
                    }`}>
                      {formData.productImage ? (
                        <div className="space-y-2 flex flex-col items-center">
                          <img src={formData.productImage} alt="Preview" className="w-24 h-24 object-cover rounded-lg shadow-sm" />
                          <div className="text-xs text-brand-600 font-medium">Foto cargada correctamente</div>
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInputChange("productImage", "");
                            }}
                            className="text-xs text-slate-400 hover:text-red-500"
                          >
                            Eliminar foto
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2 py-2">
                          <div className="mx-auto w-10 h-10 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center">
                            <ImagePlus size={20} />
                          </div>
                          <div className="text-sm text-slate-600">
                            Haga clic o arrastre para subir su foto
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Formatos: JPG, PNG • Max: 5MB
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

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
