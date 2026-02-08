import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WBCCoinsService } from './wbc-coins.service';
import { CosmeticType } from '@prisma/client';

@Injectable()
export class CosmeticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wbcCoins: WBCCoinsService
  ) {}

  async listCosmetics() {
    return this.prisma.cosmeticItem.findMany({
      orderBy: [{ type: 'asc' }, { priceCoins: 'asc' }, { id: 'asc' }]
    });
  }

  async myCosmetics(userId: number) {
    const [owned, equips, balance] = await Promise.all([
      this.prisma.cosmeticOwnership.findMany({
        where: { userId },
        include: { cosmetic: true }
      }),
      this.prisma.cosmeticEquip.findMany({
        where: { userId },
        include: { cosmetic: true }
      }),
      this.wbcCoins.getBalance(userId)
    ]);

    const equipped: Record<string, string | null> = {};
    for (const e of equips) {
      equipped[e.type] = e.cosmetic?.code ?? null;
    }

    return {
      balance,
      owned: owned.map((o) => o.cosmetic),
      equipped
    };
  }

  async purchase(userId: number, code: string) {
    const cosmetic = await this.prisma.cosmeticItem.findUnique({ where: { code } });
    if (!cosmetic) throw new NotFoundException('Cosmetic not found');

    const existing = await this.prisma.cosmeticOwnership.findUnique({
      where: { userId_cosmeticId: { userId, cosmeticId: cosmetic.id } }
    });
    if (existing) {
      const balance = await this.wbcCoins.getBalance(userId);
      return { cosmetic, balance, alreadyOwned: true };
    }

    // Free cosmetics can be “purchased” without spending
    if (cosmetic.priceCoins > 0) {
      await this.wbcCoins.spendCoins(userId, cosmetic.priceCoins, `Cosmetic purchased: ${cosmetic.name}`);
    }

    await this.prisma.cosmeticOwnership.create({
      data: { userId, cosmeticId: cosmetic.id }
    });

    const balance = await this.wbcCoins.getBalance(userId);
    return { cosmetic, balance, alreadyOwned: false };
  }

  async equip(userId: number, type: CosmeticType, code: string | null) {
    if (!code) {
      await this.prisma.cosmeticEquip.upsert({
        where: { userId_type: { userId, type } },
        update: { cosmeticId: null },
        create: { userId, type, cosmeticId: null }
      });
      return this.myCosmetics(userId);
    }

    const cosmetic = await this.prisma.cosmeticItem.findUnique({ where: { code } });
    if (!cosmetic) throw new NotFoundException('Cosmetic not found');
    if (cosmetic.type !== type) throw new ForbiddenException('Cosmetic type mismatch');

    if (cosmetic.priceCoins > 0) {
      const ownership = await this.prisma.cosmeticOwnership.findUnique({
        where: { userId_cosmeticId: { userId, cosmeticId: cosmetic.id } }
      });
      if (!ownership) throw new ForbiddenException('You do not own this cosmetic');
    }

    await this.prisma.cosmeticEquip.upsert({
      where: { userId_type: { userId, type } },
      update: { cosmeticId: cosmetic.id },
      create: { userId, type, cosmeticId: cosmetic.id }
    });

    // Special case: TITLE updates the user.title for legacy UI
    if (type === 'TITLE') {
      await this.prisma.user.update({
        where: { id: userId },
        data: { title: cosmetic.name }
      });
    }

    return this.myCosmetics(userId);
  }
}





