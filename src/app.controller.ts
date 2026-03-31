import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { Roles } from './common/decorators/roles.decorator';
import { UserRole } from './database/entities/user.entity';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello() {
    return this.appService.getHello();
  }
  @Get('admin/dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getAdminDashboard(@Query('branchId') branchId?: string) {
    return this.appService.getAdminDashboard({
      branchId,
    });
  }
}
