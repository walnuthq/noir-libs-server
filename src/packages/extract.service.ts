import * as zlib from 'node:zlib';
import * as tar from 'tar';
import { Injectable } from '@nestjs/common';
import { PassThrough } from 'stream';

@Injectable()
export class ExtractService {

    public extractTarGzFromBuffer(buffer: Buffer, outputDir: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const bufferStream = new PassThrough();
            bufferStream.end(buffer);

            const gunzip = zlib.createGunzip();

            const extract = tar.extract({
                cwd: outputDir,
            });

            bufferStream
                .pipe(gunzip)
                .pipe(extract)
                .on('error', reject)
                .on('end', resolve);
        });
    }
}