import {
    And, Eq, Exists, isCompOperator, isLogicalOperator, LeftOuterJoin,
    LogicalOperator, Raw, Select
} from '@sqb/builder';
import {EntityMeta} from '../metadata/entity-meta';
import {isColumnElement, isEmbeddedElement, isRelationElement} from '../helpers';
import {EntityChainRing} from '../metadata/entity-chain-ring';

export async function prepareFilter(
    entityDef: EntityMeta,
    filter: any,
    trgOp: LogicalOperator,
    tableAlias = 'T'): Promise<void> {
    let srcOp: LogicalOperator;
    if (isLogicalOperator(filter))
        srcOp = filter;
    else {
        srcOp = And();
        if (Array.isArray(filter))
            srcOp.add(...filter);
        else srcOp.add(filter);
    }

    for (const item of srcOp._items) {
        if (isLogicalOperator(item)) {
            const ctor = Object.getPrototypeOf(item).constructor;
            const logOp: LogicalOperator = new ctor();
            await prepareFilter(entityDef, item, logOp, tableAlias);
            trgOp.add(logOp);
            continue;
        }
        if (isCompOperator(item)) {
            if (typeof item._expression === 'string') {
                const itemPath = item._expression.split('.');
                const l = itemPath.length;
                let pt: string;
                let _entityDef = entityDef;
                let _tableAlias = tableAlias;
                for (let i = 0; i < l; i++) {
                    pt = itemPath[i];
                    const col = _entityDef.getElement(pt);
                    if (!col)
                        throw new Error(`Unknown column (${item._expression}) defined in filter`);
                    // if last item on path
                    if (i === l - 1) {
                        if (!isColumnElement(col))
                            throw new Error(`Invalid column (${item._expression}) defined in filter`);
                        const ctor = Object.getPrototypeOf(item).constructor;
                        trgOp.add(new ctor(_tableAlias + '.' + col.fieldName, item._value));
                    } else {
                        if (isEmbeddedElement(col)) {
                            _entityDef = await col.resolveType();
                            continue;
                        }
                        if (!isRelationElement(col))
                            throw new Error(`Invalid column (${item._expression}) defined in filter`);
                        const trgAlias = 'E' + (i + 1);
                        let chainRing = col.chain;
                        let targetEntity = await chainRing.resolveTarget();
                        const select = Select(Raw('1'))
                            .from(targetEntity.tableName + ' ' + trgAlias);
                        let joinIdx = 1;
                        let parentAlias = trgAlias;
                        while (chainRing.next) {
                            chainRing = chainRing.next;
                            targetEntity = await chainRing.resolveTarget();
                            const sourceColumn = await chainRing.resolveSourceColumn();
                            const targetColumn = await chainRing.resolveTargetColumn();
                            const joinAlias = 'J' + (joinIdx++);
                            select.join(
                                LeftOuterJoin(targetEntity.tableName + ' ' + joinAlias)
                                    .on(Eq(joinAlias + '.' + targetColumn.fieldName,
                                        Raw(parentAlias + '.' + sourceColumn.fieldName)))
                            )
                            parentAlias = joinAlias;
                        }

                        trgOp.add(Exists(select));
                        const keyCol = await col.chain.resolveSourceColumn();
                        const targetCol = await col.chain.resolveTargetColumn();
                        select.where(
                            Eq(trgAlias + '.' + targetCol.fieldName,
                                Raw(_tableAlias + '.' + keyCol.fieldName))
                        )
                        trgOp = select._where as LogicalOperator;
                        _entityDef = targetEntity;
                        _tableAlias = trgAlias;
                    }
                }
                continue;
            }
        }
        trgOp.add(item);
    }
}
