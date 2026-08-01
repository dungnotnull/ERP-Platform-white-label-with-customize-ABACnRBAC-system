import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { CreateRoomUseCase } from '../../application/use-cases/room/create-room.use-case';
import { UpdateRoomUseCase } from '../../application/use-cases/room/update-room.use-case';
import { DeactivateRoomUseCase } from '../../application/use-cases/room/deactivate-room.use-case';
import { GetRoomsUseCase } from '../../application/use-cases/room/get-rooms.use-case';
import { GetAllRoomsUseCase } from '../../application/use-cases/room/get-all-rooms.use-case';
import { CreateRoomDto, UpdateRoomDto, FindRoomsDto } from '../../application/dtos/room.dto';
import { ResponseMessage } from '@/shared/presentation/decorators/response-message.decorator';
import { AuthOnly } from '@/domains/identity/presentation/decorators/auth-only.decorator';

@AuthOnly()
@Controller('rooms')
export class RoomController {
  constructor(
    private readonly createRoomUseCase: CreateRoomUseCase,
    private readonly updateRoomUseCase: UpdateRoomUseCase,
    private readonly deactivateRoomUseCase: DeactivateRoomUseCase,
    private readonly getRoomsUseCase: GetRoomsUseCase,
    private readonly getAllRoomsUseCase: GetAllRoomsUseCase,
  ) {}

  @Get()
  @ResponseMessage('Retrieved meeting rooms successfully')
  async getRooms(@Query() query: FindRoomsDto) {
    return this.getRoomsUseCase.execute(query);
  }

  @Get('all')
  @ResponseMessage('Retrieved all meeting rooms successfully')
  async getAllRooms(@Query() query: FindRoomsDto) {
    return this.getAllRoomsUseCase.execute(query);
  }

  @Post()
  @ResponseMessage('Created meeting room successfully')
  async createRoom(@Body() dto: CreateRoomDto) {
    return this.createRoomUseCase.execute(dto);
  }

  @Put(':id')
  @ResponseMessage('Updated meeting room successfully')
  async updateRoom(@Param('id') id: string, @Body() dto: UpdateRoomDto) {
    return this.updateRoomUseCase.execute({ id, data: dto });
  }

  @Delete(':id')
  @ResponseMessage('Deactivated meeting room successfully')
  async deactivateRoom(@Param('id') id: string) {
    return this.deactivateRoomUseCase.execute(id);
  }
}
