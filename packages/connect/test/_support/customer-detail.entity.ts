import {
    BaseEntity,
    Column,
    Entity,
    PrimaryKey,
    LinkToOne,
} from '@sqb/connect';
import type {Customer} from './customer.entity';

@Entity('customer_details')
export class CustomerDetail extends BaseEntity {
    @PrimaryKey()
    @Column({fieldName: 'customer_id'})
    customerId?: number;

    @Column()
    notes?: string;

    @Column()
    alerts?: string;

    @LinkToOne(() => require('./customer.entity').Customer)
    readonly customer?: Customer;

}
