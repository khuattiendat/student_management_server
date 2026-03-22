import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from '@/database/entities/student.entity';
import { Parent } from '@/database/entities/parent.entity';
import { Branch } from '@/database/entities/branch.entity';
import { Package } from '@/database/entities/package.entity';
import { Enrollment } from '@/database/entities/enrollment.entity';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { AuthModule } from '../auth/auth.module';
import { Attendance } from '@/database/entities/attendance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
      Parent,
      Branch,
      Package,
      Enrollment,
      Attendance,
    ]),
    AuthModule,
  ],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
