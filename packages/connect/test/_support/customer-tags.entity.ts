import {Column, Entity, PrimaryKey} from '@sqb/connect';

@Entity({tableName: 'customer_tags'})
@PrimaryKey(['customerId', 'tag'], {name: 'pk_customer_tags'})
export class CustomerTags {
    @Column({fieldName: 'customer_id'})
    customerId: number;

    @Column()
    tag: string;
}
