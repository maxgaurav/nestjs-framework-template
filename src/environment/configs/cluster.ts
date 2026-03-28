import { ClusterConfig } from '../environment-types.interface';

export const clusterConfig = () => ({
  cluster: {
    enable: process.env.CLUSTER_ENABLE === 'true',
    cpuMax: process.env.CLUSTER_MAX_CPU
      ? parseFloat(process.env.CLUSTER_MAX_CPU)
      : 0,
    maxWorkerAttempts: process.env.CLUSTER_MAX_ATTEMPTS
      ? parseFloat(process.env.CLUSTER_MAX_ATTEMPTS)
      : 10,
    healthCheckConfig: {
      primaryCheckInterval: process.env.CLUSTER_HEALTH_PRIMARY_CHECK_INTERVAL
        ? parseFloat(process.env.CLUSTER_HEALTH_PRIMARY_CHECK_INTERVAL)
        : 2000,
      auditInterval: process.env.CLUSTER_HEALTH_AUDIT_INTERVAL
        ? parseFloat(process.env.CLUSTER_HEALTH_AUDIT_INTERVAL)
        : 2000,
      thresholdPercentage: process.env.CLUSTER_HEALTH_AUDIT_THRESHOLD
        ? parseFloat(process.env.CLUSTER_HEALTH_AUDIT_THRESHOLD)
        : 80,
      totalAttempts: process.env.CLUSTER_HEALTH_AUDIT_ATTEMPTS
        ? parseFloat(process.env.CLUSTER_HEALTH_AUDIT_ATTEMPTS)
        : 15,
    },
  } as ClusterConfig,
});
