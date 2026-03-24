import { TeacherCode } from '@/database/entities/teacherCode.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeacherCodeController } from './teacher-code.controller';
import { TeacherCodeService } from './teacher-code.service';
import { AuthModule } from '../auth/auth.module';
import { User } from '@/database/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TeacherCode, User]), AuthModule],
  controllers: [TeacherCodeController],
  providers: [TeacherCodeService],
  exports: [TeacherCodeService],
})
export class TeacherCodeModule {}
