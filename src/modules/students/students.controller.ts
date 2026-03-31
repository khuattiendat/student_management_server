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
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { QueryStudentDto } from './dto/query-student.dto';
import { RenewStudentCourseDto } from './dto/renew-student-course.dto';
import { QueryStudentAttendanceDto } from './dto/query-student-attendance.dto';
import { QueryStudentsByEnrollmentsDto } from './dto/query-students-by-enrollments.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/database/entities/user.entity';
import { BaseQueryDto } from '@/common/base/base.QueryDto';
import { CycleDto } from './dto/cycle.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.TEACHER)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  @Get()
  findAll(@Query() query: QueryStudentDto) {
    return this.studentsService.findAll(query);
  }

  @Get('by-enrollments')
  findByEnrollments(@Query() query: QueryStudentsByEnrollmentsDto) {
    return this.studentsService.findByEnrollments(query);
  }
  @Get('cycles')
  getCycleStudents(@Query() query: CycleDto) {
    return this.studentsService.getCycleStudents(query);
  }

  @Roles(UserRole.ADMIN)
  @Get('trash')
  findAllTrash(@Query() query: BaseQueryDto) {
    return this.studentsService.findAllTrash(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.findOne(id);
  }

  @Get(':id/attendances')
  findAttendances(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QueryStudentAttendanceDto,
  ) {
    return this.studentsService.findAttendances(id, query);
  }

  @Roles(UserRole.ADMIN)
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    return this.studentsService.update(id, updateStudentDto);
  }
  @Roles(UserRole.ADMIN)
  @Put(':id/cycle-start-date')
  updateCycleStartDate(
    @Param('id', ParseIntPipe) id: number,
    @Body('cycleStartDate') cycleStartDate: Date | null,
  ) {
    return this.studentsService.updateCycleStartDate(id, cycleStartDate);
  }

  @Roles(UserRole.ADMIN)
  @Put(':id/is-called')
  toggleIsCalled(
    @Param('id', ParseIntPipe) id: number,
    @Body('isCalled') isCalled: boolean,
  ) {
    return this.studentsService.updateIsCalled(id, isCalled);
  }

  @Roles(UserRole.ADMIN)
  @Put(':id/is-texted')
  toggleIsTexted(
    @Param('id', ParseIntPipe) id: number,
    @Body('isTexted') isTexted: boolean,
  ) {
    return this.studentsService.updateIsTexted(id, isTexted);
  }

  @Roles(UserRole.ADMIN)
  @Post(':id/renew-course')
  renewCourse(
    @Param('id', ParseIntPipe) id: number,
    @Body() renewStudentCourseDto: RenewStudentCourseDto,
  ) {
    return this.studentsService.renewCourse(id, renewStudentCourseDto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.remove(id);
  }

  @Roles(UserRole.ADMIN)
  @Put(':id/restore')
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.restore(id);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id/force')
  forceRemove(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.forceRemove(id);
  }
}
