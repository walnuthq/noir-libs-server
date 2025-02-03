import { Controller, Get } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';

@Controller('health')
export class AppController {
    constructor(private readonly em: EntityManager) {}

    @Get()
    async checkHealth() {
        // If db connection fails, this will throw an error and health check will fail
        await this.em.getConnection().execute('SELECT 1');
    }
}
