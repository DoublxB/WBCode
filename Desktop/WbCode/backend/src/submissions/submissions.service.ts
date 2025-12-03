import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  listUserSubmissions(userId: number) {
    return this.prisma.submission.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }
}



