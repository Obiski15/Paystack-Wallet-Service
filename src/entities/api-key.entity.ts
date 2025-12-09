import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base-entity';
import { User } from './user.entity';

@Entity('api_keys')
export class ApiKey extends BaseEntity {
  @Column({ unique: true })
  key: string;
  @Column()
  name: string;

  @Column({ name: 'service_name', nullable: true })
  serviceName: string;

  @Column({ type: 'json', default: [] })
  permissions: string[];

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'expires_at', nullable: false, type: 'timestamp' })
  expiry: Date;

  @Column({ name: 'last_used_at', nullable: true, type: 'timestamp' })
  lastUsedAt: Date | null;

  @ManyToOne(() => User, (user) => user.apiKeys, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'created_by' })
  user: User;

  @Column({ name: 'created_by' })
  createdBy: string;
}
