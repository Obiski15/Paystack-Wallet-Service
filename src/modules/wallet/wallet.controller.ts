import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';

import { Public } from '../../decorators/public.decorator';
import { RequireApiKey } from '../../decorators/requireApiKey.decorator';
import { RequirePermissions } from '../../decorators/requirePermissions.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { DepositDTO, TransferDTO } from './dto/wallet-dto';
import { WalletService } from './wallet.service';

@ApiTags('Wallet')
@ApiBearerAuth('JWT-auth')
@ApiSecurity('api-key')
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @UseGuards(AuthGuard)
  @RequireApiKey()
  @RequirePermissions('deposit')
  @Post('deposit')
  @ApiOperation({ summary: 'Deposit money into wallet' })
  @ApiResponse({ status: 201, description: 'Deposit initiated' })
  @ApiBadRequestResponse({ description: 'Invalid deposit request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  deposit(@Req() req: ExpressRequest, @Body() body: DepositDTO) {
    const userId = req.user!.id;
    return this.walletService.deposit(userId, body.amount);
  }

  @UseGuards(AuthGuard)
  @Get('deposit/:reference/status')
  @ApiOperation({ summary: 'Get deposit status by reference' })
  @ApiResponse({ status: 200, description: 'Deposit status returned' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  getDepositStatus(@Param('reference') reference: string) {
    return this.walletService.getDepositStatus(reference);
  }

  @UseGuards(AuthGuard)
  @RequireApiKey()
  @RequirePermissions('transfer')
  @Post('transfer')
  @ApiOperation({ summary: 'Transfer funds to another wallet' })
  @ApiResponse({ status: 201, description: 'Transfer successful' })
  @ApiBadRequestResponse({ description: 'Invalid transfer request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  transfer(@Req() req: ExpressRequest, @Body() body: TransferDTO) {
    const userId = req.user!.id;

    return this.walletService.transfer(userId, body.wallet_number, body.amount);
  }

  @UseGuards(AuthGuard)
  @RequireApiKey()
  @RequirePermissions('read')
  @Get('balance')
  @ApiOperation({ summary: 'Get wallet balance' })
  @ApiResponse({ status: 200, description: 'Wallet balance returned' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  getBalance(@Req() req: ExpressRequest) {
    const userId = req.user!.id;
    return this.walletService.getBalance(userId);
  }

  @UseGuards(AuthGuard)
  @RequireApiKey()
  @RequirePermissions('read')
  @Get('transactions')
  @ApiOperation({ summary: 'Get wallet transaction history' })
  @ApiResponse({ status: 200, description: 'Transaction history returned' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  getTransactions(@Req() req: ExpressRequest) {
    const userId = req.user!.id;

    return this.walletService.getTransactions(userId);
  }

  @Public()
  @Get('paystack/callback')
  @ApiOperation({ summary: 'Handle Paystack redirect after payment' })
  @ApiQuery({
    name: 'reference',
    required: true,
    description: 'Transaction reference from Paystack',
  })
  @ApiResponse({ status: 200, description: 'Payment verified successfully' })
  @ApiResponse({
    status: 400,
    description: 'Payment failed or invalid reference',
  })
  async handleCallback(
    @Query('reference') reference: string,
    @Res() res: ExpressResponse,
  ) {
    // Verify the transaction status
    const result = await this.walletService.verifyTransaction(reference);

    // Return JSON response to the user
    if (result.status === 'success') {
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Payment successful! Wallet funded.',
        data: result,
      });
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Payment verification failed.',
        data: result,
      });
    }
  }

  @Public()
  @Post('paystack/webhook')
  @ApiOperation({ summary: 'Paystack webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook received' })
  async webhook(@Body() body, @Req() req: ExpressRequest) {
    await this.walletService.webhookHandler(
      body,
      req.headers['x-paystack-signature'] as string,
    );
    return { status: true, body };
  }
}
