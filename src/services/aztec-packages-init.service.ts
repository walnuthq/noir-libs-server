import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Package } from '../model/package.entity';
import { Version } from '../model/version.entity';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class AztecPackagesInitService implements OnModuleInit {
    constructor(private readonly em: EntityManager) {}
    private readonly logger = new Logger(AztecPackagesInitService.name, { timestamp: true });

    async onModuleInit() {
        this.logger.log('Running seed logic at app initialization');

        const fork = this.em.fork();

        await fork.transactional(async () => {
            const existingPackages = await fork.count(Package);
            if (existingPackages === 0) {
                const package1 = new Package();
                package1.name = 'aztec';
                package1.ownerUserId = 'aztec-nr';

                const package2 = new Package();
                package2.name = 'easy_private_state';
                package2.ownerUserId = 'aztec-nr';

                const package3 = new Package();
                package3.name = 'value_note';
                package3.ownerUserId = 'aztec-nr';

                const package4 = new Package();
                package4.name = 'protocol_types';
                package4.ownerUserId = 'aztec-nr';

                const entity1 = fork.create(Package, package1);
                const entity2 = fork.create(Package, package2);
                const entity3 = fork.create(Package, package3);
                const entity4 = fork.create(Package, package4);

                const packages = [entity1, entity2, entity3, entity4];
                await fork.persistAndFlush(packages);

                const aztecVersion = new Version();
                aztecVersion.package = entity1;
                aztecVersion.version = '0.67.0';
                aztecVersion.tags = 'aztec.nr, aztec, frameworks';
                aztecVersion.description = 'The core of the Aztec framework';
                aztecVersion.readme = '# Aztec\n\nThe core of the Aztec framework';
                aztecVersion.repository = 'https://github.com/AztecProtocol/aztec-nr';

                const aztecEasyPrivateStateVersion = new Version();
                aztecEasyPrivateStateVersion.package = entity2;
                aztecEasyPrivateStateVersion.version = '0.67.0';
                aztecEasyPrivateStateVersion.tags = 'aztec.nr, aztec, frameworks';
                aztecEasyPrivateStateVersion.description = 'A library for easily creating private state';
                aztecEasyPrivateStateVersion.readme = '# Aztec Easy Private State\n\nA library for easily creating private state';
                aztecEasyPrivateStateVersion.repository = 'https://github.com/AztecProtocol/aztec-nr';

                const aztecValueNoteVersion = new Version();
                aztecValueNoteVersion.package = entity3;
                aztecValueNoteVersion.version = '0.67.0';
                aztecValueNoteVersion.tags = 'aztec.nr, aztec, frameworks';
                aztecValueNoteVersion.description = 'A library for storing arbitrary values';
                aztecValueNoteVersion.readme = '# Aztec Value Note\n\nA library for storing arbitrary values';
                aztecValueNoteVersion.repository = 'https://github.com/AztecProtocol/aztec-nr';

                const aztecProtocolTypesVersion = new Version();
                aztecProtocolTypesVersion.package = entity4;
                aztecProtocolTypesVersion.version = '0.66.0';
                aztecProtocolTypesVersion.tags = 'aztec.nr, aztec, frameworks';
                aztecProtocolTypesVersion.description = 'Aztec protocol types internal dependency';
                aztecProtocolTypesVersion.readme = '# Aztec protocol types\n\nInternal dependency for Aztec framework packages';
                aztecProtocolTypesVersion.repository = 'https://github.com/AztecProtocol/aztec-nr';

                const versions = [aztecVersion, aztecEasyPrivateStateVersion, aztecValueNoteVersion, aztecProtocolTypesVersion];

                for (const version of versions) {
                    const filePath = path.join(__dirname, '..', '..', 'blobs', `${version.package.name}-${version.version}`);
                    const fileData = await fs.promises.readFile(filePath);

                    version.data = fileData;
                    version.sizeKb = Math.ceil(fileData.length / 1024);

                    await fork.persist(version);
                    this.logger.log(`Version ${version.version} of package ${version.package.name} inserted`);
                }

                await fork.flush();
                this.logger.log('Seed data inserted with versions and blobs');
            } else {
                this.logger.log('Seed data already exists');
            }
        });
    }
}