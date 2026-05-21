import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class UrlsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, originalUrl: string, customAlias?: string) {
    let shortCode = customAlias ? customAlias.trim().replace(/\s+/g, '-') : '';

    if (shortCode) {
      // Check collision
      const existing = await this.prisma.url.findFirst({
        where: {
          OR: [{ shortCode }, { customAlias: shortCode }],
        },
      });
      if (existing) {
        throw new ConflictException('Alias or short code already exists!');
      }
    } else {
      // Generate unique random code
      let isUnique = false;
      while (!isUnique) {
        shortCode = Math.random().toString(36).substring(2, 8);
        const collision = await this.prisma.url.findUnique({
          where: { shortCode },
        });
        if (!collision) isUnique = true;
      }
    }

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=http://localhost:5173/s/${shortCode}`;

    // Create Title extract
    let title = originalUrl.replace('https://', '').replace('http://', '').split('/')[0] + ' Redirect';

    return this.prisma.url.create({
      data: {
        originalUrl,
        shortCode,
        customAlias: customAlias ? shortCode : null,
        title,
        qrCodeUrl,
        userId,
      },
    });
  }

  async findAllByUser(userId: string) {
    return this.prisma.url.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByCode(shortCode: string) {
    const match = await this.prisma.url.findFirst({
      where: {
        OR: [{ shortCode }, { customAlias: shortCode }],
        isActive: true,
      },
    });
    if (!match) {
      throw new NotFoundException('Redirection link not discovered or deactivated.');
    }
    return match;
  }

  async remove(userId: string, id: string) {
    const match = await this.prisma.url.findUnique({
      where: { id },
    });

    if (!match || match.userId !== userId) {
      throw new NotFoundException('Redirection link not found or unauthorized.');
    }

    return this.prisma.url.delete({
      where: { id },
    });
  }
}
