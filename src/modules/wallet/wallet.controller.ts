import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { WalletService } from './wallet.service';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('deposit')
  deposit(@Body() body: { amount: number }) {
    const reference: string = 'unique-paystack-ref-' + Date.now();

    return this.walletService.deposit(body.amount, reference);
  }

  @Get('deposit/:reference/status')
  getDepositStatus(@Param('reference') reference: string) {
    return this.walletService.getDepositStatus(reference);
  }

  @Post('transfer')
  transfer(@Body() body: { wallet_number: string; amount: number }) {
    return this.walletService.transfer(body.wallet_number, body.amount);
  }

  @Get('balance')
  getBalance() {
    const userId = '111';
    return this.walletService.getBalance(userId);
  }

  @Get('transactions')
  getTransactions() {
    const userId = '111';
    return this.walletService.getTransactions(userId);
  }

  @Post('paystack/webhook')
  webhook(@Body() body) {
    // Dummy webhook endpoint for Paystack or other integrations
    // Verify signature.
    // Find transaction by reference.
    // Update:
    // transaction status
    // wallet balance
    return { status: true, body };
  }
}

// Error Handling & Idempotency
// Paystack reference must be unique.
// Webhooks must be idempotent (no double-credit).
// Transfers must be atomic (no partial deductions).
// Return clear errors for:
// insufficient balance
// invalid API key
// expired API key
// missing permissions
