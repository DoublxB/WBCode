import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CosmeticsService } from './cosmetics.service';
import { CosmeticType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

class EquipCosmeticDto {
  @IsEnum(CosmeticType)
  type!: CosmeticType;

  @IsOptional()
  @ValidateIf((o) => o.code !== null && o.code !== undefined)
  @IsString()
  @MaxLength(64)
  code?: string | null;
}

@UseGuards(JwtAuthGuard)
@Controller('cosmetics')
export class CosmeticsController {
  constructor(private readonly cosmetics: CosmeticsService) {}

  @Get()
  list() {
    return this.cosmetics.listCosmetics();
  }

  @Get('me')
  me(@CurrentUser('sub') userId: number) {
    return this.cosmetics.myCosmetics(userId);
  }

  @Post('purchase/:code')
  purchase(@CurrentUser('sub') userId: number, @Param('code') code: string) {
    return this.cosmetics.purchase(userId, code);
  }

  @Post('equip')
  equip(@CurrentUser('sub') userId: number, @Body() dto: EquipCosmeticDto) {
    return this.cosmetics.equip(userId, dto.type, dto.code ?? null);
  }
}


