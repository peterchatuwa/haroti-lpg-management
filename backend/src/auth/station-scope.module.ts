import { Global, Module } from '@nestjs/common';
import { StationScopeService } from './station-scope.service';

@Global()
@Module({
  providers: [StationScopeService],
  exports: [StationScopeService],
})
export class StationScopeModule {}
