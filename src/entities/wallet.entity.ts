import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base-entity';
import { User } from './user.entity';

export enum TransactionType {
  DEPOSIT = 'deposit',
  TRANSFER = 'transfer',
}

export enum TransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Entity('wallets')
export class Wallet extends BaseEntity {
  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @Column({ unique: true })
  wallet_number: string;

  @Column({ type: 'bigint', default: '0' })
  balance: string;

  @OneToMany(() => WalletTransaction, (tx) => tx.wallet)
  transactions: WalletTransaction[];
}

@Entity('wallet_transactions')
export class WalletTransaction extends BaseEntity {
  @Column({ unique: true, nullable: false })
  reference: string;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({ type: 'bigint' })
  amount: string; // In Kobo

  @Column({ nullable: true })
  recipient_wallet_number: string;

  @Column({ nullable: true })
  sender_wallet_number: string;

  @ManyToOne(() => Wallet)
  @JoinColumn()
  wallet: Wallet;
}
