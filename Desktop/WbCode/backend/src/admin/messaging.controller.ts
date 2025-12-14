import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/messages')
export class MessagingController {
  constructor(private readonly messaging: MessagingService) {}

  @Roles(Role.ADMIN, Role.PROFESSOR)
  @Post()
  sendMessage(
    @CurrentUser() user: any,
    @Body() dto: { receiverId: number; subject: string; content: string }
  ) {
    // Transform JWT payload to expected format
    const sender = {
      id: user.sub || user.id,
      role: user.role || user.role?.name
    };
    return this.messaging.sendMessage(sender, dto.receiverId, dto.subject, dto.content);
  }

  @Roles(Role.ADMIN, Role.PROFESSOR)
  @Get()
  getMessages(@CurrentUser() user: any) {
    // Transform JWT payload to expected format
    const userObj = {
      id: user.sub || user.id,
      role: user.role || user.role?.name
    };
    return this.messaging.getMessages(userObj);
  }

  @Roles(Role.ADMIN, Role.PROFESSOR)
  @Post(':id/read')
  markAsRead(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    // Transform JWT payload to expected format
    const userObj = {
      id: user.sub || user.id
    };
    return this.messaging.markAsRead(userObj, id);
  }

  @Roles(Role.ADMIN, Role.PROFESSOR)
  @Get('unread/count')
  getUnreadCount(@CurrentUser() user: any) {
    // Transform JWT payload to expected format
    const userObj = {
      id: user.sub || user.id,
      role: user.role || user.role?.name
    };
    return this.messaging.getUnreadCount(userObj);
  }
}


