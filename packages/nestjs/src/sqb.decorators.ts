import {Inject} from '@nestjs/common';
import {getSQBToken} from './sqb.utils';

export const InjectSQB: (name?: string) =>
    ParameterDecorator = (name?: string) =>
    Inject(getSQBToken(name));
