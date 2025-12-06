import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty({
    description: 'Descriptive name for the API key',
    example: 'Production Service',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Service name that will use this API key',
    example: 'payment-service',
  })
  @IsOptional()
  @IsString()
  serviceName?: string;

  @ApiPropertyOptional({
    description: 'Array of permissions granted to this API key',
    example: ['read:users', 'write:orders', 'read:products'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @ApiPropertyOptional({
    description: 'Expiration date for the API key (ISO 8601 format)',
    example: '2025-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
