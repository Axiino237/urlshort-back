import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { WithdrawalStatus } from '@prisma/client';

@Injectable()
export class WithdrawalsService {
  constructor(private readonly prisma: PrismaService) {}

  async createRequest(
    userId: string,
    amount: number,
    paymentMethod: string,
    paymentDetails: string,
  ) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive.');
    }

    // Wrap in database transaction
    return this.prisma.$transaction(async (tx) => {
      const profile = await tx.profile.findUnique({
        where: { id: userId },
      });

      if (!profile || profile.balance < amount) {
        throw new BadRequestException('Insufficient wallet balance!');
      }

      // Calculate platform fee ONLY for Admin users (10% fee)
      const commissionFee = profile.role === 'ADMIN' ? Number((amount * 0.1).toFixed(2)) : 0;
      const netAmount = Number((amount - commissionFee).toFixed(2));

      // 1. Deduct Profile balance
      await tx.profile.update({
        where: { id: userId },
        data: {
          balance: { decrement: amount },
        },
      });

      // 2. Log withdrawal request
      const withdrawal = await tx.withdrawal.create({
        data: {
          userId,
          amount,
          commissionFee,
          netAmount,
          paymentMethod,
          paymentDetails,
          status: 'PENDING',
        },
      });

      // 3. Log transaction audit ledger
      await tx.transaction.create({
        data: {
          userId,
          amount: -amount,
          type: 'WITHDRAWAL',
          description: `Requested gross payout of ₹${amount.toLocaleString()} via ${paymentMethod}`,
        },
      });

      if (commissionFee > 0) {
        await tx.transaction.create({
          data: {
            userId,
            amount: -commissionFee,
            type: 'COMMISSION_DEDUCTION',
            description: `Deducted 10% platform commission fee on transaction id: ${withdrawal.id}`,
          },
        });
      }

      return withdrawal;
    });
  }

  async approve(id: string) {
    const match = await this.prisma.withdrawal.findUnique({
      where: { id },
    });

    if (!match || match.status !== 'PENDING') {
      throw new NotFoundException('Pending withdrawal statement not found.');
    }

    return this.prisma.withdrawal.update({
      where: { id },
      data: { status: 'APPROVED' },
    });
  }

  async reject(id: string) {
    const match = await this.prisma.withdrawal.findUnique({
      where: { id },
    });

    if (!match || match.status !== 'PENDING') {
      throw new NotFoundException('Pending withdrawal statement not found.');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Refund the full gross amount to publisher profile wallet
      await tx.profile.update({
        where: { id: match.userId },
        data: {
          balance: { increment: match.amount },
        },
      });

      // 2. Reject statement status
      const updated = await tx.withdrawal.update({
        where: { id },
        data: { status: 'REJECTED' },
      });

      // 3. Audit audit trial refund
      await tx.transaction.create({
        data: {
          userId: match.userId,
          amount: match.amount,
          type: 'REFUND',
          description: `Refunded ₹${match.amount.toLocaleString()} due to withdrawal cancellation: ${id}`,
        },
      });

      return updated;
    });
  }

  async findAll() {
    return this.prisma.withdrawal.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });
  }

  async findAllByUser(userId: string) {
    return this.prisma.withdrawal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
