import { Cron, CronExpression } from '@nestjs/schedule';
import { Injectable, Logger } from '@nestjs/common';
import { MissionsService } from './missions.service';

@Injectable()
export class MissionsScheduler {
  private readonly logger = new Logger(MissionsScheduler.name);

  constructor(private readonly missions: MissionsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleMissionRollup() {
    await this.missions.closeExpiredMissions();
    this.logger.log('Weekly missions status refreshed');
  }
}












