import { Module } from '@nestjs/common';
import { ThemeEngineService } from './theme-engine.service';
import { ThemeController } from './theme-controller';
import { DomainEngineModule } from '../domain-engine/domain-engine.module';

@Module({
  imports: [DomainEngineModule],
  providers: [ThemeEngineService],
  controllers: [ThemeController],
  exports: [ThemeEngineService],
})
export class ThemeModule {}
