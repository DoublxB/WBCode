import { Body, Controller, Get, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IsEnum } from 'class-validator';

class UpdateRoleDto {
  @IsEnum(Role)
  role!: Role;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Roles(Role.ADMIN)
  @Get('users')
  listUsers(@CurrentUser() user: any) {
    const adminUser = {
      id: user.sub || user.id,
      role: user.role || user.role?.name
    };
    return this.admin.listUsers(adminUser);
  }

  @Roles(Role.ADMIN)
  @Patch('users/:id/role')
  updateRole(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto
  ) {
    const adminUser = {
      id: user.sub || user.id,
      role: user.role || user.role?.name
    };
    return this.admin.updateUserRole(adminUser, id, dto.role);
  }

  @Roles(Role.ADMIN)
  @Get('dashboard')
  getDashboard(@CurrentUser() user: any) {
    const adminUser = {
      id: user.sub || user.id,
      role: user.role || user.role?.name
    };
    return this.admin.getDashboardStats(adminUser);
  }
}




