import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

class UpdateRoleDto {
  @IsEnum(Role)
  role!: Role;
}

class GrantAllBadgesDto {
  @IsOptional()
  @IsInt()
  userId?: number; // optional: if omitted, grants to current admin user (showcase)
}

class DevToolsDto {
  @IsOptional()
  @IsInt()
  userId?: number; // default current admin

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(999999999)
  wbcCoins?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(999999999)
  xp?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  level?: number;

  // Mark N coding exercises solved by creating 100% submissions (idempotent)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5000)
  solvedProblems?: number;
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

  @Roles(Role.ADMIN)
  @Post('badges/grant-all')
  grantAllBadges(@CurrentUser() user: any, @Body() dto: GrantAllBadgesDto) {
    const adminUser = {
      id: user.sub || user.id,
      role: user.role || user.role?.name
    };
    const targetUserId = dto.userId ?? adminUser.id;
    return this.admin.grantAllBadges(adminUser, targetUserId);
  }

  @Roles(Role.ADMIN)
  @Post('dev-tools/boost')
  devTools(@CurrentUser() user: any, @Body() dto: DevToolsDto) {
    const adminUser = {
      id: user.sub || user.id,
      role: user.role || user.role?.name
    };
    const targetUserId = dto.userId ?? adminUser.id;
    return this.admin.applyDevTools(adminUser, targetUserId, dto);
  }
}




