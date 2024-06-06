import { Column } from '@sqb/connect';

export class Address {
  @Column()
  city: string;

  @Column()
  street: string;

  @Column({ fieldName: 'zip_code' })
  zipCode: string;
}
