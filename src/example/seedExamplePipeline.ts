import { prisma } from "../config/db";
import { examplePipeline } from "./examplePipeline";

async function main() {
  const existing = await prisma.pipeline.findFirst({
    where: { name: examplePipeline.name },
  });

  if (existing) {
    // eslint-disable-next-line no-console
    console.log("Example pipeline already exists:", existing.id);
    return;
  }

  const created = await prisma.pipeline.create({
    data: {
      name: examplePipeline.name,
      description: examplePipeline.description,
      steps: {
        create: examplePipeline.steps.map((s, idx) => ({
          stepOrder: idx + 1,
          stepType: s.stepType,
          promptTemplate: s.promptTemplate,
        })),
      },
    },
  });

  // eslint-disable-next-line no-console
  console.log("Created example pipeline:", created.id);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

