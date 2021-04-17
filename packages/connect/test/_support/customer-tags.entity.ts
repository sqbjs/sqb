import {Entity, FieldName, ForeignKey, NotNull, PrimaryKey} from '@sqb/connect';

@Entity({tableName: 'customer_tags'})
@PrimaryKey(['customerId', 'tagId'], {name: 'pk_customer_tags'})
export class CustomerTag {
    @FieldName('customer_id')
    @ForeignKey(async () => (await import('./customers.entity')).Customer)
    @NotNull
    customerId: number;

    @FieldName('tag_id')
    @NotNull
    tagId: number;

}
