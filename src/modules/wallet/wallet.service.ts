import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import { DataSource, Repository } from 'typeorm';
import {
  TransactionStatus,
  TransactionType,
  Wallet,
  WalletTransaction,
} from '../../entities/wallet.entity';
import { PaystackService } from '../paystack/paystack.service';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(WalletTransaction)
    private readonly transactionRepo: Repository<WalletTransaction>,
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    private readonly paystackService: PaystackService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}
  async deposit(userId: string, amount: number) {
    const wallet = await this.walletRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!wallet) throw new NotFoundException('Wallet not found for user');

    const reference = `TRX-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const paystackResponse = await this.paystackService.initializeTransaction({
      email: wallet.user.email,
      amount: amount * 100, // Convert Naira to Kobo
      reference,
      callback_url: `${this.configService.get<string>('APP_URL')}/wallet/paystack/callback`,
    });

    // 3. Save PENDING transaction to DB
    await this.transactionRepo.save({
      wallet,
      amount: (amount * 100).toString(),
      reference,
      type: TransactionType.DEPOSIT,
      status: TransactionStatus.PENDING,
    });

    return { authorization_url: paystackResponse.authorization_url, reference };
  }

  async getDepositStatus(reference: string) {
    const transaction = await this.transactionRepo.findOne({
      where: { reference },
    });

    if (!transaction)
      throw new NotFoundException('Transaction record not found');

    return { reference, status: transaction.status };
  }

  async getBalance(userId: string) {
    const wallet = await this.walletRepo.findOne({
      where: { user: { id: userId } },
    });

    if (!wallet) throw new NotFoundException('Wallet not found');

    return { balance: wallet.balance };
  }

  async getTransactions(userId: string) {
    const wallet = await this.walletRepo.findOne({
      where: { user: { id: userId } },
    });

    if (!wallet) throw new NotFoundException('Wallet not found');

    const transactions = await this.transactionRepo.find({
      where: { wallet: { id: wallet.id } },
      select: ['amount', 'type', 'status'],
    });

    return transactions;
  }

  async transfer(userId: string, recipient_wallet_num: number, amount: number) {
    const amount_in_kobo = BigInt(amount * 100);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const sender_wallet = await queryRunner.manager.findOne(Wallet, {
        where: { user: { id: userId } },
        lock: { mode: 'pessimistic_write' },
      });

      if (!sender_wallet) throw new NotFoundException('User wallet not found');

      if (BigInt(sender_wallet.balance) < amount_in_kobo) {
        throw new BadRequestException('Insufficient funds');
      }

      const recipient_wallet = await queryRunner.manager.findOne(Wallet, {
        where: { wallet_number: recipient_wallet_num.toString() },
        lock: { mode: 'pessimistic_write' }, // Lock them too
      });

      if (!recipient_wallet) throw new NotFoundException('Recipient not found');

      // Deduct from Sender
      sender_wallet.balance = (
        BigInt(sender_wallet.balance) - amount_in_kobo
      ).toString();
      await queryRunner.manager.save(sender_wallet);

      recipient_wallet.balance = (
        BigInt(recipient_wallet.balance) + amount_in_kobo
      ).toString();
      await queryRunner.manager.save(recipient_wallet);

      const transaction = this.transactionRepo.create({
        reference: `TRF-${Date.now()}`,
        type: TransactionType.TRANSFER,
        status: TransactionStatus.SUCCESS,
        amount: amount_in_kobo.toString(),
        wallet: sender_wallet,
        recipient_wallet_number: recipient_wallet.wallet_number.toString(),
        sender_wallet_number: sender_wallet.wallet_number.toString(),
      });
      await queryRunner.manager.save(transaction);

      // Commit changes
      await queryRunner.commitTransaction();
    } catch (err) {
      // If anything fails, rollback
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    return {
      success: 'success',
      message: 'Transfer complete',
    };
  }

  async webhookHandler(body: any, signature: string) {
    const hash = crypto
      .createHmac(
        'sha512',
        this.configService.get<string>('PAYSTACK_SECRET_KEY') as string,
      )
      .update(JSON.stringify(body))
      .digest('hex');
    if (hash !== signature) {
      throw new ForbiddenException('Invalid signature');
    }

    // Retrieve the request's body
    const event = body;
    if (event.event === 'charge.success') {
      await this.creditWalletViaWebhook(event.data);
    }
  }

  private async creditWalletViaWebhook(data: any) {
    const { reference, amount } = data;

    const transaction = await this.transactionRepo.findOne({
      where: { reference },
      relations: ['wallet'],
    });

    if (!transaction) {
      console.log('Unknown transaction for reference', reference);
      return;
    }

    if (!transaction.wallet) {
      console.log(
        'Transaction exists but has no wallet linked (Bad Data)',
        reference,
      );
      return;
    }

    // IDEMPOTENCY CHECK
    if (transaction.status === TransactionStatus.SUCCESS) {
      console.log('Duplicate webhook received for', reference);
      return;
    }

    // Verify amount matches
    if (transaction.amount !== amount.toString()) {
      // Flag for manual review - amount paid != amount expected
      return;
    }

    // Atomic Update using EntityManager
    await this.dataSource.transaction(async (manager) => {
      //  Re-fetch the wallet with a LOCK
      const lockedWallet = await manager.findOne(Wallet, {
        where: { id: transaction.wallet.id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!lockedWallet) return;

      // Mark transaction as success
      transaction.status = TransactionStatus.SUCCESS;
      await manager.save(transaction);

      // Credit the LOCKED wallet
      lockedWallet.balance = (
        BigInt(lockedWallet.balance) + BigInt(amount)
      ).toString();
      await manager.save(lockedWallet);
    });
  }
}
