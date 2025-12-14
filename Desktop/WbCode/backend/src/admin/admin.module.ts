import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { MessagingService } from './messaging.service';
import { MessagingController } from './messaging.controller';
import { ApprovalService } from './approval.service';
import { ApprovalController } from './approval.controller';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';
import { AssignmentApprovalService } from './assignment-approval.service';
import { AssignmentApprovalController } from './assignment-approval.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    AdminController,
    MessagingController,
    ApprovalController,
    SupportController,
    AssignmentApprovalController
  ],
  providers: [
    AdminService,
    MessagingService,
    ApprovalService,
    SupportService,
    AssignmentApprovalService
  ],
  exports: [
    AdminService,
    MessagingService,
    ApprovalService,
    SupportService,
    AssignmentApprovalService
  ]
})
export class AdminModule {}



