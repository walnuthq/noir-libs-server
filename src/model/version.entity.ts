import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { Package } from './package.entity';

@Entity()
export class Version {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Package)
  package!: Package;

  @PrimaryKey()
  version!: string;

  @Property({ type: 'blob' }) // Maps to BLOB in the database
  data!: Buffer;

  @Property()
  sizeKb!: number;

  @Property()
  createdAt: Date = new Date();
}
