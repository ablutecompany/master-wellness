import {
  SemanticStatus,
  SemanticDomainView,
  SemanticRecommendationView,
  SemanticInsightView,
} from "./types";
import { AnalysisMeasurement, AnalysisEvent } from "../../store/types";

// ── HOLISTIC DIMENSION TYPES (R6.1) ──────────────────────────────────────────

export type DimensionDriver = {
  label: string;
  value?: string | number;
  unit?: string;
  direction: "positive" | "negative" | "neutral";
  impact: "low" | "medium" | "high";
  explanation: string;
};

export type DimensionRecommendation = {
  text: string;
  reason: string;
  type:
    | "hydration"
    | "food"
    | "routine"
    | "monitoring"
    | "recovery"
    | "context";
  priority: "low" | "medium" | "high";
};

export type DimensionReference = {
  factor: string;
  observedValue?: string;
  whyItMatters: string;
  influenceOnScore: string;
  caution?: string;
};

export type HolisticDimension = {
  id: string; // 'energy' | 'recovery' | 'internal_balance' | 'metabolic_rhythm' | 'intestinal_state' | 'food_adjustments' | 'physiological_load' | 'vitality'
  title: string;
  internalTechnicalIds?: string[];
  color: string;
  score: number | null;
  confidence: "low" | "medium" | "high" | "insufficient";
  status: "stable" | "watch" | "priority" | "insufficient";
  summary: string;
  topDrivers: DimensionDriver[];
  recommendations: DimensionRecommendation[];
  referencesIntro?: string;
  references: DimensionReference[];
  limitations: string[];
};

export interface AIReading {
  summary: {
    title: string;
    text: string;
    focusDimensionId?: string;
    confidence: number;
    mode: "simulation" | "real";
  };
  dimensions: HolisticDimension[];
  nextFocus?: {
    dimensionId: string;
    label: string;
    color: string;
    reason?: string;
    shortSummary?: string;
  };
  priorityActions?: any[];
  highlightedThemes?: any[];
  watchSignals?: any[];
  references?: any;
  readingLimits?: string[];
  nutrientPriorities?: NutrientPriority[];
}

export type NutrientPriority = {
  id: string;
  nutrient: string;
  label: string;
  priority: "low" | "medium" | "high";
  confidence: "low" | "medium" | "high";
  reason: string;
  linkedDimensions: string[];
  linkedDrivers: string[];
  foodFamilies: string[];
  exampleFoods: string[];
  avoidOrLimit?: string[];
  timeframe: "today" | "next_24_72h" | "weekly_pattern";
  actionType: "favor" | "balance" | "reduce" | "monitor";
  isMedicalDeficiency: false;
  caution?: string;
  sourceOrigin: "real" | "demo" | "snapshot";
};

export type AiReadingInputSourcePolicy = {
  urine: "used" | "missing" | "excluded_by_user";
  feces: "used" | "missing" | "excluded_by_user";
  physiological: "used" | "missing" | "excluded_by_user";
  context: "used" | "missing" | "excluded_by_user";
  miniapps: "used" | "missing" | "excluded_by_user";
};

export type AiReadingLLMContextV2 = {
  sourceOrigin: string;
  isDemo: boolean;
  analysisDate: string;
  sourcePolicy: AiReadingInputSourcePolicy;
  dimensions: Record<string, any>;
  history: {
    available: boolean;
    readingsCount: number;
    baselineAvailable: boolean;
    limitations: string[];
  };
  safetyRules: string[];
  language: "pt-PT";
  nextFocus?: { dimensionId: string; label: string; color: string };
  nutrientPriorities?: NutrientPriority[];
  measurementsCount: number;
};

export type AiConfigSettings = {
  urinalysis?: boolean;
  stool?: boolean;
  physiology?: boolean;
  context?: boolean;
  miniapps?: boolean;
};

// ── HELPERS ──────────────────────────────────────────────────────────────────
function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
function score01(v: number, inMin: number, inMax: number) {
  return clamp(((v - inMin) / (inMax - inMin)) * 100, 0, 100);
}

function getMeasurement(
  ms: AnalysisMeasurement[],
  type: string,
  marker?: string,
): string {
  const val = ms.find(
    (m) => m.type === type && (!marker || m.marker === marker),
  )?.value;
  return val !== undefined && val !== null ? String(val) : "";
}

function getSleepHours(facts: AnalysisEvent[]): number {
  const f = facts.find(
    (f) =>
      f.type === "sleep_duration_logged" ||
      f.type === "sono_profundo" ||
      f.type === "Sono",
  );
  if (!f) return 0;
  const raw = String(f.value ?? "");
  const match = String(raw).match(/(\d+)h\s*(\d+)?/);
  if (!match) return 0;
  return parseInt(match[1]) + parseInt(match[2] || "0") / 60;
}

// Helper para Status: >=80 Estável, 50-79 Atenção, <50 Prioritário
const getStatus = (score: number | null): HolisticDimension["status"] => {
  if (score === null) return "insufficient";
  if (score >= 80) return "stable";
  if (score >= 50) return "watch";
  return "priority";
};

// ── NEW MOTOR DE CÁLCULO HOLÍSTICO (R6.1) ──────────────────────────────────────

export function computeAIReadingFromData(
  measurements: AnalysisMeasurement[],
  ecosystemFacts: AnalysisEvent[],
  isDemo: boolean,
  aiConfig: AiConfigSettings = {
    urinalysis: true,
    stool: true,
    physiology: true,
    context: true,
    miniapps: true,
  },
): AIReading {
  const sourcePolicy: AiReadingInputSourcePolicy = {
    urine: aiConfig.urinalysis === false ? "excluded_by_user" : "missing",
    feces: aiConfig.stool === false ? "excluded_by_user" : "missing",
    physiological:
      aiConfig.physiology === false ? "excluded_by_user" : "missing",
    context: aiConfig.context === false ? "excluded_by_user" : "missing",
    miniapps: aiConfig.miniapps === false ? "excluded_by_user" : "missing",
  };

  // --- 1. Extração Condicional de Biomarcadores ---

  // Fisiológicos
  let hr = 0,
    hrv = 0,
    temp = 0,
    spo2 = 0;
  if (aiConfig.physiology !== false) {
    hr = parseFloat(
      getMeasurement(measurements, "ecg", "Frequência cardíaca") ||
        getMeasurement(measurements, "ecg", "Ritmo Cardíaco") ||
        "0",
    );
    const hrvStr = getMeasurement(measurements, "ppg", "HRV Estimada");
    const recFact = ecosystemFacts.find((f) => f.type === "Recuperação");
    hrv = parseFloat(hrvStr || (recFact ? String(recFact.value) : "0"));
    temp = parseFloat(
      getMeasurement(measurements, "temp", "Temperatura") || "0",
    );
    spo2 = parseFloat(
      getMeasurement(measurements, "ppg", "SpO2") ||
        getMeasurement(measurements, "ppg", "Saturação de oxigénio") ||
        "0",
    );
    if (hr || hrv || temp || spo2) sourcePolicy.physiological = "used";
  }

  // Urina
  let gravidade = 0,
    na = 0,
    k = 0,
    nakRatio = 0,
    creatinina = 0,
    ph = 0,
    glicose = -1,
    nitritos = -1,
    uACR = 0,
    f2iso = 0,
    ngal = 0,
    kim1 = 0,
    cistatina = 0;
  if (aiConfig.urinalysis !== false) {
    gravidade = parseFloat(
      getMeasurement(measurements, "urinalysis", "Densidade Urinária") ||
        getMeasurement(measurements, "urinalysis", "Gravidade Específica") ||
        "0",
    );
    na = parseFloat(
      getMeasurement(measurements, "urinalysis", "Sódio Urinário") || "0",
    );
    k = parseFloat(
      getMeasurement(measurements, "urinalysis", "Potássio Urinário") || "0",
    );
    nakRatio = parseFloat(
      getMeasurement(measurements, "urinalysis", "Rácio Na/K") || "0",
    );
    creatinina = parseFloat(
      getMeasurement(measurements, "urinalysis", "Creatinina Urinária") || "0",
    );
    ph = parseFloat(
      getMeasurement(measurements, "urinalysis", "pH Urinário") || "0",
    );
    glicose =
      getMeasurement(measurements, "urinalysis", "Glicose") === "Positivo"
        ? 1
        : getMeasurement(measurements, "urinalysis", "Glicose") === "Negativo"
          ? 0
          : -1;
    nitritos =
      getMeasurement(measurements, "urinalysis", "Nitritos") === "Positivo"
        ? 1
        : getMeasurement(measurements, "urinalysis", "Nitritos") === "Negativo"
          ? 0
          : -1;
    uACR = parseFloat(
      getMeasurement(measurements, "urinalysis", "Albumina / uACR") || "0",
    );
    f2iso = parseFloat(
      getMeasurement(measurements, "oxidative", "F2-isoprostanos") || "0",
    );
    ngal = parseFloat(getMeasurement(measurements, "kidney", "NGAL") || "0");
    kim1 = parseFloat(getMeasurement(measurements, "kidney", "KIM-1") || "0");
    cistatina = parseFloat(
      getMeasurement(measurements, "kidney", "Cistatina C Urinária") || "0",
    );

    if (gravidade || na || ph || f2iso || cistatina)
      sourcePolicy.urine = "used";
  }

  // Fezes
  let bristol: string | number = "";
  let fecalOptic = "";
  if (aiConfig.stool !== false) {
    bristol = getMeasurement(measurements, "fecal", "Bristol");
    fecalOptic =
      getMeasurement(measurements, "fecal", "Caracterização Óptica") || "";
    if (bristol || fecalOptic) sourcePolicy.feces = "used";
  }

  // Contexto
  let sleepH = 0;
  if (aiConfig.context !== false) {
    sleepH = getSleepHours(ecosystemFacts);
    if (sleepH > 0) sourcePolicy.context = "used";
  }

  // --- 2. Função Base de Weighted Score ---
  function computeDimensionScore(
    factors: {
      val: number | string;
      weight: number;
      evaluate: (v: any) => number;
      label?: string;
    }[],
    requiredSource?: "used" | "missing" | "excluded_by_user",
  ) {
    if (requiredSource === "excluded_by_user") {
      return { score: null, confidence: "insufficient" as const, drivers: [] };
    }

    let weightSum = 0;
    let scoreSum = 0;
    const usedDrivers: DimensionDriver[] = [];

    factors.forEach((f) => {
      if (f.val !== "0" && f.val !== 0 && f.val !== -1 && f.val !== "") {
        const itemScore = f.evaluate(f.val);
        scoreSum += itemScore * f.weight;
        weightSum += f.weight;
        if (f.label) {
          usedDrivers.push({
            label: f.label,
            value: f.val,
            direction: itemScore >= 80 ? "positive" : "negative",
            impact: f.weight >= 20 ? "high" : "medium",
            explanation: `Contabilizado no cálculo.`,
          });
        }
      }
    });

    if (weightSum === 0)
      return { score: null, confidence: "insufficient" as const, drivers: [] };

    const finalScore = Math.round(scoreSum / weightSum);
    const maxWeight = factors.reduce((acc, f) => acc + f.weight, 0);
    const ratio = weightSum / maxWeight;

    let confidence: "high" | "medium" | "low" | "insufficient" = "low";
    if (ratio >= 0.7) confidence = "high";
    else if (ratio >= 0.4) confidence = "medium";
    else if (ratio >= 0.2) confidence = "low";
    else confidence = "insufficient";

    return { score: finalScore, confidence, drivers: usedDrivers };
  }

  const evalBristol = (v: any) => {
    const num = parseInt(v.toString().replace(/\D/g, ""));
    if (num === 3 || num === 4) return 100;
    if (num === 2 || num === 5) return 60;
    return 20;
  };

  // --- 3. Calcular as 8 Dimensões Canónicas ---

  const recRes = computeDimensionScore([
    {
      label: "F2-isoprostanos",
      val: f2iso,
      weight: 25,
      evaluate: (v) => score01(v, 2.5, 0.5),
    },
    {
      label: "Frequência Cardíaca",
      val: hr,
      weight: 20,
      evaluate: (v) => (v >= 50 && v <= 75 ? 100 : score01(v, 100, 75)),
    },
    {
      label: "Temperatura",
      val: temp,
      weight: 15,
      evaluate: (v) => (v >= 36.1 && v <= 37.2 ? 100 : score01(v, 38, 37.2)),
    },
    {
      label: "Sono (horas)",
      val: sleepH,
      weight: 10,
      evaluate: (v) => score01(v, 4, 8),
    },
  ]);

  const eqRes = computeDimensionScore(
    [
      {
        label: "Densidade Urinária",
        val: gravidade,
        weight: 30,
        evaluate: (v) => score01(v, 1.03, 1.01),
      },
      {
        label: "Rácio Na/K",
        val: nakRatio,
        weight: 20,
        evaluate: (v) => score01(v, 3.5, 1.0),
      },
      {
        label: "Sódio Urinário",
        val: na,
        weight: na > 100 ? 30 : 15,
        evaluate: (v) => score01(v, 130, 70),
      },
      {
        label: "pH",
        val: ph,
        weight: 5,
        evaluate: (v) => (v >= 5.5 && v <= 7.5 ? 100 : 50),
      },
    ],
    sourcePolicy.urine,
  );

  const metRes = computeDimensionScore([
    {
      label: "Glicose",
      val: glicose === 1 ? 1 : 0,
      weight: 20,
      evaluate: (v) => (v === 1 ? 20 : 100),
    },
    {
      label: "pH",
      val: ph,
      weight: 10,
      evaluate: (v) => (v >= 5.5 && v <= 7.5 ? 100 : 50),
    },
    {
      label: "Sono (horas)",
      val: sleepH,
      weight: 10,
      evaluate: (v) => score01(v, 4, 8),
    },
  ]);

  const digRes = computeDimensionScore(
    [
      {
        label: "Escala de Bristol",
        val: bristol,
        weight: 40,
        evaluate: evalBristol,
      },
      {
        label: "Óptica",
        val: fecalOptic ? 1 : 0,
        weight: 20,
        evaluate: (v) => (v === 1 && !fecalOptic.includes("seca") ? 100 : 50),
      },
    ],
    sourcePolicy.feces,
  );

  const nutRes = computeDimensionScore([
    {
      label: "Rácio Na/K",
      val: nakRatio,
      weight: 25,
      evaluate: (v) => score01(v, 3.5, 1.0),
    },
    {
      label: "Sódio Urinário",
      val: na,
      weight: na > 100 ? 35 : 0,
      evaluate: (v) => score01(v, 130, 70),
    },
    {
      label: "Densidade Urinária",
      val: gravidade,
      weight: 10,
      evaluate: (v) => score01(v, 1.03, 1.01),
    },
    {
      label: "Escala de Bristol",
      val: bristol,
      weight: 20,
      evaluate: evalBristol,
    },
  ]);

  const vitRes = computeDimensionScore([
    {
      label: "uACR",
      val: uACR,
      weight: 25,
      evaluate: (v) => score01(v, 30, 5),
    },
    {
      label: "Cistatina",
      val: cistatina,
      weight: 12,
      evaluate: (v) => score01(v, 0.15, 0.05),
    },
    {
      label: "KIM-1",
      val: kim1,
      weight: 12,
      evaluate: (v) => score01(v, 1.5, 0.5),
    },
  ]);

  const physLoadRes = computeDimensionScore(
    [
      {
        label: "Frequência Cardíaca",
        val: hr,
        weight: 30,
        evaluate: (v) => (v >= 50 && v <= 80 ? 100 : score01(v, 110, 80)),
      },
      {
        label: "HRV",
        val: hrv,
        weight: 30,
        evaluate: (v) => (v >= 40 ? 100 : score01(v, 10, 40)),
      },
      {
        label: "SpO2",
        val: spo2,
        weight: 20,
        evaluate: (v) => (v >= 95 ? 100 : score01(v, 90, 95)),
      },
    ],
    sourcePolicy.physiological,
  );

  const energyRes = computeDimensionScore([
    {
      label: "FC Otimizada",
      val: hr ? 1 : 0,
      weight: 25,
      evaluate: () => (hr >= 50 && hr <= 80 ? 100 : 60),
    },
    {
      label: "Recuperação Base",
      val: recRes.score || 0,
      weight: 25,
      evaluate: (v) => v,
    },
    {
      label: "Equilíbrio",
      val: eqRes.score || 0,
      weight: 20,
      evaluate: (v) => v,
    },
  ]);

  const genHolistic = (
    id: string,
    title: string,
    color: string,
    res: { score: number | null; confidence: any; drivers: DimensionDriver[] },
    missingOrExcludedSource?: "used" | "missing" | "excluded_by_user",
    excludedSourceLabel?: string,
  ): HolisticDimension => {
    let finalConfidence = res.confidence;
    let limitWarning = "";

    if (missingOrExcludedSource === "excluded_by_user") {
      finalConfidence = "insufficient";
      limitWarning = `Os dados de ${excludedSourceLabel} não foram considerados por estarem desativados nas Configurações.`;
    }

    // Normalizador de referências conforme exigido
    const normalizeDriverForDisplay = (d: DimensionDriver, dimId: string): DimensionReference => {
      let factor = d.label;
      let valRaw = d.value;
      
      const dictionary: Record<string, string> = {
        fC: "Frequência cardíaca",
        "FC Otimizada": "Frequência cardíaca",
        "Recuperação Base": "Recuperação contextual",
        Equilíbrio: "Equilíbrio", // Mantém mas com lowercase depois se precisar
        HRV: "Variabilidade da frequência cardíaca",
        SpO2: "Saturação de oxigénio",
        sleepHours: "Sono",
        "Sono (horas)": "Sono",
        stress: "Stress",
        recovery: "Recuperação",
        steps: "Atividade diária",
        urinarySodium: "Sódio urinário",
        "Sódio Urinário": "Sódio urinário",
        urineDensity: "Densidade urinária",
        "Densidade Urinária": "Densidade urinária",
        naKRatio: "Rácio sódio/potássio",
        bristol: "Escala de Bristol",
        fecalOptical: "Caracterização óptica das fezes",
        temperature: "Temperatura",
        Temperatura: "Temperatura"
      };
      
      factor = dictionary[factor] || factor;

      // Formatar valores
      let displayValue = "";
      if (valRaw !== undefined && valRaw !== null && valRaw !== "0") {
        const numVal = Number(valRaw);
        if (factor === "Sono") {
          if (!isNaN(numVal)) {
            const hrs = Math.floor(numVal);
            const mins = Math.round((numVal - hrs) * 60);
            displayValue = `${hrs}h${mins.toString().padStart(2, "0")}`;
          } else {
             displayValue = String(valRaw);
          }
        } else if (factor === "Atividade diária" || d.label === "Passos") {
          displayValue = !isNaN(numVal) ? `${numVal.toLocaleString('pt-PT')} passos` : String(valRaw);
        } else if (factor === "Recuperação contextual" || factor === "Recuperação") {
          displayValue = !isNaN(numVal) ? `${numVal}%` : String(valRaw);
        } else if (factor === "Temperatura") {
          displayValue = !isNaN(numVal) ? `${numVal.toLocaleString('pt-PT')} °C` : String(valRaw);
        } else {
          displayValue = String(valRaw);
        }
      }

      // Humanizar impacto
      let influenceMsg = "";
      if (dimId === "energy") {
        if (d.direction === "negative") {
           if (factor === "Sono") influenceMsg = `as ${displayValue} ficaram abaixo do desejável e reduziram a margem de energia disponível.`;
           else if (factor === "Stress") influenceMsg = `surgiu elevado e contribuiu para maior desgaste nesta leitura.`;
           else if (factor.includes("Recuperação")) influenceMsg = `o valor de ${displayValue} pesou negativamente na energia disponível.`;
           else if (factor === "Atividade diária") influenceMsg = `os ${displayValue} ajudam a contextualizar a carga funcional do dia.`;
           else influenceMsg = `pesou na margem de energia disponível.`;
        } else {
           influenceMsg = `ajudou a sustentar a energia nesta leitura.`;
        }
      } else if (dimId === "recovery") {
        if (d.direction === "negative") {
           if (factor === "Sono") influenceMsg = `as ${displayValue} reduzem a margem de recuperação.`;
           else if (factor.includes("Recuperação")) influenceMsg = `o valor de ${displayValue} reforça a necessidade de acompanhar a evolução.`;
           else if (factor === "Stress") influenceMsg = `surgiu elevado e pode dificultar a recuperação.`;
           else influenceMsg = `pesou negativamente na recuperação.`;
        } else {
           influenceMsg = `ajudou a sustentar a recuperação.`;
        }
      } else {
         if (d.direction === "negative") {
           if (factor === "Sódio urinário" && Number(valRaw) > 100) {
             influenceMsg = "surgiu elevado e teve peso na recomendação de moderar refeições muito salgadas.";
           } else {
             influenceMsg = `o valor de ${displayValue} pesou negativamente nesta leitura.`;
           }
         } else {
           if (factor === "Densidade urinária") influenceMsg = "ajudou a avaliar a concentração da urina.";
           else influenceMsg = `ajudou a sustentar uma leitura mais favorável.`;
         }
      }

      // Clean up internal labels if they still leaked
      if (factor === "Frequência cardíaca" && displayValue === "1") {
         influenceMsg = influenceMsg.replace(`o valor de 1 `, ``);
         displayValue = ""; 
      }

      return {
        factor,
        observedValue: displayValue,
        whyItMatters: "",
        influenceOnScore: influenceMsg,
      };
    };

    const baseReferences: DimensionReference[] = res.drivers.map((d) => normalizeDriverForDisplay(d, id));

    if (limitWarning) {
      baseReferences.push({
        factor: `Exclusão: ${excludedSourceLabel}`,
        whyItMatters: "Preferência do utilizador.",
        influenceOnScore: limitWarning,
      });
    }

    const statusObj = getStatus(res.score);
    const ptStatus =
      statusObj === "stable"
        ? "estável"
        : statusObj === "priority"
          ? "prioritária"
          : "em atenção";

    let fallbackSummary = "A aguardar mais dados...";
    if (res.score !== null) {
      const driversDesc =
        res.drivers.length > 0
          ? res.drivers.map((d) => d.label).join(", ")
          : "os sinais gerais";
      if (id === "energy") {
        fallbackSummary = `Esta dimensão reflete a energia funcional disponível nesta leitura. Os dados atuais sugerem uma condição ${ptStatus}, considerando sobretudo ${driversDesc}.`;
      } else if (id === "intestinal_state") {
        fallbackSummary = `Esta dimensão considera os dados fecais disponíveis. Nesta leitura, os sinais sugerem uma condição ${ptStatus}, com impacto de ${driversDesc}.`;
      } else if (id === "physiological_load") {
        fallbackSummary = `Reflete a tensão fisiológica ou exigência detetada. O corpo apresenta um estado ${ptStatus}, influenciado por marcadores como ${driversDesc}.`;
      } else if (id === "recovery") {
        fallbackSummary = `Avalia a resposta do corpo face à carga recente. Os sinais vitais apontam para uma recuperação ${ptStatus}, destacando-se ${driversDesc}.`;
      } else if (id === "internal_balance") {
        fallbackSummary = `A avaliação do equilíbrio de fluidos e minerais revela uma condição ${ptStatus}, tendo em conta ${driversDesc}.`;
      } else if (id === "metabolic_rhythm") {
        fallbackSummary = `O ritmo metabólico atual reflete um estado ${ptStatus}, fundamentado em sinais como ${driversDesc}.`;
      } else if (id === "food_adjustments") {
        fallbackSummary = `Com base nos sinais avaliados, os ajustes alimentares encontram-se num nível ${ptStatus}, considerando ${driversDesc}.`;
      } else if (id === "vitality") {
        fallbackSummary = `A análise longitudinal e estabilidade de longo prazo apontam para um estado ${ptStatus}, refletindo ${driversDesc}.`;
      } else {
        fallbackSummary = `A análise preliminar encontra-se num estado ${ptStatus}, impulsionada por ${driversDesc}.`;
      }
    }

    return {
      id,
      title,
      color,
      score: res.score,
      confidence: finalConfidence,
      status: statusObj,
      summary: fallbackSummary,
      topDrivers: res.drivers,
      recommendations: [],
      referencesIntro: "Entre outras, esta avaliação considerou:",
      references: baseReferences,
      limitations: limitWarning ? [limitWarning] : [],
    };
  };

  const dimensions: HolisticDimension[] = [
    genHolistic("energy", "Energia", "#38BDF8", energyRes),
    genHolistic("recovery", "Recuperação", "#6366F1", recRes),
    genHolistic(
      "internal_balance",
      "Equilíbrio interno",
      "#14B8A6",
      eqRes,
      sourcePolicy.urine,
      "Urina",
    ),
    genHolistic("metabolic_rhythm", "Ritmo metabólico", "#22C55E", metRes),
    genHolistic(
      "intestinal_state",
      "Estado intestinal",
      "#D97706",
      digRes,
      sourcePolicy.feces,
      "Fezes",
    ),
    genHolistic("food_adjustments", "Ajustes alimentares", "#F59E0B", nutRes),
    genHolistic(
      "physiological_load",
      "Carga fisiológica",
      "#EAB308",
      physLoadRes,
      sourcePolicy.physiological,
      "Fisiológicos",
    ),
    genHolistic("vitality", "Vitalidade", "#8B5CF6", vitRes),
  ];

  // Determinar Próximo Foco
  let nextFocusDimension: HolisticDimension | null = null;
  const hasMomentaryIssue = dimensions.some(dim => dim.score !== null && ['energy', 'recovery', 'physiological_load', 'intestinal_state', 'food_adjustments', 'internal_balance'].includes(dim.id) && (dim.status === 'priority' || dim.status === 'watch'));

  let candidates = dimensions.filter(d => d.score !== null && d.confidence !== "insufficient");

  // Bloqueio Longitudinal da Vitalidade
  const vit = candidates.find(d => d.id === 'vitality');
  if (vit) {
    if (isDemo || vit.confidence === "low" || hasMomentaryIssue) {
      candidates = candidates.filter(d => d.id !== 'vitality');
    } else if (vit.score !== null && vit.score > 40) {
      candidates = candidates.filter(d => d.id !== 'vitality');
    }
  }

  if (candidates.length > 0) {
    // Encontrar o menor score
    let lowestScore = 101;
    for (const d of candidates) {
      if (d.score !== null && d.score < lowestScore) {
        lowestScore = d.score;
      }
    }
    
    // Todos com o menor score (ou próximo se quisermos)
    const lowestCandidates = candidates.filter(d => d.score === lowestScore);
    
    if (lowestCandidates.length === 1) {
      nextFocusDimension = lowestCandidates[0];
    } else {
      // Prioridade de desempate
      const priorityOrder = [
        "food_adjustments",
        "energy",
        "recovery",
        "internal_balance",
        "intestinal_state",
        "physiological_load",
        "metabolic_rhythm",
        "vitality"
      ];
      
      lowestCandidates.sort((a, b) => {
        const indexA = priorityOrder.indexOf(a.id);
        const indexB = priorityOrder.indexOf(b.id);
        return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
      });
      
      nextFocusDimension = lowestCandidates[0];
    }
  }

  const nextFocus = nextFocusDimension
    ? {
        dimensionId: nextFocusDimension.id,
        label: nextFocusDimension.title,
        color: nextFocusDimension.color,
      }
    : undefined;

  // Fallback Summary Generator for failures
  let localSummaryFallback = "";
  if (nextFocusDimension) {
    const fdDrivers = nextFocusDimension.topDrivers
      .map((d) => d.label)
      .join(", ");
    localSummaryFallback = `Hoje a leitura aponta para estabilidade, mas com atenção especial a ${nextFocusDimension.title.toLowerCase()}. A interpretação foi influenciada sobretudo pelos sinais de ${fdDrivers || "avaliação"}. A prioridade prática é acompanhar a evolução desta dimensão na próxima análise.`;
  } else {
    localSummaryFallback = `A sua sessão de hoje revela um estado geral estável e consistente nas várias dimensões. A interpretação dos sinais indica ausência de desvios prioritários. A prioridade prática é manter a rotina atual.`;
  }

  // R5D Nutrient Priorities Fallback (simplified for engine build)
  const nutrientPriorities: NutrientPriority[] = [];
  if (gravidade > 1.025 && sourcePolicy.urine !== "excluded_by_user") {
    nutrientPriorities.push({
      id: "np1",
      nutrient: "Água",
      label: "Hidratação",
      priority: "high",
      confidence: "high",
      reason: "Sinais de concentração elevada.",
      linkedDimensions: ["internal_balance"],
      linkedDrivers: ["Densidade Urinária"],
      foodFamilies: ["Sopas", "Fruta rica em água"],
      exampleFoods: ["Melancia", "Pepino"],
      timeframe: "today",
      actionType: "favor",
      isMedicalDeficiency: false,
      sourceOrigin: isDemo ? "demo" : "real",
    });
  }

  return {
    summary: {
      title: "Leitura Pronta",
      text: "Interpretação dos resultados pela IA está dependente o processamento. Por favor, aguarde reposta do motor de IA.",
      confidence: 0.85,
      mode: isDemo ? "simulation" : "real",
      fallbackText: localSummaryFallback,
    } as any,
    dimensions,
    nextFocus,
    nutrientPriorities,
  };
}

export function buildAiReadingLLMContextV2(
  reading: AIReading,
  isDemo: boolean,
): AiReadingLLMContextV2 {
  // Config check: Re-compute missing vs excluded based on the generated limitations
  const sourcePolicy: AiReadingInputSourcePolicy = {
    urine: reading.dimensions
      .find((d) => d.id === "internal_balance")
      ?.limitations.some((l) => l.includes("desativados"))
      ? "excluded_by_user"
      : "used",
    feces: reading.dimensions
      .find((d) => d.id === "intestinal_state")
      ?.limitations.some((l) => l.includes("desativados"))
      ? "excluded_by_user"
      : "used",
    physiological: reading.dimensions
      .find((d) => d.id === "physiological_load")
      ?.limitations.some((l) => l.includes("desativados"))
      ? "excluded_by_user"
      : "used",
    context: "used",
    miniapps: "used",
  };

  const aiReadingInput = {
    sourceOrigin: isDemo ? "demo" : "real",
    isDemo,
    analysisDate: new Date().toISOString(),
    sourcePolicy,
    dimensions: reading.dimensions.map((d) => ({
      id: d.id,
      label: d.title,
      type:
        d.id === "energy" ||
        d.id === "recovery" ||
        d.id === "intestinal_state" ||
        d.id === "food_adjustments" ||
        d.id === "physiological_load"
          ? "momentary"
          : d.id === "vitality"
            ? "longitudinal"
            : "functional",
      score: d.score,
      state: d.status,
      stateLabel:
        d.status === "stable"
          ? "Estável"
          : d.status === "priority"
            ? "Prioritário"
            : d.status === "watch"
              ? "Atenção"
              : "Insuficiente",
      confidence: d.confidence,
      drivers: d.topDrivers,
      references: d.references,
      limitations: d.limitations,
    })),
    history: {
      available: false,
      readingsCount: 1, // Fallback, would be injected by parent
      baselineAvailable: false,
      limitations: [
        "O utilizador não tem histórico suficiente. As dimensões de Vitalidade e Recuperação devem ser vistas de forma pontual e muito prudente.",
      ],
    },
    safetyRules: [
      "No clinical diagnosis",
      "Use Portuguese",
      "No medical supplement claims as first-line",
    ],
    language: "pt-PT" as const,
    nextFocus: reading.nextFocus,
    nutrientPriorities: reading.nutrientPriorities || [],
    measurementsCount: reading.dimensions.reduce(
      (acc, d) => acc + d.topDrivers.length,
      0,
    ),
  };

  console.log(
    "[AI_READING_INPUT_DEBUG]",
    JSON.stringify(aiReadingInput, null, 2),
  );

  return aiReadingInput;
}
