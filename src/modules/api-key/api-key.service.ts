import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Repository } from 'typeorm';
import { ApiKey } from '../../entities/api-key.entity';
import { CreateApiKeyDto } from './dto';
import { RolloverKeyDTO } from './dto/rollover-api-key.dto';

@Injectable()
export class ApiKeyService {
  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepository: Repository<ApiKey>,
    private readonly config: ConfigService,
  ) {}

  async create(userId: string, createApiKeyDto: CreateApiKeyDto) {
    // check if the user has up to 5 keys
    const userKeys = await this.findAllByUser(userId);

    if (userKeys.length >= 5) {
      throw new BadRequestException(
        'API key limit reached. You can only create up to 5 API keys.',
      );
    }

    // Generate a random API key
    const rawKey = this.generateRawKey();

    // Hash the API key before storing
    const hashedKey = await bcrypt.hash(rawKey, 10);

    // TODO: check if hash already exists

    const expiry = this.parsedExpiryDate(createApiKeyDto.expiry);

    // Create the API key entity
    const apiKey = this.apiKeyRepository.create({
      key: hashedKey,
      name: createApiKeyDto.name,
      serviceName: createApiKeyDto.serviceName,
      permissions: createApiKeyDto.permissions || [],
      expiry,
      createdBy: userId,
    });

    await this.apiKeyRepository.save(apiKey);

    return {
      id: apiKey.id,
      key: rawKey,
      name: apiKey.name,
      serviceName: apiKey.serviceName,
      permissions: apiKey.permissions,
      expiry: apiKey.expiry,
      createdAt: apiKey.createdAt,
    };
  }

  async validateApiKey(rawKey: string) {
    // Find all active API keys
    const apiKeys = await this.apiKeyRepository.find({
      where: { isActive: true },
      relations: ['user'],
    });

    // Check each key to see if it matches
    for (const apiKey of apiKeys) {
      const isValid = await bcrypt.compare(rawKey, apiKey.key);

      if (isValid) {
        // Check if key has expired
        if (this.hasKeyExpired(apiKey.expiry)) {
          return null;
        }

        // Update last used timestamp
        await this.apiKeyRepository.update(apiKey.id, {
          lastUsedAt: new Date(),
        });

        return {
          id: apiKey.id,
          user: apiKey.user,
          permissions: apiKey.permissions,
          serviceName: apiKey.serviceName,
        };
      }
    }

    return null;
  }

  async findAllByUser(userId: string) {
    const apiKeys = await this.apiKeyRepository.find({
      where: { createdBy: userId },
      select: [
        'id',
        'name',
        'serviceName',
        'permissions',
        'isActive',
        'expiry',
        'lastUsedAt',
        'createdAt',
      ],
    });

    return apiKeys.map((key) => ({
      ...key,
      keyPreview: '••••••••', // Never return the actual key
    }));
  }

  async revoke(id: string, userId: string) {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { id, createdBy: userId },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    await this.apiKeyRepository.update(id, { isActive: false });

    return { message: 'API key revoked successfully' };
  }

  async delete(id: string, userId: string) {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { id, createdBy: userId },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    await this.apiKeyRepository.delete(id);

    return { message: 'API key deleted successfully' };
  }

  async rotate(body: RolloverKeyDTO, userId: string) {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { id: body.expired_key_id, createdBy: userId },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    if (apiKey.isActive) {
      throw new BadRequestException('Cannot rotate an inactive API key');
    }

    if (!this.hasKeyExpired(apiKey.expiry) && apiKey.isActive) {
      throw new BadRequestException(
        'Cannot rotate an API key this has not expired yet',
      );
    }

    // Generate new raw key
    const rawKey = this.generateRawKey();
    const hashedKey = await bcrypt.hash(rawKey, 10);

    // Update the key
    await this.apiKeyRepository.update(body.expired_key_id, {
      key: hashedKey,
      expiry: this.parsedExpiryDate(body.expiry),
      isActive: true,
    });

    return {
      id: apiKey.id,
      key: rawKey,
      name: apiKey.name,
      serviceName: apiKey.serviceName,
      permissions: apiKey.permissions,
    };
  }

  private hasKeyExpired(expiry: Date): boolean {
    return expiry < new Date();
  }

  private parsedExpiryDate(expiry: string) {
    const date = new Date();

    function parseValue(value: string) {
      return parseInt(value.replace(/[HDMY]/, ''), 10);
    }

    if (expiry.includes('D')) {
      const days = parseValue(expiry);
      date.setDate(date.getDate() + days);
    }

    if (expiry.includes('H')) {
      const hours = parseValue(expiry);
      date.setHours(date.getHours() + hours);
    }

    if (expiry.includes('M')) {
      const minutes = parseValue(expiry);
      date.setMinutes(date.getMinutes() + minutes);
    }

    if (expiry.includes('Y')) {
      const years = parseValue(expiry);
      date.setFullYear(date.getFullYear() + years);
    }

    return date.toISOString();
  }

  private generateRawKey(): string {
    // Generate a random key
    const prefix = this.config.get<string>('API_KEY_PREFIX') || 'sk_';
    const randomBytes = crypto.randomBytes(32).toString('hex');
    return `${prefix}${randomBytes}`;
  }
}
