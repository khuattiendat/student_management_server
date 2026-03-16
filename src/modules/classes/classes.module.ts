import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Class } from '@/database/entities/class.entity';
import { Branch } from '@/database/entities/branch.entity';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Class, Branch]), AuthModule],
  controllers: [ClassesController],
  providers: [ClassesService],
  exports: [ClassesService],
})
export class ClassesModule {}
