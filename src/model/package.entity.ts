import { Entity, PrimaryKey, Property, Collection, OneToMany } from '@mikro-orm/core';
import { Version } from './version.entity';
import { Download } from './download.entity';

@Entity()
export class Package {
  @PrimaryKey()
  name!: string;

  @OneToMany(() => Version, version => version.package)
  versions = new Collection<Version>(this);

  @OneToMany(() => Download, download => download.package)
  downloads = new Collection<Download>(this);
}