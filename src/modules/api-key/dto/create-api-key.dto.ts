import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

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
    example: ['read', 'transfer', 'deposit'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @ApiProperty({
    example: '30D',
    description: 'Format: <number><H|D|M|Y> (e.g., 12H, 5D, 3M)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+[HDMY]$/, {
    message:
      'interval must start with a number and end with H, D, M, or Y (e.g., 12H, 30D)',
  })
  @Transform(({ value }) => value?.toUpperCase())
  expiry: string;
}
