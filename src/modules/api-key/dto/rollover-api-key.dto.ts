import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class RolloverKeyDTO {
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

  @ApiProperty({
    description: 'ID of the expired API key to rollover from',
    example: 'uuid-of-expired-api-key',
  })
  @IsString()
  @IsNotEmpty()
  expired_key_id: string;
}
