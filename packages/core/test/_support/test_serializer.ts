import {ParamType} from '@sqb/core';

export class TestSerializer {

    dialect: string;
    paramType = ParamType.COLON;

    constructor(config: any) {
        this.dialect = config.dialect;
        if (config.paramType != null)
            this.paramType = config.paramType;
    }

    serialize(ctx, type, o, defFn) {
        return defFn(ctx, o);
    }

    isReservedWord() {
        return false;
    }

}

function createSerializer(config) {
    if (config.dialect === 'test') {
        return new TestSerializer(config);
    }
}

module.exports = {
    createSerializer
};
