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
import { FileInterceptor } from '@nestjs/platform-express';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { QuerySessionDto } from './dto/query-session.dto';
import { QueryCalendarSessionDto } from './dto/query-calendar-session.dto';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/database/entities/user.entity';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@/common/interfaces/authenticated-user.interface';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.TEACHER)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  create(
    @Body() createSessionDto: CreateSessionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.sessionsService.create(createSessionDto, user);
  }

  @Get()
  findAll(@Query() query: QuerySessionDto) {
    return this.sessionsService.findAll(query);
  }

  @Get('calendar')
  findCalendar(
    @Query() query: QueryCalendarSessionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.sessionsService.findCalendar(query, user);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sessionsService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSessionDto: UpdateSessionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.sessionsService.update(id, updateSessionDto, user);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Query('code') code: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.sessionsService.remove(id, code, user);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Post(':id/attendance')
  takeAttendance(
    @Param('id', ParseIntPipe) id: number,
    @Body() bulkAttendanceDto: BulkAttendanceDto,
  ) {
    return this.sessionsService.takeAttendance(id, bulkAttendanceDto);
  }

  @Get(':id/attendance')
  getAttendance(@Param('id', ParseIntPipe) id: number) {
    return this.sessionsService.getAttendance(id);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Put(':id/attendance')
  updateAttendance(
    @Param('id', ParseIntPipe) id: number,
    @Body() bulkAttendanceDto: BulkAttendanceDto,
  ) {
    return this.sessionsService.updateAttendanceList(id, bulkAttendanceDto);
  }
}
