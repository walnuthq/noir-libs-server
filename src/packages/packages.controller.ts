import { 
  Controller, 
  Get, 
  Param, 
  StreamableFile, 
  NotFoundException, Res,
  BadRequestException,
  Query
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Package } from '../model/package.entity';
import { Response } from 'express';
import * as stream from 'stream';
import { Download } from 'src/model/download.entity';
import { Version } from 'src/model/version.entity';
import * as semver from 'semver';

@Controller('api/v1/packages')
export class PackagesController {
  constructor(private readonly em: EntityManager) {}
  @Get()
  async getAllPackages(@Query('limit') limit: string = '10') {
    const limitNumber = Math.min(parseInt(limit) || 10, 100);
    const packages = await this.em.find(Package, {}, {
      populate: ['versions'],
      limit: limitNumber
    });

    return packages.map(pkg => ({
      name: pkg.name,
      tags: pkg.tags,
      versions: pkg.versions.getItems().map(ver => ({
        version: ver.version,
        createdAt: ver.createdAt,
        sizeKb: ver.sizeKb
      }))
    }));
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
      version: verObj.version,
      size_kb: verObj.sizeKb,
      readme: verObj.package.readme,
      description: verObj.package.description,
      created_at: verObj.createdAt,
      tag_name: verObj.package.tags,
    };
  }


  @Get(':name/:version/download')
  async downloadPackage(
    @Param('name') name: string,
    @Param('version') version: string,
    @Res() res: Response,
  ) {
  
    const pkg = await this.em.findOne(Package, { name }, { populate: ['versions'] });
    if (!pkg) {
      throw new NotFoundException(`Package "${name}" not found`);
    }
  
    const ver = pkg.versions.getItems().find(
      v => v.version === version,
    );
  
    if (!ver) {
      throw new NotFoundException(`Version "${version}" not found for package "${name}"`);
    }
  
    const download = new Download();
    download.package = pkg;
    download.version = ver;
    await this.em.persistAndFlush(download);
  
    const fileStream = new stream.PassThrough();
    fileStream.end(ver.data);
  
    const fileName = `${name}-${version}.tar.gz`; 
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': ver.data.length, 
    });
  
    fileStream.pipe(res);
  }
  
  @Get(':name/:version/downloads')
  async getDownloadsHistory(
    @Param('name') name: string,
    @Param('version') version: string,
  ) {
    const pkg = await this.em.findOne(Package, { name });
    if (!pkg) {
      throw new NotFoundException(`Package "${name}" not found`);
    }
  
    
    const ver = await this.em.findOne(Version, { 
      package: {name: name.trim()}, 
      version
    });
  
    if (!ver) {
      throw new NotFoundException(`Version "${version}" not found for package "${name}"`);
    }
  
    const downloads = await this.em.find(Download, {
      package: pkg,
      version: ver
    }, {
      orderBy: { downloadDate: 'DESC' }
    });
  
    return {
      package: name,
      version: version,
      downloads: downloads.map(download => ({
        downloadDate: download.downloadDate
      }))
    };
  }
}
