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

@Controller('api/v1/packages')
export class PackagesController {
  private readonly logger = new Logger(PackagesController.name, { timestamp: true });

  constructor(private readonly em: EntityManager,
              @Inject() private readonly packageService: PackageService) {}

  @Get()
  async getAllPackages(@Query('limit') limit: string = '10') {
    const limitNumber = Math.min(parseInt(limit) || 10, 100);
    const packages = await this.em.findAll(Package, {
      populate: ['versions'],
      limit: limitNumber
    });

    return packages.map(pkg => ({
      name: pkg.name,
      tags: pkg.tags,
      description: pkg.description,
      // Latest version first
      versions: this.getAndMapVersions(pkg.versions.getItems()),
    }));
  }

  @Get(':name/latest')
  async getLatestPackageVersionDetails(@Param('name') name: string) {
    const packageObj = await this.em.findOne(Package, {
      name: name.trim(),
    }, {
      populate: ['versions']
    });

    if (!packageObj) {
      throw new NotFoundException(`Package ${name} not found`);
    }

    return {
      latest_version: this.getAndMapVersions(packageObj.versions.getItems())[0],
    };
  }

  @Get(':name/versions')
  async getAllPackageVersions(@Param('name') name: string) {
    const versions = await this.em.find(Version, {
      package: { name: name.trim() },
    }, {
      populate: ['package']
    });
    if (versions.length === 0) {
      throw new NotFoundException(`Package ${name} not found`);
    }
    return this.getAndMapVersions(versions);
  }

  @Get(':name/:version')
  async getPackage(@Param('name') name: string, @Param('version') version: string) {
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

    return {
      name: verObj.package.name,
      version: {
        version: verObj.version,
        createdAt: verObj.createdAt,
        sizeKb: verObj.sizeKb
      },
      readme: verObj.package.readme,
      description: verObj.package.description,
      tags: verObj.package.tags,
    };
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
  async getPackageAllDownloadsHistory(@Param('name') name: string) {
    const downloads = await this.em.find(Download, {
      package: { name: name.trim() },
    }, {
      orderBy: { downloadDate: 'DESC' }
    });

    return {
        count: downloads.length,
    };
  }

  @Get(':name/:version/downloads')
  async getDownloadsHistory(@Param('name') name: string, @Param('version') version: string) {
    const downloads = await this.em.find(Download, {
      package: { name: name.trim() },
      version: { version: version.trim() }
    }, {
      orderBy: { downloadDate: 'DESC' }
    });

    return {
      downloadDates: downloads.map(download => download.downloadDate.toISOString())
    };
  }


  @Post(':name/:version/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File,
                   @Param('name') name: string,
                   @Param('version') version: string) {
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

  private getAndMapVersions(versions: Version[]): {version: string, createdAt: string, sizeKb: number}[] {
    return versions
        .map(_ => ({
          version: _.version,
          createdAt: _.createdAt,
          sizeKb: _.sizeKb,
          parsedVersion:semver.parse(_.version)
        }))
        .sort((a, b) => semver.rcompare(a.parsedVersion, b.parsedVersion))
        .map(ver => ({
          version: ver.version,
          createdAt: ver.createdAt.toISOString(),
          sizeKb: ver.sizeKb
        }));
    }
}
