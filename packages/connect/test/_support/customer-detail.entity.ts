import { BaseEntity, Column, Entity, Link, PrimaryKey } from '@sqb/connect';
import type { Customer } from './customer.entity.js';

@Entity('customer_details')
export class CustomerDetail extends BaseEntity {
  @PrimaryKey()
  @Column({ fieldName: 'customer_id' })
  customerId?: number;

  @Column()
  notes?: string;

  @Column()
  alerts?: string;

  @Link({ exclusive: true }).toOne(async () => (await import('./customer.entity.js')).Customer)
  readonly customer?: Customer;
}
