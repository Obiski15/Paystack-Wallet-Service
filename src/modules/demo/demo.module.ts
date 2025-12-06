import { Module } from '@nestjs/common';
import { ApiKeyModule } from '../api-key/api-key.module';
import { UserModule } from '../user/user.module';
import { DemoController } from './demo.controller';

@Module({
  imports: [UserModule, ApiKeyModule],
  controllers: [DemoController],
})
export class DemoModule {}
