import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from './prisma.service';
import { JwtStrategy } from './auth/jwt.strategy';
import { UrlsController } from './urls/urls.controller';
import { UrlsService } from './urls/urls.service';
import { WithdrawalsService } from './withdrawals/withdrawals.service';

@Module({
  imports: [
    // Global configurations
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [
    UrlsController,
  ],
  providers: [
    PrismaService,
    JwtStrategy,
    UrlsService,
    WithdrawalsService,
  ],
})
export class AppModule {}
