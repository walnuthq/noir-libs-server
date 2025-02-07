import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/core';
import { Package } from '../model/package.entity';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Version } from '../model/version.entity';
import * as semver from 'semver';

@Injectable()
export class PackageService {
    private readonly logger = new Logger(PackageService.name, { timestamp: true });

    private readonly MAX_FILE_SIZE = 1024 * 1024 * 10; // 10 MB

    constructor(@InjectRepository(Package) private packageRepository: EntityRepository<Package>,
                @InjectRepository(Version) private versionRepository: EntityRepository<Version>) {}

    public async savePackage(name: string, version: string, file: Buffer, fileMimeType: string) {
        this.validateName(name);
        this.validateVersion(version);
        this.validateFile(file, fileMimeType);
        const existingPackage = await this.packageRepository.findOne({ name }, {populate: ['versions']});
        if (existingPackage) {
            const existingVersion = existingPackage.versions.find(v => v.version === version);
            if (existingVersion) {
                throw new BadRequestException(`Version ${version} already exists for package ${name}`);
            }
            const newVersion = new Version();
            newVersion.version = version;
            newVersion.data = file;
            newVersion.sizeKb = file.byteLength / 1024;
            newVersion.package = existingPackage;
            await this.versionRepository.insert(newVersion);
            this.logger.log(`New version ${version} for package ${name} saved`);
        } else {
            const newVersion = new Version();
            newVersion.version = version;
            newVersion.data = file;
            newVersion.sizeKb = file.byteLength / 1024;

            const newPackage = new Package();
            newPackage.name = name;
            newPackage.description = 'temp description!';
            newPackage.tags = 'tag1, tag2';
            newPackage.readme = 'readme';
            newPackage.versions.add(newVersion);

            await this.packageRepository.getEntityManager().persistAndFlush(newPackage);
            this.logger.log(`New package ${name} ${version} saved`);
        }
    }

    private validateName(name: string): void {
        const nameRegexp = /^(?:[a-z0-9]+(?:[-_][a-z0-9]+)*)(?:\.[a-z0-9]+(?:[-_][a-z0-9]+)*)*$/;
        if (!nameRegexp.test(name)) {
            throw new BadRequestException('Given package name is not valid. Assure it follows the naming convention.');
        }
    }

    private validateVersion(version: string): void {
        if (!semver.valid(version)) {
            throw new BadRequestException('Given version is not valid. Assure it is a valid semantic version.');
        }
    }

    private validateFile(file: Buffer, fileMimeType: string) {
        if (file.length === 0) {
            throw new BadRequestException('Given file is empty');
        }
        if (file.length > this.MAX_FILE_SIZE) {
            throw new BadRequestException(`Given file is too big. Max file size is ${this.MAX_FILE_SIZE} MB.`);
        }
        if (fileMimeType !== 'application/gzip') {
            throw new BadRequestException('Given file is not a gzip file!');
        }
    }
}