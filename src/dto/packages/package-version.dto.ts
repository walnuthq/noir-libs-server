import { Version } from '../../model/version.entity';
import { VersionDto } from './version.dto';

export class PackageVersionDto {
    version: VersionDto;
    readme?: string;
    description?: string;
    tags?: string;

    constructor(version: VersionDto, readme?: string, description?: string, tags?: string) {
        this.version = version;
        this.readme = readme;
        this.description = description;
        this.tags = tags;
    }

    public static fromVersion(version: Version): PackageVersionDto {
        return new this(
            VersionDto.fromVersion(version),
            version.readme,
            version.description,
            version.tags
        );
    }
}