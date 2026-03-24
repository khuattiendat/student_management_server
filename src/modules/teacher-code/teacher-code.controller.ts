import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/database/entities/user.entity';
import { TeacherCodeService } from './teacher-code.service';
import { CreateTeacherCodeDto } from './dto/create-teacher-code.dto';
import { QueryTeacherCodeDto } from './dto/query-teacher-code.dto';
import { UpdateTeacherCodeDto } from './dto/update-teacher-code.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.TEACHER)
@Controller('teacher-code')
export class TeacherCodeController {
  constructor(private readonly teacherCodeService: TeacherCodeService) {}

  @Post()
  create(@Body() createTeacherCodeDto: CreateTeacherCodeDto) {
    return this.teacherCodeService.create(createTeacherCodeDto);
  }

  @Get()
  findAll(@Query() query: QueryTeacherCodeDto) {
    return this.teacherCodeService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.teacherCodeService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.teacherCodeService.remove(id);
  }
}
