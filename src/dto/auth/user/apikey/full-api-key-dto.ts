import { ApiKeyScope } from '../../../../model/auth/apikey-scope.enum';
import { ApiKeyDto } from './api-key-dto';

export class FullApiKeyDto extends ApiKeyDto {
    key: string;

    constructor(id: string, key: string, scopes: ApiKeyScope[], createdAt: string, label?: string, expiresAt?: string) {
        super(id, scopes, createdAt, label, expiresAt);
        this.key = key;
    }
}