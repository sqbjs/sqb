import {EntityDefinition} from '../EntityDefinition';
import {Repository} from '../Repository';
import {And, Eq, Exists, isCompOperator, isLogicalOperator, LogicalOperator, Raw, Select} from '@sqb/builder';
import {isDataColumn, isRelationColumn} from '../ColumnDefinition';

export async function prepareFilter(
    entityDef: EntityDefinition,
    filter: Repository.SearchFilter,
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
                    const col = _entityDef.getColumn(pt);
                    if (!col)
                        throw new Error(`Unknown column (${item._expression}) defined in filter`);
                    // if last item on path
                    if (i === l - 1) {
                        if (!isDataColumn(col))
                            throw new Error(`Invalid column (${item._expression}) defined in filter`);
                        const ctor = Object.getPrototypeOf(item).constructor;
                        trgOp.add(new ctor(_tableAlias + '.' + col.fieldName, item._value));
                    } else {
                        if (!isRelationColumn(col))
                            throw new Error(`Invalid column (${item._expression}) defined in filter`);
                        const targetEntity = await col.resolveTarget();
                        const trgAlias = 'E' + (i + 1);
                        const select = Select(Raw('1'))
                            .from(targetEntity.tableName + ' ' + trgAlias);
                        trgOp.add(Exists(select));
                        for (let k = 0; k < col.column.length; k++) {
                            const curCol = col.entity.getDataColumn(col.column[k]);
                            if (!curCol)
                                throw new Error(`Relation column "${col.name}" definition error. ` +
                                    ` ${col.entity.name} has no column "${col.column[k]}"`);
                            const targetCol = targetEntity.getDataColumn(col.targetColumn[k]);
                            if (!targetCol)
                                throw new Error(`Relation column "${col.name}" definition error. ` +
                                    `${targetEntity.name} has no column "${col.targetColumn[k]}"`);
                            select.where(
                                Eq(trgAlias + '.' + targetCol.fieldName, Raw(_tableAlias + '.' + curCol.fieldName))
                            )
                            trgOp = select._where as LogicalOperator;
                        }
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
