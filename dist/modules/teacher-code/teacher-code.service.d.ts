import { TeacherCode } from '@/database/entities/teacherCode.entity';
import { Repository } from 'typeorm';
import { CreateTeacherCodeDto } from './dto/create-teacher-code.dto';
import { UpdateTeacherCodeDto } from './dto/update-teacher-code.dto';
import { QueryTeacherCodeDto } from './dto/query-teacher-code.dto';
import { User } from '@/database/entities/user.entity';
export declare class TeacherCodeService {
    private readonly teacherCodeRepository;
    private readonly userRepository;
    constructor(teacherCodeRepository: Repository<TeacherCode>, userRepository: Repository<User>);
    create(createTeacherCodeDto: CreateTeacherCodeDto): Promise<TeacherCode>;
    findAll(query: QueryTeacherCodeDto): Promise<{
        items: TeacherCode[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: number): Promise<TeacherCode>;
    update(id: number, updateTeacherCodeDto: UpdateTeacherCodeDto): Promise<TeacherCode>;
    remove(id: number): Promise<{
        message: string;
        id: number;
    }>;
    private buildDefaultExpiredAt;
    private ensureTeacherExists;
    private ensureCodeUnique;
}
