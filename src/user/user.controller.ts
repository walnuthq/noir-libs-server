import { Body, Controller, Delete, Get, Logger, Param, Post } from '@nestjs/common';
import { GenerateApiKeyDto } from '../dto/auth/user/apikey/generate-api-key.dto';
import { AuthenticatedUser } from '../common/user-session.decorator';
import { UserSession } from '../common/user-session';
import { v4 as uuidv4 } from 'uuid';
import { ApiKey } from '../model/auth/apikey.entity';
import { addDaysToNowGetDate } from '../common/date.service';
import { FullApiKeyDto } from '../dto/auth/user/apikey/full-api-key-dto';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/core';
import { ApiKeyDto } from '../dto/auth/user/apikey/api-key-dto';

@Controller("api/v1/auth/user")
export class UserController {
    private readonly logger = new Logger(UserController.name, { timestamp: true });

    constructor(@InjectRepository(ApiKey) private apiKeyRepository: EntityRepository<ApiKey>) {
    }

    @Get("profile")
    async getUserProfile(@AuthenticatedUser() authenticatedUser: UserSession): Promise<{ name: string, avatarUrl: string }> {
        return {
            name: authenticatedUser.name,
            avatarUrl: authenticatedUser.avatarUrl,
        }
    }

    @Post("apikey")
    async generateApiKey(
            @Body() generateApiKeyDto: GenerateApiKeyDto,
            @AuthenticatedUser() authenticatedUser: UserSession): Promise<FullApiKeyDto> {
        const apiKey = new ApiKey(
            uuidv4(),
            uuidv4(),
            authenticatedUser.userId,
            new Date(),
            generateApiKeyDto.scopes,
            generateApiKeyDto.label,
            generateApiKeyDto.expiresDays ? addDaysToNowGetDate(generateApiKeyDto.expiresDays) : undefined
        );

        await this.apiKeyRepository.insert(apiKey);

        this.logger.log(`New API key label ${ apiKey.label ?? '<no label>' }, ID ${ apiKey.id } generated for user ${ authenticatedUser.userId }`);
        return new FullApiKeyDto(
            apiKey.id,
            apiKey.key,
            apiKey.scopes,
            apiKey.createdAt.toISOString(),
            apiKey.label,
            apiKey.expiresAt?.toISOString()
        );
    }

    @Delete("apikey/:id")
    async deleteApiKey(@Param('id') id: string, @AuthenticatedUser() authenticatedUser: UserSession): Promise<void> {
        await this.apiKeyRepository.nativeDelete({ id });
        this.logger.log(`API key with ID ${ id } deleted for user ${ authenticatedUser.userId }`);
    }

    @Get("apikey")
    async getApiKeys(@AuthenticatedUser() authenticatedUser: UserSession): Promise<ApiKeyDto[]> {
        const apiKeys = await this.apiKeyRepository.find({ userId: authenticatedUser.userId });
        return apiKeys.map(apiKey => new ApiKeyDto(
            apiKey.id,
            apiKey.scopes,
            apiKey.createdAt.toISOString(),
            apiKey.label,
            apiKey.expiresAt?.toISOString()
        ));
    }
}