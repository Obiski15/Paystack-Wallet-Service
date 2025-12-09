import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet, WalletTransaction } from '../../entities/wallet.entity';
import { ApiKeyModule } from '../api-key/api-key.module';
import { PaystackService } from '../paystack/paystack.service';
import { UserModule } from '../user/user.module';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, WalletTransaction]),
    UserModule,
    ApiKeyModule,
  ],
  controllers: [WalletController],
  providers: [WalletService, PaystackService],
})
export class WalletModule {}
