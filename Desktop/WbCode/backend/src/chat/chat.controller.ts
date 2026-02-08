import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('conversations')
  getConversations(@CurrentUser() user: any) {
    const userObj = {
      id: user.sub || user.id,
      role: user.role || user.role?.name
    };
    return this.chat.getConversations(userObj);
  }

  @Get('conversations/:id')
  getConversation(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    const userObj = {
      id: user.sub || user.id,
      role: user.role || user.role?.name
    };
    return this.chat.getConversation(id, userObj);
  }

  @Post('conversations/:id/messages')
  sendMessage(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) conversationId: number,
    @Body() dto: { content: string }
  ) {
    const userObj = {
      id: user.sub || user.id,
      role: user.role || user.role?.name
    };
    return this.chat.sendMessage(conversationId, userObj, dto.content);
  }

  @Post('conversations/direct/:userId')
  createDirectConversation(@CurrentUser() user: any, @Param('userId', ParseIntPipe) user2Id: number) {
    const userObj = {
      id: user.sub || user.id,
      role: user.role || user.role?.name
    };
    return this.chat.createDirectConversation(userObj, user2Id);
  }

  @Post('conversations/support')
  createSupportConversation(@CurrentUser() user: any) {
    const userObj = {
      id: user.sub || user.id,
      role: user.role || user.role?.name
    };
    return this.chat.createSupportConversation(userObj);
  }
}
















