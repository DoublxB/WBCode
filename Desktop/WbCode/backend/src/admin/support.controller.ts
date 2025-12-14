import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('support')
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Post('tickets')
  createTicket(
    @CurrentUser() user: any,
    @Body() dto: { subject: string; description: string; category: string; priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' }
  ) {
    const userObj = {
      id: user.sub || user.id,
      role: user.role || user.role?.name
    };
    return this.support.createTicket(userObj, dto.subject, dto.description, dto.category, dto.priority || 'MEDIUM');
  }

  @Get('tickets')
  listTickets(@CurrentUser() user: any) {
    const userObj = {
      id: user.sub || user.id,
      role: user.role || user.role?.name
    };
    return this.support.listTickets(userObj);
  }

  @Roles(Role.ADMIN)
  @Post('tickets/:id/assign')
  assignTicket(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    const userObj = {
      id: user.sub || user.id,
      role: user.role || user.role?.name
    };
    return this.support.assignTicket(userObj, id);
  }

  @Post('tickets/:id/replies')
  addReply(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { content: string; isInternal?: boolean }
  ) {
    const userObj = {
      id: user.sub || user.id,
      role: user.role || user.role?.name
    };
    return this.support.addReply(userObj, id, dto.content, dto.isInternal || false);
  }

  @Roles(Role.ADMIN)
  @Post('tickets/:id/resolve')
  resolveTicket(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { resolution: string }
  ) {
    const userObj = {
      id: user.sub || user.id,
      role: user.role || user.role?.name
    };
    return this.support.resolveTicket(userObj, id, dto.resolution);
  }

  @Roles(Role.ADMIN)
  @Post('tickets/:id/status')
  updateTicketStatus(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' }
  ) {
    const userObj = {
      id: user.sub || user.id,
      role: user.role || user.role?.name
    };
    return this.support.updateTicketStatus(userObj, id, dto.status);
  }
}


