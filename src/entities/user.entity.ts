import { Column, Entity, OneToMany } from 'typeorm';
import { ApiKey } from './api-key.entity';
import { BaseEntity } from './base-entity';
import { Wallet } from './wallet.entity';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SERVICE = 'service',
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ nullable: true })
  googleId: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ nullable: false })
  name: string;

  @OneToMany(() => Wallet, (wallet) => wallet.user)
  wallet: Wallet;

  @OneToMany(() => ApiKey, (apiKey) => apiKey.user)
  apiKeys: ApiKey[];
}
