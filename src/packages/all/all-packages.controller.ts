import { Controller, Get, Logger, Query } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Package } from '../../model/package.entity';
import { Download } from 'src/model/download.entity';
import { PackageVersionDto } from '../../dto/packages/package-version.dto';
import { PackageDto } from '../../dto/packages/package.dto';
import { Version } from '../../model/version.entity';
import { VersionDto } from '../../dto/packages/version.dto';

@Controller('api/v1/packages')
export class AllPackagesController {
    private readonly logger = new Logger(AllPackagesController.name, { timestamp: true });

    constructor(private readonly em: EntityManager) {}

    @Get()
    async getAllPackages(@Query('limit') limit: string = '10'): Promise<PackageDto[]> {
        const limitNumber = Math.min(parseInt(limit) || 10, 100);
        const packages = await this.em.findAll(Package, {
            populate: ['versions'],
            limit: limitNumber
        });

        return packages.map(pkg => {
            const versions = Version.sortVersionsLatestFirst(pkg.versions.getItems());
            const versionDtos = versions.map(_ => VersionDto.fromVersion(_));
            const packageVersionDto = new PackageVersionDto(
                versionDtos[0],
                versions[0].readme,
                versions[0].description,
                versions[0].tags
            );
            return new PackageDto(pkg.name, versionDtos, packageVersionDto);
        });
    }

    @Get('downloads')
    async getAllDownloads(@Query('sortBy') sortBy: 'asc' | 'desc' = 'desc') {
        const [downloads, total] = await this.em.findAndCount(Download, {}, {
            populate: ['package', 'version'],
            orderBy: { downloadDate: sortBy }
        });

        return {
            data: downloads.map(download => ({
                package: download.package.name,
                version: download.version.version,
                downloadDate: download.downloadDate
            })),
            total
        };
    }
}
