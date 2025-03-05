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

    public async validatePublishApiKeyAndGetOwnerUserId(key: string, apiKey?: ApiKey | undefined): Promise<string> {
        return await this.validateApiKeyAndGetOwnerUserId(key, [ApiKeyScope.PUBLISH], apiKey);
    }

    private async validateApiKeyAndGetOwnerUserId(key: string, requiredScopes: ApiKeyScope[], apiKey?: ApiKey | undefined): Promise<string> {
        if (!apiKey) {
            apiKey = await this.apiKeyRepository.findOne({ key });
        }

        if (!apiKey) {
            this.logger.warn(`API KEY used to publish package does not exist: ${key}!`);
            throw new UnauthorizedException("Given API KEY is incorrect.");
        }

        if (!requiredScopes.every(scope => apiKey?.scopes.includes(scope))) {
            this.logger.warn(`API KEY is correct but it does not have all required scopes ${requiredScopes}!`);
            throw new UnauthorizedException(`This API KEY has not all required scopes!`);
        }

        if (apiKey.expiresAt && isExpired(apiKey.expiresAt)) {
            this.logger.warn(`API KEY is correct but it expired at ${apiKey.expiresAt.toISOString()}!`);
            throw new UnauthorizedException(`API KEY is invalid!`);
        }
        return apiKey.userId;
    }

    public async validatePublishApiKeyOfExistingPackage(key: string, packageOwnerUserId: string, packageName: string): Promise<void> {
        await this.validateApiKeyOfExistingPackage(key, packageOwnerUserId, packageName, [ApiKeyScope.PUBLISH]);
    }

    public async validateYankApiKeyOfExistingPackage(key: string, packageOwnerUserId: string, packageName: string): Promise<void> {
        await this.validateApiKeyOfExistingPackage(key, packageOwnerUserId, packageName, [ApiKeyScope.YANK]);
    }

    private async validateApiKeyOfExistingPackage(key: string, packageOwnerUserId: string, packageName: string, requiredScopes: ApiKeyScope[]): Promise<void> {
        const apiKey: ApiKey | undefined = await this.apiKeyRepository.findOne({ key });
        await this.validateApiKeyAndGetOwnerUserId(key, requiredScopes,  apiKey);
        if (apiKey?.userId !== packageOwnerUserId) {
            throw new UnauthorizedException(`You are not the owner of package ${packageName}`);
        }
    }

}