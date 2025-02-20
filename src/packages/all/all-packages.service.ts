import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/core';
import { Package } from '../../model/package.entity';
import { Version } from '../../model/version.entity';
import { VersionDto } from '../../dto/packages/version.dto';
import { PackageVersionDto } from '../../dto/packages/package-version.dto';
import { PackageDto } from '../../dto/packages/package.dto';
import { Download } from '../../model/download.entity';
import { DownloadsCountDto } from '../../dto/packages/download/downloads-count.dto';

@Injectable()
export class AllPackagesService {

    constructor(@InjectRepository(Package) private packageRepository: EntityRepository<Package>,
                @InjectRepository(Download) private downloadRepository: EntityRepository<Download>) {
    }

    public async getAllUserPackages(userId: string): Promise<PackageDto[]> {
        const packages = await this.packageRepository.find({ ownerUserId: userId }, {
            populate: ['versions'],
        });
        return packages.map(pkg => this.mapToPackageDto(pkg));
    }

    public async getAllPackages(limitNumber: number): Promise<PackageDto[]> {
        const packages = await this.packageRepository.find({}, {
            populate: ['versions'],
            limit: limitNumber
        });
        return packages.map(pkg => this.mapToPackageDto(pkg));
    }

    public async getAllPackagesDownloadsCount(sortBy: 'asc' | 'desc'): Promise<DownloadsCountDto> {
        const [total] = await this.downloadRepository.findAndCount({}, {
            orderBy: { downloadDate: sortBy }
        });
        return new DownloadsCountDto(Number(total));
    }

    private mapToPackageDto(pkg: Package): PackageDto {
        const versions = Version.sortVersionsLatestFirst(pkg.versions.getItems());
        const versionDtos = versions.map(_ => VersionDto.fromVersion(_));
        const packageVersionDto = new PackageVersionDto(
            versionDtos[0],
            versions[0].readme,
            versions[0].description,
            versions[0].tags
        );
        return new PackageDto(pkg.name, versionDtos, packageVersionDto);
    }
}