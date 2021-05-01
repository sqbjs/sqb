import {
    BaseEntity,
    Column,
    Entity,
    PrimaryKey,
    FieldName,
    Association, belongsTo, ForeignKey,
} from '@sqb/connect';
import type {Customer} from './customers.entity';

@Entity('customer_details')
export class CustomerDetails extends BaseEntity<CustomerDetails> {
    @PrimaryKey()
    @FieldName('customer_id')
    @ForeignKey(() => require('./customers.entity').Customer)
    customerId?: number;

    @Column()
    notes?: string;

    @Column()
    alerts?: string;

    @Association(belongsTo(() => require('./customers.entity').Customer))
    readonly customer?: Customer;

}
