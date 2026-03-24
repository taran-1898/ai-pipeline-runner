import { prisma } from "../config/db";

export class ModelMetricsService {
  async listMetrics() {
    return prisma.modelMetrics.findMany({
      orderBy: { model: "asc" },
    });
  }
}

