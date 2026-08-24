import 'server-only';
import type { EmergencyFund, EmergencyFundMovement } from '@prisma-app/client';
import { db } from '@/server/db';
import { BadRequestError } from '@/server/errors';
import { toDateOnly, toNumber } from '@/server/serialization';
import type { EmergencyFundDto, EmergencyFundMovementType } from '@/lib/types';

type FundWithMovements = EmergencyFund & { movements: EmergencyFundMovement[] };

function toResponse(fund: FundWithMovements): EmergencyFundDto {
  return {
    id: fund.id,
    balance: toNumber(fund.balance),
    targetAmount: toNumber(fund.targetAmount),
    movements: fund.movements.map((m) => ({
      id: m.id,
      type: m.type,
      amount: toNumber(m.amount),
      date: toDateOnly(m.date),
      description: m.description,
    })),
  };
}

/** Fundo do usuário — criado vazio sob demanda, então nunca dá "não encontrado". */
export async function getEmergencyFund(
  userId: number,
): Promise<EmergencyFundDto> {
  return toResponse(await ensureFund(userId));
}

export async function updateEmergencyFund(
  userId: number,
  input: { targetAmount: number; balance?: number },
): Promise<EmergencyFundDto> {
  await ensureFund(userId);
  const fund = await db.emergencyFund.update({
    where: { userId },
    data: { targetAmount: input.targetAmount, balance: input.balance },
    include: { movements: { orderBy: { date: 'desc' } } },
  });
  return toResponse(fund);
}

/** Registra movimentação e ajusta o saldo na mesma transação. */
export async function addEmergencyFundMovement(
  userId: number,
  input: {
    type: EmergencyFundMovementType;
    amount: number;
    date: string;
    description?: string | null;
  },
): Promise<EmergencyFundDto> {
  const fund = await ensureFund(userId);
  const delta = input.type === 'DEPOSIT' ? input.amount : -input.amount;
  const newBalance = toNumber(fund.balance) + delta;
  if (newBalance < 0) {
    throw new BadRequestError('Saldo insuficiente para o resgate');
  }

  const updated = await db.$transaction(async (tx) => {
    await tx.emergencyFundMovement.create({
      data: {
        fundId: fund.id,
        type: input.type,
        amount: input.amount,
        date: new Date(input.date),
        description: input.description,
      },
    });
    return tx.emergencyFund.update({
      where: { id: fund.id },
      data: { balance: newBalance },
      include: { movements: { orderBy: { date: 'desc' } } },
    });
  });

  return toResponse(updated);
}

async function ensureFund(userId: number): Promise<FundWithMovements> {
  const existing = await db.emergencyFund.findUnique({
    where: { userId },
    include: { movements: { orderBy: { date: 'desc' } } },
  });
  if (existing) return existing;

  return db.emergencyFund.create({
    data: { userId, balance: 0, targetAmount: 0 },
    include: { movements: { orderBy: { date: 'desc' } } },
  });
}
