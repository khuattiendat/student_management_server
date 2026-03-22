import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from '@/database/entities/session.entity';
import { Class } from '@/database/entities/class.entity';
import { Attendance } from '@/database/entities/attendance.entity';
import { ClassStudent } from '@/database/entities/class_student.entity';
import { Enrollment } from '@/database/entities/enrollment.entity';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Session,
      Class,
      Attendance,
      ClassStudent,
      Enrollment,
    ]),
    AuthModule,
  ],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
