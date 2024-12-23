import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Package } from '../model/package.entity';
import { Version } from '../model/version.entity';

@Injectable()
export class PackagesService {
  constructor(private readonly em: EntityManager) {}

  async findOrCreatePackage(name: string): Promise<Package> {
    let pkg = await this.em.findOne(Package, { name });

    if (!pkg) {
      pkg = this.em.create(Package, { name, tags: '', readme: '' });
      await this.em.persistAndFlush(pkg);
    }

    return pkg;
  }

  async addVersion(
    packageId: number,
    versionData: {
      major: number;
      minor: number;
      patch: number;
      versionNumber: string;
      packageBlob: string;
      sizeKb: number;
    },
  ): Promise<Version> {
    const pkg = await this.em.findOneOrFail(Package, packageId, { populate: ['versions'] });

    const existingVersion = await this.em.findOne(Version, {
      package: pkg,
    });

    if (existingVersion) {
      throw new Error('Version already exists');
    }

    const version = this.em.create(Version, {
      ...versionData,
      package: pkg,
    });

    pkg.versions.add(version);
    await this.em.persistAndFlush(version);

    return version;
  }
}
