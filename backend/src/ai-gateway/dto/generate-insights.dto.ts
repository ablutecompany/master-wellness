import { IsString, IsArray, IsBoolean, IsOptional, IsNotEmpty } from 'class-validator';

export class GenerateInsightsDto {
  @IsString()
  @IsNotEmpty()
  analysisId: string;

  @IsString()
  @IsNotEmpty()
  selectedDate: string;

  @IsArray()
  measurements: any[];

  @IsArray()
  events: any[];

  @IsArray()
  @IsOptional()
  ecosystemFacts?: any[];

  @IsBoolean()
  isDemo: boolean;

  @IsOptional()
  @IsString()
  demoScenarioKey?: string;
}
