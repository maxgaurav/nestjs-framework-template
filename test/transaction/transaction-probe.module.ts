import {
  BadRequestException,
  Body,
  Controller,
  Injectable,
  Module,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { IsBoolean, IsEmail, IsOptional } from 'class-validator';
import { Transaction } from 'sequelize';
import { AppModule } from '../../src/app.module.js';
import { TransactionInterceptor } from '../../src/transaction-manager/interceptors/transaction/transaction.interceptor.js';
import { ReqTransaction } from '../../src/transaction-manager/decorators/transaction.decorator.js';
import { EventRegisterCallbackService } from '../../src/common/services/event-register-callback/event-register-callback.service.js';
import { UserRepository } from '../../src/repositories/user/user.repository.js';

/**
 * Test-only state: records which after-commit callbacks fired.
 */
@Injectable()
export class TransactionProbeState {
  public committedEmails: string[] = [];
}

class CreateProbeUserDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsBoolean()
  fail?: boolean;
}

/**
 * Test-only controller that exercises the production transaction flow:
 * `TransactionInterceptor` + `@ReqTransaction()` + after-commit callbacks.
 */
@Controller('transaction-probe')
export class TransactionProbeController {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly eventCallbacks: EventRegisterCallbackService,
    private readonly state: TransactionProbeState,
  ) {}

  @Post('users')
  @UseInterceptors(TransactionInterceptor)
  public async store(
    @Body() dto: CreateProbeUserDto,
    @ReqTransaction() transaction?: Transaction,
  ): Promise<{ email: string }> {
    // No explicit transaction: the insert must join the request transaction through CLS
    await this.userRepository.userModel
      .build()
      .setAttributes({ email: dto.email })
      .save();

    this.eventCallbacks.registerEventCallBacks(() => {
      this.state.committedEmails.push(dto.email);
      return Promise.resolve();
    }, transaction);

    if (dto.fail) {
      throw new BadRequestException('Intentional failure after insert');
    }

    return { email: dto.email };
  }
}

@Module({
  imports: [AppModule],
  controllers: [TransactionProbeController],
  providers: [TransactionProbeState],
})
export class TransactionProbeModule {}
