import { Injectable } from '@nestjs/common';
// import Paystack integration here as needed

@Injectable()
export class WalletService {
  deposit(amount: number, reference: string) {
    // TODO: Integrate Paystack verification and update wallet balance
    // FIXME: remove amount from response
    return {
      amount,
      reference,
      authorization_url: 'https://paystack.co/checkout/...',
    };
  }

  getDepositStatus(reference: string) {
    // TODO: Check deposit status by reference
    return { reference, status: 'pending', amount: 0 };
  }

  getBalance(userId: string) {
    // TODO: Fetch wallet balance for user
    // FIXME: return balance only
    return { balance: 0, userId };
  }

  getTransactions(userId: string) {
    // TODO: Fetch transaction history for user
    // FIXME: remove userId from response
    return [
      {
        userId,
        type: 'transfer',
        amount: 3000,
        status: 'success',
      },
      {
        userId,
        type: 'deposit',
        amount: 3000,
        status: 'success',
      },
    ];
  }

  transfer(wallet_number: string, amount: number) {
    // TODO: Transfer funds between users
    // FIXME: remove wallet_number and amount from response
    return {
      success: 'success',
      message: 'Transfer complete',
      wallet_number,
      amount,
    };
  }
}
