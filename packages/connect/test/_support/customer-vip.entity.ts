import {BaseEntity, Column, DataType, Entity, LinkToOne, PrimaryKey,} from '@sqb/connect';
import type {Customer} from './customer.entity';

@Entity('customer_vip_details')
export class CustomerVip extends BaseEntity {
    @PrimaryKey()
    @Column({fieldName: 'customer_id'})
    customerId?: number;

    @Column()
    notes?: string;

    @Column({dataType: DataType.SMALLINT})
    rank?: number;

    @LinkToOne(() => require('./customer.entity').Customer)
    readonly customer?: Customer;

}
