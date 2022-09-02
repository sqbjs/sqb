import {Column, Entity, ForeignKey, PrimaryKey} from '@sqb/connect';

@Entity({tableName: 'customer_tags'})
@PrimaryKey(['customerId', 'tagId'], {name: 'pk_customer_tags'})
export class CustomerTag {
    @Column({
        fieldName: 'customer_id',
        notNull: true
    })
    @ForeignKey(async () => (await import('./customer.entity.js')).Customer)
    customerId: number;

    @Column({fieldName: 'tag_id', notNull: true})
    tagId: number;

    @Column({default: false, notNull: true})
    deleted: boolean = false;

}
