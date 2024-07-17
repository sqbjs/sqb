import { BaseEntity, Column, DataType, Entity, Link, PrimaryKey } from '@sqb/connect';
import type { Customer } from './customer.entity.js';

@Entity('customer_vip_details')
export class CustomerVip extends BaseEntity {
  @PrimaryKey()
  @Column({ fieldName: 'customer_id' })
  customerId?: number;

  @Column()
  notes?: string;

  @Column({ dataType: DataType.SMALLINT })
  rank?: number;

  @(Link({ exclusive: true }).toOne(async () => (await import('./customer.entity.js')).Customer))
  readonly customer?: Customer;
}
