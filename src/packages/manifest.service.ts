import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'node:fs';
import * as TOML from '@iarna/toml';
import { Manifest } from '../model/manifest/manifest';

@Injectable()
export class ManifestService {
    private readonly logger = new Logger(ManifestService.name, { timestamp: true });

    public async tomlToJson(tomlPath: string): Promise<Manifest> {
        try {
            const tomlContent = fs.readFileSync(tomlPath, 'utf-8');
            return TOML.parse(tomlContent) as unknown as Manifest;
        } catch (error) {
            this.logger.error('Error reading TOML file:', error);
            throw error;
        }
    }

    public async readReadme(filePath: string): Promise<string | undefined> {
        try {
            return await fs.promises.readFile(filePath, 'utf-8');
        } catch (error) {
            this.logger.error(`File (${filePath}) reading failed, probably file not exists:`, error);
            return undefined;
        }
    }
}