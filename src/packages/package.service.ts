import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/core';
import { Package } from '../model/package.entity';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Version } from '../model/version.entity';
import * as semver from 'semver';
import { ExtractService } from './extract.service';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { ManifestService } from './manifest.service';
import { ApiKeyService } from '../user/apikey.service';

@Injectable()
export class PackageService {
    private readonly logger = new Logger(PackageService.name, { timestamp: true });

    private readonly MAX_FILE_SIZE = 1024 * 1024 * 10; // 10 MB
    private readonly UPLOAD_BASE_PATH = process.env.REGISTRY_PATH ?? path.join(__dirname, '..', 'temp_blobs');

    constructor(@InjectRepository(Package) private packageRepository: EntityRepository<Package>,
                @Inject() private extractService: ExtractService,
                @Inject() private manifestService: ManifestService,
                @Inject() private apiKeyService: ApiKeyService) {}

    public async savePackage(
            name: string,
            version: string,
            file: Buffer,
            fileMimeType: string,
            apiKeyString: string) {
        let packageObj: Package | undefined = await this.packageRepository.findOne({ name }, {populate: ['versions']});
        let packageOwnerUserId: string;
        if (packageObj) {
            await this.apiKeyService.validateApiKeyOfExistingPackage(apiKeyString, packageObj.ownerUserId, packageObj.name);
            this.validateVersionNotAlreadyExists(packageObj, version);
            packageOwnerUserId = packageObj.ownerUserId;
        } else {
            packageOwnerUserId = await this.apiKeyService.validateApiKeyAndGetOwnerUserId(apiKeyString);
        }
        this.validateName(name);
        this.validateVersion(version);
        this.validateFile(file, fileMimeType);
        // Ensure the directory exists
        const outputDirectory = path.join(this.UPLOAD_BASE_PATH, `${name}_${version}`);
        if (!fs.existsSync(outputDirectory)) {
            fs.mkdirSync(outputDirectory, { recursive: true });
        }
        await this.extractService.extractTarGzFromBuffer(file, outputDirectory);
        const manifest = await this.manifestService.tomlToJson(path.join(outputDirectory, 'Nargo.toml'));
        const readme = await this.manifestService.readReadme(path.join(outputDirectory, 'README.md'));

        let versionObj: Version = this.newVersionEntity(
            version,
            file,
            readme,
            manifest.package.description,
            manifest.package.keywords?.join(', ')
        );
        if (!packageObj) {
            packageObj = new Package();
            packageObj.name = name;
            packageObj.ownerUserId = packageOwnerUserId;
            this.logger.log(`New package ${name} ${version} saved by user with ID ${packageOwnerUserId}`);
        }
        packageObj.versions.add(versionObj);
        await this.packageRepository.getEntityManager().persistAndFlush(packageObj);
    }

    private newVersionEntity(version: string, file: Buffer, readme?: string, description?: string, tags?: string): Version {
        const newVersion = new Version();
        newVersion.version = version;
        newVersion.data = file;
        newVersion.sizeKb = file.byteLength / 1024;
        newVersion.readme = readme;
        newVersion.description = description;
        newVersion.tags = tags;
        return newVersion;
    }

    private validateVersionNotAlreadyExists(packageObj: Package, version: string): void {
        if (packageObj) {
            const existingVersion = packageObj.versions.find(v => v.version === version);
            if (existingVersion) {
                throw new BadRequestException(`Version ${version} already exists for package ${packageObj.name}`);
            }
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