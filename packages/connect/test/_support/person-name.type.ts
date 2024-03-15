import { Column } from '@sqb/connect';

export class PersonName {
  @Column({fieldName: 'given_name'})
  given?: string;

  @Column({fieldName: 'family_name'})
  family?: string;
}
