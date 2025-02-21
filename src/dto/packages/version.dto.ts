import { Version } from '../../model/version.entity';

export class VersionDto {
    version: string;
    createdAt: string;
    sizeKb: number;
    isYanked: boolean;

    constructor(version: string, createdAt: string, sizeKb: number, isYanked: boolean) {
        this.version = version;
        this.createdAt = createdAt;
        this.sizeKb = sizeKb;
        this.isYanked = isYanked;
    }

    public static fromVersion(version: Version): VersionDto {
        return new this(
            version.version,
            version.createdAt.toISOString(),
            version.sizeKb,
            version.isYanked
        );
    }
}