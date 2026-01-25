import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/errors/validation-error";

/**
 * Validate user exists, is active, and has a wallet
 */
export async function validateAndFetchUser(userReferenceId: string) {
  const user = await prisma.user.findUnique({
    where: { referenceId: userReferenceId },
    include: { wallet: true },
  });

  if (!user) {
    throw new ValidationError("User not found", 404);
  }

  if (!user.isActive) {
    throw new ValidationError("User account is not active", 400);
  }

  if (!user.wallet) {
    throw new ValidationError("User wallet not found", 404);
  }

  return user;
}

/**
 * Validate user has sufficient balance for a transaction
 */
export function validateSufficientBalance(
  balance: Decimal,
  lockedAmount: Decimal,
  requiredAmount: Decimal
) {
  const availableBalance = balance.sub(lockedAmount);

  if (availableBalance.lt(requiredAmount)) {
    throw new ValidationError("Insufficient balance", 400, {
      required: requiredAmount.toNumber(),
      available: availableBalance.toNumber(),
      balance: balance.toString(),
      locked: lockedAmount.toString(),
    });
  }

  return availableBalance;
}
