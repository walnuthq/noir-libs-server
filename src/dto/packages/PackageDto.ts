import { VersionDto } from './VersionDto';
import { PackageVersionDto } from './PackageVersionDto';

export class PackageDto {
    name: string;
    versions: VersionDto[];
    latestPackageVersion: PackageVersionDto;

    constructor(name: string, versions: VersionDto[], latestPackageVersion: PackageVersionDto) {
        this.name = name;
        this.versions = versions;
        this.latestPackageVersion = latestPackageVersion;
    }
}