import { Controller, Get, Inject, Query } from '@nestjs/common';
import { PackageDto } from '../../dto/packages/package.dto';
import { AllPackagesService } from './all-packages.service';

@Controller('api/v1/packages')
export class AllPackagesController {

    constructor(@Inject() private allPackagesService: AllPackagesService) {}

    @Get()
    async getAllPackages(@Query('limit') limit: string = '10'): Promise<PackageDto[]> {
        const limitNumber = Math.min(parseInt(limit) || 10, 100);
        return this.allPackagesService.getAllPackages(limitNumber);
    }

    @Get('downloads/count')
    async getAllPackagesDownloadsCount(@Query('sortBy') sortBy: 'asc' | 'desc' = 'desc') {
        return this.allPackagesService.getAllPackagesDownloadsCount(sortBy);
    }
}
