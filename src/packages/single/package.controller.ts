import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Package } from '../../model/package.entity';
import { Download } from 'src/model/download.entity';
import { Version } from 'src/model/version.entity';
import { VersionDto } from '../../dto/packages/version.dto';
import { DownloadsCountDto } from '../../dto/packages/download/downloads-count.dto';

@Controller('api/v1/packages/:name')
export class PackageController {

    constructor(private readonly em: EntityManager) {}

    @Get('versions/latest')
    async getLatestPackageVersion(@Param('name') name: string): Promise<VersionDto> {
        const packageObj = await this.em.findOne(Package, {
            name: name.trim(),
        }, {
            populate: ['versions']
        });

        if (!packageObj) {
            throw new NotFoundException(`Package ${ name } not found`);
        }

        const versions = Version.sortVersionsLatestFirst(packageObj.versions.getItems())
            .filter(version => !version.isYanked);
        return VersionDto.fromVersion(versions[0]);
    }

    @Get('versions/all')
    async getAllPackageVersions(@Param('name') name: string): Promise<VersionDto[]> {
        const versions = await this.em.find(Version, {
            package: { name: name.trim() },
        }, {
            populate: ['package']
        });
        if (versions.length === 0) {
            throw new NotFoundException(`Package ${ name } not found`);
        }
        const versionsSorted = Version.sortVersionsLatestFirst(versions)
            .filter(version => !version.isYanked);
        return versionsSorted.map(_ => VersionDto.fromVersion(_));
    }

    @Get('downloads/count')
    async getPackageAllDownloadsHistory(@Param('name') name: string): Promise<DownloadsCountDto> {
        const downloads = await this.em.find(Download, {
            package: { name: name.trim() },
        }, {
            orderBy: { downloadDate: 'DESC' }
        });

        return new DownloadsCountDto(downloads.length);
    }
}
