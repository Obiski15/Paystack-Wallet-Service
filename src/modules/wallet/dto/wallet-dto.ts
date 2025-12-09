import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class DepositDTO {
  @ApiProperty({
    description: 'Amount to deposit',
    example: 100.5,
  })
  @IsNotEmpty()
  @IsNumber()
  amount: number;
}

export class TransferDTO {
  @ApiProperty({
    description: 'Wallet number of the recipient',
    example: 1234567890,
  })
  @IsNotEmpty()
  @IsNumber()
  wallet_number: number;
  @ApiProperty({
    description: 'Amount to transfer',
    example: 50.0,
  })
  @IsNotEmpty()
  @IsNumber()
  amount: number;
}
