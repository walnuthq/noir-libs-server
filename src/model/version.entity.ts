import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { Package } from './package.entity';

@Entity()
export class Version {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Package)
  package!: Package;

  @Property()
  version!: string;

  @Property({ columnType: 'text' })
  packageBlob!: string;

  @Property()
  sizeKb!: number;

  @Property()
  createdAt: Date = new Date();
}
