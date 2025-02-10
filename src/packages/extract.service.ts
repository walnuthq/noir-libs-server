import * as fs from 'node:fs';
import * as zlib from 'node:zlib';
import * as tar from 'tar';
import { Injectable } from '@nestjs/common';
import { PassThrough } from 'stream';

@Injectable()
export class ExtractService {

    public extractTarGzFromBuffer(buffer: Buffer, outputDir: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const bufferStream = new PassThrough();
            bufferStream.end(buffer); // Przesyłamy bufor do strumienia

            // Dekompresja Gzip
            const gunzip = zlib.createGunzip();

            // Rozpakowanie tar
            const extract = tar.extract({
                cwd: outputDir, // Katalog docelowy
                strip: 1,       // Usuwa główny katalog jeśli jest w archiwum
            });

            bufferStream
                .pipe(gunzip)  // Dekompresja gzip
                .pipe(extract) // Rozpakowanie tar
                .on('error', reject)
                .on('end', resolve);
        });
    }
}