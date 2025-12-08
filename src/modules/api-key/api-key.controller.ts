import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request as ExpressRequest } from 'express';
import { AuthGuard } from '../auth/guards/auth.guard';
import { ApiKeyService } from './api-key.service';
import { CreateApiKeyDto } from './dto';

@ApiTags('API Keys')
@ApiBearerAuth('JWT-auth')
@Controller('keys')
@UseGuards(AuthGuard)
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new API key' })
  @ApiResponse({
    status: 201,
    description: 'API key successfully created',
    schema: {
      example: {
        id: 'uuid',
        key: 'sk_live_abc123...',
        name: 'Production Service',
        serviceName: 'payment-service',
        permissions: ['read:users', 'write:orders'],
        expiresAt: '2025-12-31T23:59:59.000Z',
        createdAt: '2025-12-06T10:00:00.000Z',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async create(
    @Request() req: ExpressRequest,
    @Body() createApiKeyDto: CreateApiKeyDto,
  ) {
    return this.apiKeyService.create(req.user!.id, createApiKeyDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all API keys for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'List of API keys',
    schema: {
      example: [
        {
          id: 'uuid',
          name: 'Production Service',
          serviceName: 'payment-service',
          permissions: ['read:users', 'write:orders'],
          isActive: true,
          expiresAt: '2025-12-31T23:59:59.000Z',
          lastUsedAt: '2025-12-06T10:00:00.000Z',
          createdAt: '2025-12-06T09:00:00.000Z',
          keyPreview: '••••••••',
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findAll(@Request() req: ExpressRequest) {
    return this.apiKeyService.findAllByUser(req.user!.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an API key' })
  @ApiParam({ name: 'id', description: 'API key ID' })
  @ApiResponse({ status: 200, description: 'API key deleted successfully' })
  @ApiNotFoundResponse({ description: 'API key not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async delete(@Param('id') id: string, @Request() req: ExpressRequest) {
    return this.apiKeyService.delete(id, req.user!.id);
  }

  @Patch(':id/revoke')
  @ApiOperation({ summary: 'Revoke an API key (make it inactive)' })
  @ApiParam({ name: 'id', description: 'API key ID' })
  @ApiResponse({ status: 200, description: 'API key revoked successfully' })
  @ApiNotFoundResponse({ description: 'API key not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async revoke(@Param('id') id: string, @Request() req: ExpressRequest) {
    return this.apiKeyService.revoke(id, req.user!.id);
  }

  @Patch(':id/rotate')
  @ApiOperation({ summary: 'Rotate an API key (generate new key)' })
  @ApiParam({ name: 'id', description: 'API key ID' })
  @ApiResponse({
    status: 200,
    description: 'API key rotated successfully',
    schema: {
      example: {
        id: 'uuid',
        key: 'sk_live_new123...',
        name: 'Production Service',
        serviceName: 'payment-service',
        permissions: ['read:users', 'write:orders'],
      },
    },
  })
  @ApiNotFoundResponse({ description: 'API key not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async rotate(@Param('id') id: string, @Request() req: ExpressRequest) {
    return this.apiKeyService.rotate(id, req.user!.id);
  }
}

// Rules:
// expiry accepts only: 1H, 1D, 1M, 1Y  - Hour, Day, Month, Year
// The backend must convert expiry into a real datetime and store it as expires_at.
// Maximum 5 active keys per user.
// Permissions must be explicitly assigned.

// POST /keys/rollover // Purpose: Create a new API key using the same permissions as an expired key.
// {
//   "expired_key_id": "FGH2485K6KK79GKG9GKGK",
//   "expiry": "1M"
// }
