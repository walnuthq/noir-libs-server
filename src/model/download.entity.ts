import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { Package } from './package.entity';
import { Version } from './version.entity';

@Entity()
export class Download {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Package)
  package!: Package;

  @ManyToOne(() => Version)
  version!: Version;

  @Property()
  downloadDate: Date = new Date();
}