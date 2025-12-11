import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Wallet } from 'src/entities/wallet.entity';
import { DataSource, EntityManager } from 'typeorm';
import { User } from '../../entities/user.entity';
import { IUserPayload } from '../../types/express';
import { UserService } from '../user/user.service';
import { LoginDto, RegisterDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  async register(registerDto: RegisterDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if user already exists
      const existingUser = await this.userService.findByEmail(
        registerDto.email,
      );
      if (existingUser) {
        await queryRunner.release();
        throw new ConflictException('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      // create user
      const newUser = queryRunner.manager.create(User, {
        ...registerDto,
        password: hashedPassword,
      });
      const user = await queryRunner.manager.save(newUser);

      // create wallet for user
      const newWallet = queryRunner.manager.create(Wallet, {
        user: user,
        balance: '0',
        wallet_number: await this.generateUniqueWalletNumber(
          queryRunner.manager,
        ),
      });
      await queryRunner.manager.save(newWallet);

      // Commit Transaction
      await queryRunner.commitTransaction();

      // Generate tokens
      const tokens = await this.generateTokens(user.id, user.email, user.role);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        ...tokens,
      };
    } catch {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('User registration failed');
    } finally {
      await queryRunner.release();
    }
  }

  async login(loginDto: LoginDto) {
    // Find user
    const user = await this.userService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      ...tokens,
    };
  }

  async googleLogin(googleUser: any) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Find or create user in DB
    const { email, name, googleId } = googleUser;
    let user = await this.userService.findByEmail(email);

    if (!user) {
      try {
        const newUser = queryRunner.manager.create(User, {
          email,
          name,
          googleId,
        });
        user = await queryRunner.manager.save(newUser);

        const newWallet = queryRunner.manager.create(Wallet, {
          user,
          balance: '0',
          wallet_number: await this.generateUniqueWalletNumber(
            queryRunner.manager,
          ),
        });
        await queryRunner.manager.save(newWallet);

        await queryRunner.commitTransaction();
      } catch (error) {
        console.error(error);
        await queryRunner.rollbackTransaction();
        throw new InternalServerErrorException('User registration failed');
      } finally {
        await queryRunner.release();
      }
    }
    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<IUserPayload>(
        refreshToken,
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        },
      );

      const tokens = await this.generateTokens(
        payload.sub,
        payload.email,
        payload.role,
      );

      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async validateUser(userId: string): Promise<User | null> {
    return await this.userService.findById(userId);
  }

  private async generateUniqueWalletNumber(
    manager: EntityManager,
  ): Promise<string> {
    let isUnique = false;
    let walletNumber: number = 0;

    for (let i = 0; i < 5; i++) {
      walletNumber = Math.floor(1000000000 + Math.random() * 9000000000);

      const existing = await manager.findOne(Wallet, {
        where: { wallet_number: walletNumber.toString() },
      });

      if (!existing) {
        isUnique = true;
        break;
      }
    }

    if (!isUnique)
      throw new InternalServerErrorException(
        'Could not generate unique wallet number',
      );

    return walletNumber.toString();
  }
}
