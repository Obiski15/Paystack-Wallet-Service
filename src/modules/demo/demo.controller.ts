import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RequireApiKey } from '../../decorators/requireApiKey.decorator';
import { RequirePermissions } from '../../decorators/requirePermissions.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';

@ApiTags('Demo')
@Controller('demo')
@UseGuards(AuthGuard)
export class DemoController {
  @Get('protected')
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('api-key')
  @ApiOperation({
    summary: 'Demo endpoint that accepts either JWT or API Key',
    description:
      'This endpoint can be accessed with either a JWT bearer token or an API key in the x-api-key header',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully authenticated',
    schema: {
      example: {
        message: 'This endpoint accepts either JWT token or API key',
        data: 'sensitive information',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  getProtectedData() {
    return {
      message: 'This endpoint accepts either JWT token or API key',
      data: 'sensitive information',
    };
  }

  @RequireApiKey()
  @Get('api-key-only')
  @ApiSecurity('api-key')
  @ApiOperation({
    summary: 'Demo endpoint that REQUIRES API Key',
    description:
      'This endpoint only accepts API key authentication. JWT tokens will be rejected.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully authenticated with API key',
    schema: {
      example: {
        message: 'This endpoint requires API key authentication',
        data: 'service-to-service data',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'API key is required' })
  getApiKeyOnlyData() {
    return {
      message: 'This endpoint requires API key authentication',
      data: 'service-to-service data',
    };
  }

  @RequireApiKey()
  @RequirePermissions('read', 'transfer')
  @Get('with-permissions')
  @ApiSecurity('api-key')
  @ApiOperation({
    summary: 'Demo endpoint with permission requirements',
    description:
      'This endpoint requires an API key with specific permissions: read and transfer',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully authenticated with required permissions',
    schema: {
      example: {
        message: 'This requires API key with read and transfer permissions',
        data: 'highly restricted data',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'API key is required or missing required permissions',
  })
  getDataWithPermissions() {
    return {
      message: 'This requires API key with read and transfer permissions',
      data: 'highly restricted data',
    };
  }
}
