import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import _ from 'lodash';
import { User, UserDocument } from '@/domains/identity/infrastructure/persistence/schemas/user.schema';
import { Role, RoleDocument } from '@/domains/identity/infrastructure/persistence/schemas/role.schema';
import { EndpointPermission, EndpointPermissionDocument } from '@/domains/identity/infrastructure/persistence/schemas/endpoint-permission.schema';
import { IBitmapComputationService } from '@/domains/identity/application/ports/services/bitmap-computation.port';

@Injectable()
export class BitmapComputationService implements IBitmapComputationService {
  private readonly logger = new Logger(BitmapComputationService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(EndpointPermission.name) private epModel: Model<EndpointPermissionDocument>,
  ) {}

  async computeBitmap(userId: string): Promise<Buffer> {
    const user = await this.userModel.findById(userId).select('roleIds').lean();
    if (!user?.roleIds?.length) return Buffer.alloc(0);

    const roles = await this.roleModel
      .find({ _id: { $in: user.roleIds }, isActive: true })
      .select('endpointPermissionIds')
      .lean();

    const epIds = _.uniq(
      _.flatMap(roles, r =>
        r.endpointPermissionIds.map((id: Types.ObjectId) => id.toString()),
      ),
    );
    if (!epIds.length) return Buffer.alloc(0);

    const eps = await this.epModel
      .find({ _id: { $in: epIds }, isActive: true })
      .select('bitIndex')
      .lean();
    if (!eps.length) return Buffer.alloc(0);

    const maxBit = _.maxBy(eps, 'bitIndex')!.bitIndex;
    const buffer = Buffer.alloc(Math.ceil((maxBit + 1) / 8), 0);

    for (const ep of eps) {
      buffer[ep.bitIndex >> 3] |= (1 << (ep.bitIndex & 7));
    }

    return buffer;
  }
}
