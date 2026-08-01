import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ResponseMessage } from '@/shared/presentation/decorators/response-message.decorator';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from '../dtos/organization.dto';
import { CreatePurchaseOrderUseCase } from '@/domains/organization/application/use-cases/purchase-order/create-purchase-order.use-case';
import { UpdatePurchaseOrderUseCase } from '@/domains/organization/application/use-cases/purchase-order/update-purchase-order.use-case';
import { ApprovePurchaseOrderUseCase } from '@/domains/organization/application/use-cases/purchase-order/approve-purchase-order.use-case';
import { GetPurchaseOrdersUseCase } from '@/domains/organization/application/use-cases/purchase-order/get-purchase-orders.use-case';

@ApiTags('Purchase Orders')
@Controller('suppliers/:supplierId/purchase-orders')
export class PurchaseOrderController {
  constructor(
    private readonly createPurchaseOrderUseCase: CreatePurchaseOrderUseCase,
    private readonly updatePurchaseOrderUseCase: UpdatePurchaseOrderUseCase,
    private readonly approvePurchaseOrderUseCase: ApprovePurchaseOrderUseCase,
    private readonly getPurchaseOrdersUseCase: GetPurchaseOrdersUseCase,
  ) {}

  @Get()
  @ResponseMessage('Purchase orders retrieved successfully')
  @ApiOperation({ summary: 'List purchase orders for a supplier' })
  async findAll(@Param('supplierId') supplierId: string) {
    return this.getPurchaseOrdersUseCase.execute({ supplierId });
  }

  @Post()
  @ResponseMessage('Purchase order created successfully')
  @ApiOperation({ summary: 'Create a purchase order for a supplier' })
  async create(
    @Param('supplierId') supplierId: string,
    @Body() dto: CreatePurchaseOrderDto,
  ) {
    return this.createPurchaseOrderUseCase.execute({
      supplierId,
      invoiceNumber: dto.invoiceNumber,
      notes: dto.notes,
      items: dto.items.map((item) => ({
        deviceTypeId: item.deviceTypeId,
        deviceName: item.deviceName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    });
  }

  @Put(':orderId')
  @ResponseMessage('Purchase order updated successfully')
  @ApiOperation({ summary: 'Update a purchase order' })
  async update(
    @Param('supplierId') supplierId: string,
    @Param('orderId') orderId: string,
    @Body() dto: UpdatePurchaseOrderDto,
  ) {
    return this.updatePurchaseOrderUseCase.execute({
      supplierId,
      orderId,
      invoiceNumber: dto.invoiceNumber,
      notes: dto.notes,
      status: dto.status,
      items: dto.items?.map((item) => ({
        deviceTypeId: item.deviceTypeId,
        deviceName: item.deviceName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    });
  }

  @Post(':orderId/approve')
  @ResponseMessage('Purchase order approved successfully')
  @ApiOperation({ summary: 'Approve a purchase order' })
  async approve(
    @Param('supplierId') supplierId: string,
    @Param('orderId') orderId: string,
  ) {
    return this.approvePurchaseOrderUseCase.execute({ supplierId, orderId });
  }
}
