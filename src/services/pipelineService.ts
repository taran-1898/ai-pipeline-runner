import { prisma } from "../config/db";
import { PipelineDefinition } from "../models/pipeline";

export class PipelineService {
  async createPipeline(def: PipelineDefinition) {
    const created = await prisma.pipeline.create({
      data: {
        name: def.name,
        description: def.description,
        steps: {
          create: def.steps.map((step, index) => ({
            stepOrder: index + 1,
            stepType: step.stepType,
            promptTemplate: step.promptTemplate,
          })),
        },
      },
      include: { steps: true },
    });

    return created;
  }

  async listPipelines() {
    return prisma.pipeline.findMany({
      include: { steps: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getPipelineById(id: string) {
    return prisma.pipeline.findUnique({
      where: { id },
      include: { steps: { orderBy: { stepOrder: "asc" } } },
    });
  }
}

