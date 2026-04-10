import { Attendance } from './attendance.entity';
import { Class } from './class.entity';
import { BaseEntity } from '@/common/base/base.entity';
export declare class Session extends BaseEntity {
    classId: number;
    sessionDate: Date;
    startTime: string;
    endTime: string;
    classEntity: Class;
    attendances: Attendance[];
}
