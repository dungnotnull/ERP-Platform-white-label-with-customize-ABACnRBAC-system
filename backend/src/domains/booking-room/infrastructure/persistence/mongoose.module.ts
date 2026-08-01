import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MeetingRoom, MeetingRoomSchema } from './schemas/meeting-room.schema';
import { Booking, BookingSchema } from './schemas/booking.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MeetingRoom.name, schema: MeetingRoomSchema },
      { name: Booking.name, schema: BookingSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class BookingRoomMongooseModule {}
