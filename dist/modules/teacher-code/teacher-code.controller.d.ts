import { TeacherCodeService } from './teacher-code.service';
import { CreateTeacherCodeDto } from './dto/create-teacher-code.dto';
import { QueryTeacherCodeDto } from './dto/query-teacher-code.dto';
export declare class TeacherCodeController {
    private readonly teacherCodeService;
    constructor(teacherCodeService: TeacherCodeService);
    create(createTeacherCodeDto: CreateTeacherCodeDto): Promise<import("../../database/entities/teacherCode.entity").TeacherCode>;
    findAll(query: QueryTeacherCodeDto): Promise<{
        items: import("../../database/entities/teacherCode.entity").TeacherCode[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: number): Promise<import("../../database/entities/teacherCode.entity").TeacherCode>;
    remove(id: number): Promise<{
        message: string;
        id: number;
    }>;
}
