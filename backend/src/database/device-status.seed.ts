import { NestFactory } from "@nestjs/core";
import { AppModule } from "@/app.module";

import { DeviceStatusRepositoryPort } from "@/domains/asset/application/ports/repositories/device-status.repository.port";
import { DeviceStatusEntity } from "@/domains/asset/domain/entities/device-status.entity";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const repository = app.get<DeviceStatusRepositoryPort>(
    "DeviceStatusRepositoryPort",
  );

  const statuses = [
    {
      name: "usable",
      description: "Device is usable but not assigned",
    },
    {
      name: "handed_over",
      description: "Device is currently assigned",
    },
    {
      name: "maintenance",
      description: "Device is under maintenance",
    },
    {
      name: "pending_repair",
      description: "Device is waiting for repair",
    },
    {
      name: "broken",
      description: "Device is broken and cannot be used",
    },
    // {
    //   name: "disposed",
    //   description: "Device has been disposed",
    // },
    {
      name: "lost",
      description: "Device has been lost",
    },
  ];

  for (const item of statuses) {
    const existing = await repository.findByName(item.name);

    if (existing) {
      const updated = DeviceStatusEntity.create(existing.id, {
        name: existing.name,
        description: item.description,
        isActive: true,
      });

      await repository.save(updated);

      console.log(`🔄 Updated: ${item.name}`);
      continue;
    }

    const entity = DeviceStatusEntity.create("", {
      name: item.name,
      description: item.description,
      isActive: true,
    });

    await repository.save(entity);

    console.log(`✅ Created: ${item.name}`);
  }

  console.log("🎉 Device status seeding completed");

  await app.close();
}

bootstrap();