import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/database/entities/user.entity';
import { BaseQueryDto } from '@/common/base/base.QueryDto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@/common/interfaces/authenticated-user.interface';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.TEACHER)
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() createBranchDto: CreateBranchDto) {
    return this.branchesService.create(createBranchDto);
  }

  @Get()
  findAll(@Query() query: BaseQueryDto) {
    return this.branchesService.findAll(query);
  }
  @Roles(UserRole.ADMIN)
  @Get('trash')
  findAllTrash(@Query() query: BaseQueryDto) {
    return this.branchesService.findAllTrash(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.branchesService.findOne(id);
  }

  @Roles(UserRole.ADMIN)
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBranchDto: UpdateBranchDto,
  ) {
    return this.branchesService.update(id, updateBranchDto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.branchesService.remove(id);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id/force')
  forceRemove(@Param('id', ParseIntPipe) id: number) {
    return this.branchesService.forceRemove(id);
  }

  @Roles(UserRole.ADMIN)
  @Put(':id/restore')
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.branchesService.restore(id);
  }

  @Get('classes/with-classes')
  findAllWithClasses(@CurrentUser() user: AuthenticatedUser) {
    return this.branchesService.findAllWithClasses(user);
  }
}
