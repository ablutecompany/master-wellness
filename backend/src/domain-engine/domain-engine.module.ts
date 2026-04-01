import { Module } from '@nestjs/common';
import { ScoringService } from './scoring.service';
import { InsightComposerService } from './insight-composer.service';
import { RecommendationComposerService } from './recommendation-composer.service';

@Module({
  providers: [
    ScoringService,
    InsightComposerService,
    RecommendationComposerService
  ],
  exports: [
    ScoringService,
    InsightComposerService,
    RecommendationComposerService
  ],
})
export class DomainEngineModule {}
