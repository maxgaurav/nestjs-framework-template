import { Module } from '@nestjs/common';
import { EnvironmentModule } from '../environment/environment.module.js';
import { SetupClusterService } from './services/setup-cluster/setup-cluster.service.js';
import { CommonModule } from '../common/common.module.js';

@Module({
  imports: [EnvironmentModule, CommonModule],
  providers: [SetupClusterService],
})
export class ClusterModule {}
