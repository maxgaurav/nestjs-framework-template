import { Module } from '@nestjs/common';
import { EnvironmentModule } from '../environment/environment.module';
import { SetupClusterService } from './services/setup-cluster/setup-cluster.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [EnvironmentModule, CommonModule],
  providers: [SetupClusterService],
})
export class ClusterModule {}
