import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('profile')
  getProfile(@CurrentUser('sub') userId: number) {
    if (!userId || isNaN(userId)) {
      throw new Error(`Invalid userId: ${userId}`);
    }
    return this.users.getProfile(userId);
  }

  @Patch('profile')
  updateProfile(@CurrentUser('sub') userId: number, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(userId, dto);
  }

  @Get('dashboard-stats')
  getDashboardStats(@CurrentUser('sub') userId: number) {
    if (!userId || isNaN(userId)) {
      throw new Error(`Invalid userId: ${userId}`);
    }
    return this.users.getDashboardStats(userId);
  }

  @Get('notifications')
  getNotifications(@CurrentUser('sub') userId: number) {
    if (!userId || isNaN(userId)) {
      throw new Error(`Invalid userId: ${userId}`);
    }
    return this.users.getNotifications(userId);
  }
}




