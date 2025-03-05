import { Version } from '../../model/version.entity';
import { VersionDto } from './version.dto';

export class PackageVersionDto {
    version: VersionDto;
    ownerUserName: string;
    readme?: string;
    description?: string;
    tags?: string;
    repository?: string;

    constructor(version: VersionDto, ownerUserName: string, readme?: string, description?: string, tags?: string, repository?: string) {
        this.version = version;
        this.ownerUserName = ownerUserName;
        this.readme = readme;
        this.description = description;
        this.tags = tags;
        this.repository = repository;
    }

    public static fromVersion(version: Version): PackageVersionDto {
        return new this(
            VersionDto.fromVersion(version),
            version.ownerUserName,
            version.readme,
            version.description,
            version.tags,
            version.repository,
        );
    }
}