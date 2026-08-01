import { NestFactory } from "@nestjs/core";
import { AppModule } from "@/app.module";

import { RoomRepositoryPort } from "@/domains/booking-room/application/ports/repositories/room.repository.port";
import { MeetingRoomEntity } from "@/domains/booking-room/domain/entities/meeting-room.entity";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const repository = app.get<RoomRepositoryPort>("RoomRepositoryPort");

  const rooms = [
    {
      name: "MTG A",
      jpName: "MTG A",
      capacity: 16,
      description: "Large meeting room for team meetings and presentations.",
    },
    {
      name: "MTG B",
      jpName: "MTG B",
      capacity: 10,
      description: "Meeting room for team meetings and discussions.",
    },
    {
      name: "MTG C",
      jpName: "MTG C",
      capacity: 6,
      description: "Meeting room for small to medium group discussions.",
    },
    {
      name: "PV 1",
      jpName: "PV 1",
      capacity: 3,
      description: "Private booth for calls or focused work.",
    },
    {
      name: "PV 2",
      jpName: "PV 2",
      capacity: 3,
      description: "Private booth for calls or focused work.",
    },
    {
      name: "PV 3",
      jpName: "PV 3",
      capacity: 3,
      description: "Private booth for calls or focused work.",
    },
    {
      name: "PV 4",
      jpName: "PV 4",
      capacity: 3,
      description: "Private booth for calls or focused work.",
    },
    {
      name: "SEMINAR",
      jpName: "SEMINAR",
      capacity: 150,
      description: "Large seminar hall for events and presentations.",
    },
  ];

  const existing = await repository.findAll({});
  const existingByName = new Map(existing.map((room) => [room.name, room]));

  for (const item of rooms) {
    const current = existingByName.get(item.name);

    if (current) {
      if (current.capacity !== item.capacity) {
        current.update({ capacity: item.capacity });
        await repository.save(current);
        console.log(`🔄 Updated capacity: ${item.name} -> ${item.capacity}`);
      } else {
        console.log(`⏩ Already exists: ${item.name}`);
      }
      continue;
    }

    const entity = MeetingRoomEntity.create("", {
      name: item.name,
      jpName: item.jpName,
      capacity: item.capacity,
      description: item.description,
      isActive: true,
    });

    await repository.save(entity);

    console.log(`✅ Created: ${item.name}`);
  }

  console.log("🎉 Meeting room seeding completed");

  await app.close();
}

bootstrap();
