import { ClassStatus, ClassType } from '@/database/entities/class.entity';
export interface WeekdayScheduleDto {
    startTime: string;
    endTime: string;
}
export declare class CreateClassDto {
    name: string;
    roomName?: string;
    branchId: number;
    teacherId: number;
    type: ClassType;
    status?: ClassStatus;
    startDate: string;
    weekdays: number[];
    scheduleByWeekday: Record<string, WeekdayScheduleDto>;
    studentIds?: number[];
    packageIds?: number[];
}
