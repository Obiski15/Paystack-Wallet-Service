import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class PaystackService {
  private instance: axios.AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    this.instance = axios.create({
      baseURL: 'https://api.paystack.co',
      headers: {
        Authorization: `Bearer ${this.configService.get<string>(
          'PAYSTACK_SECRET_KEY',
        )}`,
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });
  }

  async initializeTransaction(
    data: Record<string, unknown>,
  ): Promise<{ authorization_url: string; reference: string }> {
    const res = await this.instance.post('/transaction/initialize', data);
    return res.data.data;
  }

  async verifyTransaction(reference: string) {
    const res = await this.instance.get(`/transaction/verify/${reference}`);
    return res.data;
  }
}
