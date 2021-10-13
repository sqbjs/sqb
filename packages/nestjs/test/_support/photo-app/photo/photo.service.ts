import {Injectable} from '@nestjs/common';
import {SqbClient} from '@sqb/connect';
import {InjectSQB} from '@sqb/nestjs';
import {Select, Insert} from '@sqb/builder';

@Injectable()
export class PhotoService {
    constructor(
        @InjectSQB('db1')
        private readonly client: SqbClient
    ) {
    }

    async findAll(): Promise<any[]> {
        const x = await this.client.execute(
            Select().from('photos'),
            {objectRows: true});
        return x.rows;
    }

    async create(): Promise<any> {
        const photoEntity = {
            name: 'Nest',
            description: 'Is great!',
            views: 6000
        };
        const x = await this.client.execute(
            Insert('photos', photoEntity)
                .returning('id'),
            {objectRows: true, autoCommit: true});
        if (!(x.rows && x.rows[0]))
            throw new Error('insert failed');
        return photoEntity;
    }
}
