import {Inject} from '@nestjs/common';
import {SqbModuleOptions} from '..';
import {getConnectionToken} from './sqb.utils';

export const InjectConnection: (connection?: SqbModuleOptions | string) =>
    ParameterDecorator = (connection?: SqbModuleOptions | string) =>
    Inject(getConnectionToken(connection));
