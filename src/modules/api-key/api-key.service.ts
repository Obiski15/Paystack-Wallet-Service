import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Repository } from 'typeorm';
import { ApiKey } from '../../entities/api-key.entity';
import { CreateApiKeyDto } from './dto';

@Injectable()
export class ApiKeyService {
  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepository: Repository<ApiKey>,
    private readonly config: ConfigService,
  ) {}

  async create(userId: string, createApiKeyDto: CreateApiKeyDto) {
    // Generate a random API key
    const rawKey = this.generateRawKey();

    // Hash the API key before storing
    const hashedKey = await bcrypt.hash(rawKey, 10);

    // Create the API key entity
    const apiKey = this.apiKeyRepository.create({
      key: hashedKey,
      name: createApiKeyDto.name,
      serviceName: createApiKeyDto.serviceName,
      permissions: createApiKeyDto.permissions || [],
      expiresAt: createApiKeyDto.expiresAt
        ? new Date(createApiKeyDto.expiresAt)
        : null,
      createdBy: userId,
    });

    await this.apiKeyRepository.save(apiKey);

    // Return the raw key only once (user must save it)
    return {
      id: apiKey.id,
      key: rawKey, // Only time the raw key is returned
      name: apiKey.name,
      serviceName: apiKey.serviceName,
      permissions: apiKey.permissions,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    };
  }

  async validateApiKey(rawKey: string) {
    // Find all active API keys
    const apiKeys = await this.apiKeyRepository.find({
      where: { isActive: true },
    });

    // Check each key to see if it matches
    for (const apiKey of apiKeys) {
      const isValid = await bcrypt.compare(rawKey, apiKey.key);

      if (isValid) {
        // Check if key has expired
        if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
          return null;
        }

        // Update last used timestamp
        await this.apiKeyRepository.update(apiKey.id, {
          lastUsedAt: new Date(),
        });

        return {
          id: apiKey.id,
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
        'expiresAt',
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

  async rotate(id: string, userId: string) {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { id, createdBy: userId },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    // Generate new raw key
    const rawKey = this.generateRawKey();
    const hashedKey = await bcrypt.hash(rawKey, 10);

    // Update the key
    await this.apiKeyRepository.update(id, { key: hashedKey });

    return {
      id: apiKey.id,
      key: rawKey, // Return the new raw key
      name: apiKey.name,
      serviceName: apiKey.serviceName,
      permissions: apiKey.permissions,
    };
  }

  private generateRawKey(): string {
    // Generate a random key
    const prefix = this.config.get<string>('API_KEY_PREFIX') || 'sk_';
    const randomBytes = crypto.randomBytes(32).toString('hex');
    return `${prefix}${randomBytes}`;
  }
}
