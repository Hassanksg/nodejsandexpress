import mongoose, { ClientSession } from 'mongoose';
import { logger } from '../utils/logger';
import { UserModel } from '../models/user';
import { FicoreCreditTransactionModel } from '../models/audit';
import { InsufficientCreditsError, DatabaseError } from '../types/errors';

export async function deductFicoreCredits(
  userId: string,
  amount: number,
  action: string,
  itemId: string | null = null,
  session?: ClientSession
): Promise<boolean> {
  if (!userId || amount <= 0 || ![1, 2].includes(amount)) {
    logger.error(`Invalid params for credit deduction: userId=${userId}, amount=${amount}, action=${action}`);
    return false;
  }

  const dbSession = session || (await mongoose.startSession());
  const ownsSession = !session;

  try {
    await dbSession.startTransaction();
    const user = await UserModel.findById(userId).session(dbSession);
    if (!user) {
      logger.error(`User ${userId} not found for credit deduction, action: ${action}`);
      throw new DatabaseError('User not found');
    }

    const currentBalance = user.ficore_credit_balance || 0;
    if (currentBalance < amount) {
      logger.warning(`Insufficient credits for user ${userId}: required ${amount}, available ${currentBalance}, action: ${action}`);
      throw new InsufficientCreditsError('Insufficient credits');
    }

    const result = await UserModel.updateOne(
      { _id: userId },
      { $inc: { ficore_credit_balance: -amount } },
      { session: dbSession }
    );

    if (result.modifiedCount === 0) {
      logger.error(`Failed to deduct ${amount} credits for user ${userId}, action: ${action}`);
      await FicoreCreditTransactionModel.create(
        [{
          user_id: userId,
          action,
          amount: -amount,
          item_id: itemId,
          timestamp: new Date(),
          status: 'failed',
        }],
        { session: dbSession }
      );
      throw new DatabaseError('No documents modified');
    }

    await FicoreCreditTransactionModel.create(
      [{
        user_id: userId,
        action,
        amount: -amount,
        item_id: itemId,
        timestamp: new Date(),
        status: 'completed',
      }],
      { session: dbSession }
    );

    await dbSession.commitTransaction();
    logger.info(`Deducted ${amount} credits for ${action} by user ${userId}. New balance: ${currentBalance - amount}`);
    return true;
  } catch (error) {
    await dbSession.abortTransaction();
    logger.error(`Error deducting ${amount} credits for ${action} by user ${userId}`, { error });
    throw error;
  } finally {
    if (ownsSession) {
      dbSession.endSession();
    }
  }
}