import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base-entity';
import { User } from './user.entity';

@Entity('wallets')
export class Wallet extends BaseEntity {
  @ManyToOne(() => User, (user) => user.id)
  user: User;

  @Column({ unique: true })
  wallet_number: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  balance: number;

  @OneToMany(() => WalletTransaction, (tx) => tx.wallet)
  transactions: WalletTransaction[];
}

@Entity('wallet_transactions')
export class WalletTransaction extends BaseEntity {
  @ManyToOne(() => Wallet, (wallet) => wallet.transactions)
  wallet: Wallet;

  @Column()
  type: 'deposit' | 'withdrawal' | 'transfer';

  @Column()
  status: 'success' | 'failed' | 'pending';

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  balance: number;

  @Column({ nullable: true })
  reference: string;

  @Column({ nullable: true })
  receiver_wallet_number: string;
}
