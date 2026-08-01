import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DepartmentQueryPort, DepartmentDetails } from '@/domains/booking-room/application/ports/services/department-query.port';
import { Department, DepartmentDocument } from '../persistence/schemas/department.schema';

@Injectable()
export class DepartmentQueryAdapter implements DepartmentQueryPort {
  constructor(@InjectModel(Department.name) private readonly model: Model<DepartmentDocument>) {}

  async findById(id: string): Promise<DepartmentDetails | null> {
    const doc = await this.model.findById(id).select('_id nameVi nameJa').lean().exec();
    if (!doc) return null;

    return {
      id: doc._id.toString(),
      nameVi: doc.nameVi,
      nameJa: doc.nameJa,
    };
  }

  async findByIds(ids: string[]): Promise<DepartmentDetails[]> {
    const objectIds = ids.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
    const docs = await this.model.find({ _id: { $in: objectIds } }).select('_id nameVi nameJa').lean().exec();

    return docs.map((doc) => ({
      id: doc._id.toString(),
      nameVi: doc.nameVi,
      nameJa: doc.nameJa,
    }));
  }
}
