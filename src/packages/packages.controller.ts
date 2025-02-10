import {
  BadRequestException,
  Controller,
  Get,
  Inject, Logger,
  NotFoundException,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Package } from '../model/package.entity';
import { Response } from 'express';
import * as stream from 'stream';
import { Download } from 'src/model/download.entity';
import { Version } from 'src/model/version.entity';
import * as semver from 'semver';
import { FileInterceptor } from '@nestjs/platform-express';
import { PackageService } from './package.service';
import { VersionDto } from '../dto/packages/VersionDto';
import { PackageVersionDto } from '../dto/packages/PackageVersionDto';
import { PackageDto } from '../dto/packages/PackageDto';
import { DownloadsCountDto } from '../dto/packages/DownloadsCountDto';
import { DownloadsDto } from '../dto/packages/DownloadsDto';

@Controller('api/v1/packages')
export class PackagesController {
  private readonly logger = new Logger(PackagesController.name, { timestamp: true });

  constructor(private readonly em: EntityManager,
              @Inject() private readonly packageService: PackageService) {}

  @Get()
  async getAllPackages(@Query('limit') limit: string = '10'): Promise<PackageDto[]> {
    const limitNumber = Math.min(parseInt(limit) || 10, 100);
    const packages = await this.em.findAll(Package, {
      populate: ['versions'],
      limit: limitNumber
    });

    return packages.map(pkg => {
      const versions = this.sortVersionsLatestFirst(pkg.versions.getItems());
      const versionDtos = this.mapToVersionDtos(versions);
      const packageVersionDto = new PackageVersionDto(
          versionDtos[0],
          versions[0].readme,
          versions[0].description,
          versions[0].tags
      );
      return new PackageDto(pkg.name, versionDtos, packageVersionDto);
    });
  }

  @Get(':name/latest')
  async getLatestPackageVersion(@Param('name') name: string): Promise<PackageVersionDto> {
    const packageObj = await this.em.findOne(Package, {
      name: name.trim(),
    }, {
      populate: ['versions']
    });

    if (!packageObj) {
      throw new NotFoundException(`Package ${name} not found`);
    }

    const versions = this.sortVersionsLatestFirst(packageObj.versions.getItems());
    return this.mapToPackageVersionDto(versions[0]);
  }

  @Get(':name/versions')
  async getAllPackageVersions(@Param('name') name: string): Promise<VersionDto[]> {
    const versions = await this.em.find(Version, {
      package: { name: name.trim() },
    }, {
      populate: ['package']
    });
    if (versions.length === 0) {
      throw new NotFoundException(`Package ${name} not found`);
    }
    const versionsSorted = this.sortVersionsLatestFirst(versions);
    return this.mapToVersionDtos(versionsSorted);
  }

  @Get(':name/:version')
  async getPackage(@Param('name') name: string, @Param('version') version: string): Promise<PackageVersionDto> {
    if (!semver.valid(version)) {
      throw new BadRequestException('Invalid version format');
    }

    const verObj = await this.em.findOne(Version, {
      package: { name: name.trim() },
      version: version
    }, {
      populate: ['package']
    });

    if (!verObj) {
      throw new NotFoundException(`Version ${version} not found for package "${name}"`);
    }

    return this.mapToPackageVersionDto(verObj);
  }

  @Get(':name/:version/download')
  async downloadPackage(@Param('name') name: string, @Param('version') version: string, @Res() res: Response) {
    const verObj = await this.em.findOne(Version, {
      package: { name: name.trim() },
      version: version
    }, {
      populate: ['package']
    });

    if (!verObj) {
      throw new NotFoundException(`Version "${version}" not found for package "${name}"`);
    }

    const download = new Download();
    download.package = verObj.package;
    download.version = verObj;
    await this.em.persistAndFlush(download);

    const fileStream = new stream.PassThrough();
    fileStream.end(verObj.data);

    const fileName = `${name}-${version}`;
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': verObj.data.length,
    });

    fileStream.pipe(res);
  }

  @Get(':name/downloads/count')
  async getPackageAllDownloadsHistory(@Param('name') name: string): Promise<DownloadsCountDto> {
    const downloads = await this.em.find(Download, {
      package: { name: name.trim() },
    }, {
      orderBy: { downloadDate: 'DESC' }
    });

    return new DownloadsCountDto(downloads.length);
  }

  @Get(':name/:version/downloads')
  async getDownloadsHistory(@Param('name') name: string, @Param('version') version: string): Promise<DownloadsDto>{
    const downloads = await this.em.find(Download, {
      package: { name: name.trim() },
      version: { version: version.trim() }
    }, {
      orderBy: { downloadDate: 'DESC' }
    });

    return new DownloadsDto(downloads.map(download => download.downloadDate.toISOString()));
  }


  @Post(':name/:version/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File,
                   @Param('name') name: string,
                   @Param('version') version: string): Promise<void> {
    try {
      await this.packageService.savePackage(name, version, file.buffer, file.mimetype);
    } catch (e) {
      this.logger.error(`Failed to upload package ${name}@${version}: ${e}`);
      throw e;
    }
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

  private sortVersionsLatestFirst(versions: Version[]): Version[] {
    return versions.sort((a, b) => semver.rcompare(semver.parse(a.version), semver.parse(b.version)));
  }

  private mapToVersionDtos(versions: Version[]): VersionDto[] {
    return versions.map(ver => this.mapToVersionDto(ver));
  }

  private mapToPackageVersionDto(version: Version): PackageVersionDto {
    return new PackageVersionDto(
        this.mapToVersionDto(version),
        version.readme,
        version.description,
        version.tags
    );
  }

  private mapToVersionDto(version: Version): VersionDto {
    return new VersionDto(version.version, version.createdAt.toISOString(), version.sizeKb);
  }
}
