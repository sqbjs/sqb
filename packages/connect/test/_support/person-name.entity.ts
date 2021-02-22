import {FieldName} from '@sqb/connect';

export class PersonName {
    @FieldName('given_name')
    given?: string;

    @FieldName('family_name')
    family?: string;
}
