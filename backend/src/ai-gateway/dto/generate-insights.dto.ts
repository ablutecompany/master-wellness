import { IsString, IsArray, IsBoolean, IsOptional } from 'class-validator';

export class GenerateInsightsDto {
  @IsString()
  analysisId: string;

  @IsString()
  selectedDate: string;

  @IsArray()
  measurements: any[];

  @IsArray()
  events: any[];

  @IsArray()
  ecosystemFacts: any[];

  @IsBoolean()
  isDemo: boolean;

  @IsOptional()
  @IsString()
  demoScenarioKey?: string;
}
