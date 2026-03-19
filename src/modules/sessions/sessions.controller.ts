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
import { BulkAttendanceDto } from './dto/bulk-attendance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/database/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.TEACHER)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() createSessionDto: CreateSessionDto) {
    return this.sessionsService.create(createSessionDto);
  }

  @Get()
  findAll(@Query() query: QuerySessionDto) {
    return this.sessionsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sessionsService.findOne(id);
  }

  @Roles(UserRole.ADMIN)
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSessionDto: UpdateSessionDto,
  ) {
    return this.sessionsService.update(id, updateSessionDto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.sessionsService.remove(id);
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
