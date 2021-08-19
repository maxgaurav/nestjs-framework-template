export const clusterConfig = () => ({
  cluster: {
    enable: process.env.CLUSTER_ENABLE === 'true',
    cpuMax: !!process.env.CLUSTER_MAX_CPU
      ? parseFloat(process.env.CLUSTER_MAX_CPU)
      : 0,
    maxWorkerAttempts: !!process.env.CLUSTER_MAX_ATTEMPTS
      ? parseFloat(process.env.CLUSTER_MAX_ATTEMPTS)
      : 10,
  },
});
