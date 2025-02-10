import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { Package } from './package.entity';

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
}
