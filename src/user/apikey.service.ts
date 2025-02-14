import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ApiKey } from '../model/auth/apikey.entity';
import { ApiKeyScope } from '../model/auth/apikey-scope.enum';
import { isExpired } from '../common/date.service';
import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';

@Injectable()
export class ApiKeyService {

    constructor(@InjectRepository(ApiKey) private apiKeyRepository: EntityRepository<ApiKey>) {}

    private readonly logger = new Logger(ApiKeyService.name, { timestamp: true });
    public async validateApiKey(userId: string, key: string): Promise<void> {
        const apiKey: ApiKey | undefined = await this.apiKeyRepository.findOne({ key });
        if (apiKey?.userId !== userId) {
            this.logger.fatal(`User ${userId} provided correct API KEY but it does not belong to him!`);
            throw new UnauthorizedException(`API KEY is invalid!`);
        }
        if (apiKey?.scopes.includes(ApiKeyScope.PUBLISH)) {
            this.logger.warn(`User ${userId} provided correct API KEY but it does not have ${ApiKeyScope.PUBLISH} but only ${apiKey?.scopes}!`);
            throw new UnauthorizedException(`API KEY is invalid!`);
        }
        if (apiKey.expiresAt && isExpired(apiKey.expiresAt)) {
            this.logger.warn(`User ${userId} provided correct API KEY but it expired at ${apiKey.expiresAt.toISOString()}!`);
            throw new UnauthorizedException(`API KEY is invalid!`);
        }
    }
}