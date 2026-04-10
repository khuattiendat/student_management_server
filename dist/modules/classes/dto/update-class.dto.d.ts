import { ClassStatus, ClassType } from '@/database/entities/class.entity';
import { WeekdayScheduleDto } from './create-class.dto';
export declare class UpdateClassDto {
    name?: string;
    roomName?: string;
    branchId?: number;
    teacherId?: number;
    type?: ClassType;
    status?: ClassStatus;
    weekdays?: number[];
    scheduleByWeekday?: Record<string, WeekdayScheduleDto>;
    studentIds?: number[];
    packageIds?: number[];
}
