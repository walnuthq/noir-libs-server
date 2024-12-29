import { Injectable, OnModuleInit } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Package } from '../model/package.entity';
import { Version } from '../model/version.entity';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class AztecPackagesInitService implements OnModuleInit {
    constructor(private readonly em: EntityManager) {}

    async onModuleInit() {
        console.log('Running seed logic at app initialization');
        

        const fork = this.em.fork();
        
        const existingPackages = await fork.count(Package);
        if (existingPackages === 0) {
            const package1 = new Package();
            package1.name = 'aztec';
            package1.tags = 'aztec.nr, aztec, frameworks';
            package1.description = 'The core of the Aztec framework';
            package1.readme = '# Aztec\n\nThe core of the Aztec framework'; 

            const package2 = new Package();
            package2.name = 'aztec-easy-private-state';
            package2.tags = 'aztec.nr, aztec, frameworks';
            package2.description = 'A library for easily creating private state';
            package2.readme = '# Aztec Easy Private State\n\nA library for easily creating private state'; 

            const package3 = new Package();
            package3.name = 'aztec-value-note';
            package3.tags = 'aztec.nr, aztec, frameworks';
            package3.description = 'A library for storing arbitrary values';
            package3.readme = '# Aztec Value Note\n\nA library for storing arbitrary values';


            const entity1 = fork.create(Package, package1);
            const entity2 = fork.create(Package, package2);
            const entity3 = fork.create(Package, package3);
            

            await fork.persistAndFlush([entity1, entity2, entity3]);

            const packages = [entity1, entity2, entity3];
            for (const pkg of packages) {
                const version = new Version();
                version.package = pkg;
                version.version = '0.0.1';

                const filePath = path.join(__dirname, '..', '..', 'blobs', `${pkg.name}.tar.gz`);
                const fileData = await fs.promises.readFile(filePath);
                
                version.data = fileData;
                version.sizeKb = Math.ceil(fileData.length / 1024);
                
                await fork.persist(version);
            }

            await fork.flush();
            console.log('Seed data inserted with versions and blobs');
        } else {
            console.log('Seed data already exists');
        }
    }
}