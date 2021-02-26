import {Column, Default, Entity, Enum, FieldName, ForeignKey, PrimaryKey} from '@sqb/connect';

@Entity({tableName: 'customer_tags'})
@PrimaryKey(['customerId', 'tag'], {name: 'pk_customer_tags'})
export class CustomerTag {
    @FieldName('customer_id')
    @ForeignKey(async () => (await import('./customers.entity')).Customer)
    customerId: number;

    @Column()
    tag: string;

    @Column()
    @Default(true)
    active: boolean;

    @Column()
    @Enum(['red', 'green', 'blue', 'yellow', 'brown', 'white'])
    @Default((obj) => {
        if (obj.tag === 'small')
            return 'yellow'
        if (obj.tag === 'generous')
            return 'green'
        if (obj.tag === 'large')
            return 'orange'
        if (obj.tag === 'stingy')
            return 'red'
    })
    color: string;

}
