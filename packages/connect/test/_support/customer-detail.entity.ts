import {
    BaseEntity,
    Column,
    Entity,
    LinkToOne,
    PrimaryKey,
} from '@sqb/connect';
import type {Customer} from './customer.entity.js';

@Entity('customer_details')
export class CustomerDetail extends BaseEntity {
    @PrimaryKey()
    @Column({fieldName: 'customer_id'})
    customerId?: number;

    @Column()
    notes?: string;

    @Column()
    alerts?: string;

    @LinkToOne(async () => (await import('./customer.entity.js')).Customer)
    readonly customer?: Customer;

}
