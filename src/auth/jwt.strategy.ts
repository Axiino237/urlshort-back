import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('SUPABASE_JWT_SECRET') || 'supabase-default-jwt-secret-key-32-chars',
    });
  }

  async validate(payload: any) {
    // payload.sub corresponds to auth.users.id in Supabase Auth
    const userId = payload.sub;
    const email = payload.email;

    // Check profile in our database, sync if it's their first request
    let profile = await this.prisma.profile.findUnique({
      where: { id: userId },
    });

    if (!profile) {
      // Auto-sync profile with Supabase auth fields
      profile = await this.prisma.profile.create({
        data: {
          id: userId,
          email: email || `user-${userId.substring(0, 5)}@axiino.com`,
          name: email ? email.split('@')[0].toUpperCase() : 'PUBLISHER',
          role: 'USER',
          status: 'ACTIVE',
        },
      });
    }

    if (profile.status === 'BANNED') {
      throw new UnauthorizedException('This account is permanently banned due to suspicious bot traffic detection.');
    }

    return profile;
  }
}
