import {Column, Entity, FieldName, ForeignKey, PrimaryKey} from '@sqb/connect';

@Entity({tableName: 'customer_tags'})
@PrimaryKey(['customerId', 'tag'], {name: 'pk_customer_tags'})
export class CustomerTag {
    @FieldName('customer_id')
    @ForeignKey(async () => (await import('./customers.entity')).Customer)
    customerId: number;

    @Column()
    tag: string;
}
