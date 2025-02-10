export class VersionDto {
    version: string;
    createdAt: string;
    sizeKb: number;

    constructor(version: string, createdAt: string, sizeKb: number) {
        this.version = version;
        this.createdAt = createdAt;
        this.sizeKb = sizeKb;
    }
}