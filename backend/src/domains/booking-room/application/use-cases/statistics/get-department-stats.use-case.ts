import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { BookingRepositoryPort } from '../../ports/repositories/booking.repository.port';
import { DepartmentQueryPort } from '../../ports/services/department-query.port';
import { DateRangeDto } from '../../dtos/statistics.dto';

export interface DepartmentStats {
  departmentId: string;
  departmentNameVi: string;
  departmentNameJa: string;
  totalBookings: number;
}

@Injectable()
export class GetDepartmentStatsUseCase implements IUseCase<DateRangeDto, DepartmentStats[]> {
  constructor(
    @Inject('BookingRepositoryPort')
    private readonly bookingRepository: BookingRepositoryPort,
    @Inject('DepartmentQueryPort')
    private readonly departmentQueryPort: DepartmentQueryPort,
  ) {}

  async execute(input: DateRangeDto): Promise<DepartmentStats[]> {
    const today = new Date();
    const startDate = input.startDate ? new Date(input.startDate) : new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = input.endDate ? new Date(input.endDate) : new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const rows = await this.bookingRepository.aggregateDepartmentBookingCount(startDate, endDate);
    
    const departmentIds = rows.map(r => r.departmentId);
    const departments = await this.departmentQueryPort.findByIds(departmentIds);
    
    const deptMap = new Map();
    departments.forEach(d => deptMap.set(d.id, d));

    return rows.map(row => {
      const dept = deptMap.get(row.departmentId);
      return {
        departmentId: row.departmentId,
        departmentNameVi: dept?.nameVi || 'Unknown',
        departmentNameJa: dept?.nameJa || 'Unknown',
        totalBookings: row.count,
      };
    });
  }
}
