import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Class } from '@/database/entities/class.entity';
import { Branch } from '@/database/entities/branch.entity';
import { User } from '@/database/entities/user.entity';
import { Package } from '@/database/entities/package.entity';
import { Student } from '@/database/entities/student.entity';
import { Session } from '@/database/entities/session.entity';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Class, Branch, User, Package, Student, Session]),
    AuthModule,
    UsersModule,
  ],
  controllers: [ClassesController],
  providers: [ClassesService],
  exports: [ClassesService],
})
export class ClassesModule {}
