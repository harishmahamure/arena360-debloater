import type { ResourceEntry } from "./types";

export interface ResourceUsageTotals {
  totalCpuPercent: number;
  totalRamMb: number;
  totalDiskMbps: number;
  totalNetworkConnections: number;
}

export function aggregateResourceUsage(entries: ResourceEntry[]): ResourceUsageTotals {
  return entries.reduce(
    (acc, entry) => ({
      totalCpuPercent: acc.totalCpuPercent + entry.cpuPercent,
      totalRamMb: acc.totalRamMb + entry.ramMb,
      totalDiskMbps: acc.totalDiskMbps + (entry.diskMbps ?? 0),
      totalNetworkConnections: acc.totalNetworkConnections + (entry.networkConnections ?? 0),
    }),
    {
      totalCpuPercent: 0,
      totalRamMb: 0,
      totalDiskMbps: 0,
      totalNetworkConnections: 0,
    },
  );
}
