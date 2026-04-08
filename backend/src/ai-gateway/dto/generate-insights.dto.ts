export class GenerateInsightsDto {
  analysisId: string;
  selectedDate: string;
  measurements: any[];
  events: any[];
  ecosystemFacts: any[];
  isDemo: boolean;
  demoScenarioKey?: string;
}
