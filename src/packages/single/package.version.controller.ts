import {
    BadRequestException,
    Controller,
    Get,
    Inject,
    Logger,
    NotFoundException,
    Param,
    Post,
    Res,
    UploadedFile,
    UseInterceptors,
    Headers, Put, Query
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Response } from 'express';
import * as stream from 'stream';
import { Download } from 'src/model/download.entity';
import { Version } from 'src/model/version.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { PackageService } from '../package.service';
import { PackageVersionDto } from '../../dto/packages/package-version.dto';
import { DownloadsDto } from '../../dto/packages/download/downloads.dto';
import * as semver from 'semver';

@Controller('api/v1/packages/:name/:version')
export class PackageVersionController {
    private readonly logger = new Logger(PackageVersionController.name, { timestamp: true });

    constructor(private readonly em: EntityManager,
                @Inject() private readonly packageService: PackageService) {}

    @Get()
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
            throw new NotFoundException(`Version ${ version } not found for package "${ name }"`);
        }

        return PackageVersionDto.fromVersion(verObj);
    }

    @Get('download')
    async downloadPackage(@Param('name') name: string, @Param('version') version: string, @Res() res: Response,
                          @Query("fetchYanked") fetchYanked: boolean = false) {
        const verObj = await this.em.findOne(Version, {
            package: { name: name.trim() },
            version: version,
        }, {
            populate: ['package']
        });

        if (!verObj || (verObj.isYanked && !fetchYanked)) {
            throw new NotFoundException(`Version "${ version }" not found for package "${ name }"`);
        }

        const download = new Download();
        download.package = verObj.package;
        download.version = verObj;
        await this.em.persistAndFlush(download);

        const fileStream = new stream.PassThrough();
        fileStream.end(verObj.data);

        const fileName = `${ name }-${ version }`;
        res.set({
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${ fileName }"`,
            'Content-Length': verObj.data.length,
        });

        fileStream.pipe(res);
    }

    @Get('downloads')
    async getDownloadsHistory(@Param('name') name: string, @Param('version') version: string): Promise<DownloadsDto> {
        const downloads = await this.em.find(Download, {
            package: { name: name.trim() },
            version: { version: version.trim() }
        }, {
            orderBy: { downloadDate: 'DESC' }
        });

        return new DownloadsDto(downloads.map(download => download.downloadDate.toISOString()));
    }

    @Post('/publish')
    @UseInterceptors(FileInterceptor('file'))
    async publishPackage(@UploadedFile() file: Express.Multer.File,
                     @Param('name') name: string,
                     @Param('version') version: string,
                     @Headers('Authorization') authorizationHeader: string): Promise<void> {
        try {
            const apiKey = authorizationHeader?.replace('Bearer ', '').trim();
            await this.packageService.savePackage(name, version, file.buffer, file.mimetype, apiKey);
        } catch (e) {
            this.logger.error(`Failed to upload package ${ name }@${ version }: ${ e }`);
            throw e;
        }
    }

    @Put('/yank')
    @UseInterceptors(FileInterceptor('file'))
    async yankPackage(@Param('name') name: string,
                      @Param('version') version: string,
                      @Headers('Authorization') authorizationHeader: string): Promise<void> {
        try {
            const apiKey = authorizationHeader?.replace('Bearer ', '').trim();
            await this.packageService.yankPackage(name, version, apiKey);
        } catch (e) {
            this.logger.error(`Failed to upload package ${ name }@${ version }: ${ e }`);
            throw e;
        }
    }
}
