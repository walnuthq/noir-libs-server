import { VersionDto } from './VersionDto';

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
}