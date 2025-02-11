import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { Package } from './package.entity';
import * as semver from 'semver';

@Entity()
export class Version {
  @ManyToOne(() => Package, { primary: true })
  package!: Package;

  @PrimaryKey()
  version!: string;

  @Property({ type: 'blob' }) // Maps to BLOB in the database
  data!: Buffer;

  @Property()
  sizeKb!: number;

  @Property()
  createdAt: Date = new Date();

  @Property({ nullable: true })
  tags?: string;

  @Property({ type: 'text', nullable: true })
  readme?: string;

  @Property({ type: 'text', nullable: true })
  description?: string;

  public static sortVersionsLatestFirst(versions: Version[]): Version[] {
    return versions.sort((a, b) => semver.rcompare(semver.parse(a.version), semver.parse(b.version)));
  }
}
