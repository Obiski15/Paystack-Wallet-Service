import { Column, Entity, OneToMany } from 'typeorm';
import { ApiKey } from './api-key.entity';
import { BaseEntity } from './base-entity';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SERVICE = 'service',
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ nullable: true })
  name: string;

  @OneToMany(() => ApiKey, (apiKey) => apiKey.user)
  apiKeys: ApiKey[];
}
