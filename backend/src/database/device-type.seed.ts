import { NestFactory } from "@nestjs/core";
import { AppModule } from "@/app.module";

import { DeviceTypeRepositoryPort } from "@/domains/asset/application/ports/repositories/device-type.repository.port";
import { DeviceTypeEntity } from "@/domains/asset/domain/entities/device-type.entity";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const repository = app.get<DeviceTypeRepositoryPort>(
    "DeviceTypeRepositoryPort",
  );

  const deviceTypes = [
    {
      name: "Small Chair",
      description: "Compact chair used for employees, visitors, or meeting areas.",
    },
    {
      name: "Large Chair",
      description: "Large office chair designed for comfort and extended use.",
    },
    {
      name: "Workstation Desk",
      description: "Standard office desk used for employee workstations.",
    },
    {
      name: "Standing Desk",
      description: "Height-adjustable desk for sitting or standing work.",
    },
    {
      name: "Pantry Table",
      description: "Table placed in pantry or break areas for dining and resting.",
    },
    {
      name: "Pantry Chair",
      description: "Chair used in pantry or cafeteria areas.",
    },
    {
      name: "Seminar Table",
      description: "Table used in seminar, training, or conference rooms.",
    },
    {
      name: "Seminar Chair",
      description: "Chair used in seminar, training, or conference rooms.",
    },
    {
      name: "TV",
      description: "Television used for presentations, meetings, or entertainment.",
    },
    {
      name: "Whiteboard",
      description: "Whiteboard used for writing notes, teaching, or meetings.",
    },
    {
      name: "Desktop PC",
      description: "Desktop computer assigned for office or technical work.",
    },
    {
      name: "Monitor",
      description: "Computer display monitor used with desktops or laptops.",
    },
    {
      name: "Mouse",
      description: "Pointing input device used for computers.",
    },
    {
      name: "Keyboard",
      description: "Keyboard input device used for computers.",
    },
    {
      name: "Webcam",
      description: "Camera device used for video calls and online meetings.",
    },
    {
      name: "Mobile Phone",
      description: "Mobile phone assigned for employee communication.",
    },
    {
      name: "Laptop",
      description: "Portable computer assigned to employees or departments.",
    },
    {
      name: "Projector",
      description: "Projection device used for meetings, training, or presentations.",
    },
    {
      name: "Projection Screen",
      description: "Screen used together with projectors for presentations.",
    },
    {
      name: "Microwave Oven",
      description: "Microwave appliance used for heating food in pantry areas.",
    },
    {
      name: "Refrigerator",
      description: "Refrigerator used for storing food and beverages.",
    },
    {
      name: "Water Dispenser",
      description: "Hot and cold water dispenser for office staff use.",
    },
    {
      name: "Printer",
      description: "Printing device used for office documents and reports.",
    },
    {
      name: "Speaker",
      description: "Audio output device used in meetings or presentations.",
    },
    {
      name: "Microphone",
      description: "Audio input device used for speaking or presentations.",
    },
    {
      name: "Mobile Cabinet",
      description: "Movable storage cabinet used for documents or office supplies.",
    },
  ];

  for (const item of deviceTypes) {
    const exists = await repository.findByName(item.name);

    if (exists) {
      console.log(`⏩ Already exists: ${item.name}`);
      continue;
    }

    const entity = DeviceTypeEntity.create("", {
      name: item.name,
      description: item.description,
      isActive: true,
    });

    await repository.save(entity);

    console.log(`✅ Created: ${item.name}`);
  }

  console.log("🎉 Device type seeding completed");

  await app.close();
}

bootstrap();