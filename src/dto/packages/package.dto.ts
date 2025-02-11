import { VersionDto } from './version.dto';
import { PackageVersionDto } from './package-version.dto';

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