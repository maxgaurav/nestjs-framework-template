import { Module } from '@nestjs/common';
import { EnvironmentModule } from '../environment/environment.module';
import { SetupClusterService } from './services/setup-cluster/setup-cluster.service';

@Module({
  imports: [EnvironmentModule],
  providers: [SetupClusterService],
})
export class ClusterModule {}
