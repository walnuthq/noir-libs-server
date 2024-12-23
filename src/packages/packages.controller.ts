import { 
  Controller, 
  Get, 
  Param, 
  StreamableFile, 
  NotFoundException, Res
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Package } from '../model/package.entity';
import { Response } from 'express';
import * as stream from 'stream';
import { Download } from 'src/model/download.entity';
import { Version } from 'src/model/version.entity';

@Controller('api/v1/packages')
export class PackagesController {
  constructor(private readonly em: EntityManager) {}

  @Get(':name')
  async getPackageName(@Param('name') name: string, @Param('version') version: string) {

    const pkg = await this.em.findOne(Package, { name }, { populate: ['versions'] });
    if (!pkg) {
      throw new NotFoundException(`Package "${name}" not found`);
    }

    const ver = pkg.versions.getItems();

    if (!ver) {
      throw new NotFoundException(`Version "${version}" not found for package "${name}"`);
    }

    return {
      name: pkg.name,
      versions: ver,
      readme: pkg.readme,
      tag_name: pkg.tagName,
    };
  }

  @Get(':name/:version')
  async getPackage(@Param('name') name: string, @Param('version') version: string) {
    const [major, minor, patch] = version.split('.').map(Number);

    const pkg = await this.em.findOne(Package, { name }, { populate: ['versions'] });
    if (!pkg) {
      throw new NotFoundException(`Package "${name}" not found`);
    }

    const ver = pkg.versions.getItems().find(
      v => v.major === major && v.minor === minor && v.patch === patch,
    );

    if (!ver) {
      throw new NotFoundException(`Version "${version}" not found for package "${name}"`);
    }

    return {
      name: pkg.name,
      version: ver.versionNumber,
      size_kb: ver.sizeKb,
      readme: pkg.readme,
      created_at: ver.createdAt,
      tag_name: pkg.tagName,
    };
  }



  @Get(':name/latest/download')
  async downloadLatestPackage(
    @Param('name') name: string,
    @Res() res: Response,
  ) {
    const pkg = await this.em.findOne(Package, { name }, { populate: ['versions'] });
    if (!pkg) {
      throw new NotFoundException(`Package "${name}" not found`);
    }
  
    const versions = pkg.versions.getItems();
    if (versions.length === 0) {
      throw new NotFoundException(`No versions found for package "${name}"`);
    }
  
    const latestVersion = versions.reduce((latest, current) => {
      if (!latest) return current;
      
      if (current.major > latest.major) return current;
      if (current.major < latest.major) return latest;
      
      if (current.minor > latest.minor) return current;
      if (current.minor < latest.minor) return latest;
      
      if (current.patch > latest.patch) return current;
      if (current.patch < latest.patch) return latest;
      
      return latest;
    });
    const download = new Download();
    download.package = pkg;
    download.version = latestVersion;
    await this.em.persistAndFlush(download);
  
    const buffer = Buffer.from(latestVersion.packageBlob, 'base64');
    const fileStream = new stream.PassThrough();
    fileStream.end(buffer);
  
    const fileName = `${name}-${latestVersion.versionNumber}.tar.gz`;
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': buffer.length,
    });
  
    fileStream.pipe(res);
  }
  
  @Get(':name/:version/download')
  async downloadPackage(
    @Param('name') name: string,
    @Param('version') version: string,
    @Res() res: Response,
  ) {
    const [major, minor, patch] = version.split('.').map(Number);
  
    const pkg = await this.em.findOne(Package, { name }, { populate: ['versions'] });
    if (!pkg) {
      throw new NotFoundException(`Package "${name}" not found`);
    }
  
    const ver = pkg.versions.getItems().find(
      v => v.major === major && v.minor === minor && v.patch === patch,
    );
  
    if (!ver) {
      throw new NotFoundException(`Version "${version}" not found for package "${name}"`);
    }
  
    const download = new Download();
    download.package = pkg;
    download.version = ver;
    await this.em.persistAndFlush(download);
  
    const buffer = Buffer.from(ver.packageBlob, 'base64');
    const fileStream = new stream.PassThrough();
    fileStream.end(buffer);
  
    const fileName = `${name}-${version}.tar.gz`; 
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': buffer.length, 
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
  
    const [major, minor, patch] = version.split('.').map(Number);
    
    const ver = await this.em.findOne(Version, { 
      package: pkg, 
      major,
      minor,
      patch
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
      totalDownloads: downloads.length,
      downloads: downloads.map(download => ({
        id: download.id,
        downloadDate: download.downloadDate
      }))
    };
  }
}
