const cases = [
  {
    name: "Caso 1: Dados completos e normais",
    payload: {
      analysisId: "test-001",
      selectedDate: "2026-04-08",
      measurements: [
        { type: "urinalysis", marker: "pH Urinário", value: "6.5", unit: "pH" },
        { type: "urinalysis", marker: "Gravidade Específica", value: "1.015", unit: "g/mL" },
        { type: "ecg", marker: "Ritmo Cardíaco", value: "68", unit: "bpm" },
        { type: "ppg", marker: "HRV Estimada", value: "42", unit: "ms" },
        { type: "temp", marker: "Temperatura", value: "36.4", unit: "°C" },
        { type: "fecal", marker: "Bristol", value: "Tipo 4", unit: "" }
      ],
      events: [
        { type: "sleep_duration_logged", value: "7h 12m", sourceAppId: "apple_health" }
      ],
      ecosystemFacts: [],
      isDemo: false
    }
  },
  {
    name: "Caso 2: Dados mínimos (1 marcador)",
    payload: {
      analysisId: "test-002",
      selectedDate: "2026-04-08",
      measurements: [
        { type: "urinalysis", marker: "pH Urinário", value: "6.5", unit: "pH" }
      ],
      events: [],
      ecosystemFacts: [],
      isDemo: false
    }
  },
  {
    name: "Caso 3: Valor fora do esperado sem alarmismo",
    payload: {
      analysisId: "test-003",
      selectedDate: "2026-04-08",
      measurements: [
        { type: "urinalysis", marker: "pH Urinário", value: "8.5", unit: "pH" },
        { type: "urinalysis", marker: "Gravidade Específica", value: "1.015", unit: "g/mL" }
      ],
      events: [],
      ecosystemFacts: [],
      isDemo: false
    }
  },
  {
    name: "Caso 4: Demo activo",
    payload: {
      analysisId: "test-004",
      selectedDate: "2026-04-08",
      measurements: [
        { type: "urinalysis", marker: "pH Urinário", value: "6.5", unit: "pH" },
        { type: "ecg", marker: "Ritmo Cardíaco", value: "65", unit: "bpm" }
      ],
      events: [],
      ecosystemFacts: [],
      isDemo: true,
      demoScenarioKey: "healthy_baseline"
    }
  },
  {
    name: "Caso 5: Sem dados de sono",
    payload: {
      analysisId: "test-005",
      selectedDate: "2026-04-08",
      measurements: [
        { type: "urinalysis", marker: "pH Urinário", value: "6.5", unit: "pH" },
        { type: "ppg", marker: "HRV Estimada", value: "40", unit: "ms" }
      ],
      events: [],
      ecosystemFacts: [],
      isDemo: false
    }
  }
];

async function main() {
  console.log("Iniciando Validação de Operacional M4...\n");
  for (const testCase of cases) {
    console.log(`Executando ${testCase.name}...`);
    try {
      const response = await fetch('http://localhost:3000/ai-gateway/generate-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase.payload)
      });

      const status = response.status;
      const bodyText = await response.text();
      let data = null;
      try {
        data = JSON.parse(bodyText);
      } catch (e) {
        // Not JSON
      }

      console.log(`Status: ${status}`);
      if (response.ok && data?.ok) {
        console.log("Payload:", JSON.stringify(data.insight, null, 2));
      } else {
        console.log("ERRO ENCONTRADO:");
        if (data) {
          console.log("JSON Error:", JSON.stringify(data, null, 2));
        } else {
          console.log("Raw Response:", bodyText);
        }
      }
      console.log("\n---\n");
    } catch (e) {
      console.error(`Erro ao executar teste ${testCase.name}:`, e.message);
    }
  }
}

main();
