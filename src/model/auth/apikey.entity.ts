import { Entity, Index, PrimaryKey, Property, Unique } from '@mikro-orm/core';
import { ApiKeyScope } from './apikey-scope.enum';

@Entity()
export class ApiKey {

    @PrimaryKey({ type: 'uuid' })
    id: string;

    @Unique()
    @Property({type: 'text'})
    key: string;

    @Property({type: 'text', nullable: true})
    label?: string;

    @Property()
    @Index()
    userId: string;

    @Property({type: 'Date'})
    createdAt: Date;

    // if null - key is valid forever
    @Property({type: 'Date', nullable: true})
    expiresAt?: Date;

    @Property({ type: 'text[]' })
    scopes: ApiKeyScope[];

    constructor(id: string, key: string, userId: string, createdAt: Date, scopes: ApiKeyScope[], label?: string, expiresAt?: Date) {
        this.id = id;
        this.key = key;
        this.userId = userId;
        this.createdAt = createdAt;
        this.scopes = scopes;
        this.label = label;
        this.expiresAt = expiresAt;
    }
}