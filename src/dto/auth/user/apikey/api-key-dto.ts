import { ApiKeyScope } from '../../../../model/auth/apikey-scope.enum';

export class ApiKeyDto {
    id: string;
    scopes: string[];
    createdAt: string;
    label?: string;
    expiresAt?: string;

    constructor(id: string, scopes: ApiKeyScope[], createdAt: string, label?: string, expiresAt?: string) {
        this.id = id;
        this.label = label;
        this.scopes = scopes;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
    }
}