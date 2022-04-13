import {
    And, Eq, Exists, Field, InnerJoin, isCompOperator, isLogicalOperator, JoinStatement, LeftOuterJoin,
    LogicalOperator, Raw, Select, SelectQuery
} from '@sqb/builder';
import {AssociationNode} from '../model/association-node';
import {EmbeddedElementMetadata} from '../model/embedded-element-metadata';
import {EntityMetadata} from '../model/entity-metadata';
import {isAssociationElement, isColumnElement, isEmbeddedElement} from '../util/orm.helper';

export interface JoinInfo {
    association: AssociationNode;
    sourceEntity: EntityMetadata;
    targetEntity: EntityMetadata;
    joinAlias: string;
    join: JoinStatement;
}

export async function joinAssociationGetFirst(
    joinInfos: JoinInfo[],
    association: AssociationNode,
    parentAlias: string,
    innerJoin?: boolean
): Promise<JoinInfo> {
    const joins = await joinAssociation(joinInfos, association, parentAlias, innerJoin);
    return joins[0];
}

export async function joinAssociationGetLast(
    joinInfos: JoinInfo[],
    association: AssociationNode,
    parentAlias: string,
    innerJoin?: boolean
): Promise<JoinInfo> {
    const joins = await joinAssociation(joinInfos, association, parentAlias, innerJoin);
    return joins[joins.length - 1];
}

export async function joinAssociation(
    joinInfos: JoinInfo[],
    association: AssociationNode,
    parentAlias: string,
    innerJoin?: boolean
): Promise<JoinInfo[]> {
    let joinInfo: JoinInfo | undefined;
    let node = association;
    const result: JoinInfo[] = [];
    while (node) {
        joinInfo = joinInfos.find(j => j.association === node);
        if (!joinInfo) {
            const targetEntity = await node.resolveTarget();
            const sourceEntity = await node.resolveSource();
            const keyCol = await node.resolveSourceProperty();
            const targetCol = await node.resolveTargetProperty();

            const joinAlias = 'J' + (joinInfos.length + 1);
            const join = innerJoin ? InnerJoin(targetEntity.tableName + ' as ' + joinAlias) :
                LeftOuterJoin(targetEntity.tableName + ' as ' + joinAlias);
            join.on(Eq(Field(joinAlias + '.' + targetCol.fieldName, targetCol.dataType, targetCol.isArray),
                Field(parentAlias + '.' + keyCol.fieldName, keyCol.dataType, keyCol.isArray)))
            if (node.conditions)
                await prepareFilter(targetEntity, node.conditions, join._conditions, joinAlias);

            joinInfo = {
                association: node,
                sourceEntity,
                targetEntity,
                joinAlias,
                join
            }
            joinInfos.push(joinInfo);
        }
        result.push(joinInfo);
        if (!node.next)
            break;
        parentAlias = joinInfo.joinAlias;
        node = node.next;
    }
    return result;
}

export async function prepareFilter(
    entityDef: EntityMetadata,
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
            if (typeof item._left === 'string') {
                const itemPath = item._left.split('.');
                const l = itemPath.length;
                let pt: string;
                let _curEntity = entityDef;
                let _curAlias = tableAlias;
                let _curPrefix = '';
                let _curSuffix = '';
                let subSelect: SelectQuery | undefined;
                for (let i = 0; i < l; i++) {
                    pt = itemPath[i];
                    const col = EntityMetadata.getElement(_curEntity, pt);
                    if (!col)
                        throw new Error(`Unknown property (${item._left}) defined in filter`);
                    // if last item on path
                    if (i === l - 1) {
                        if (!isColumnElement(col))
                            throw new Error(`Invalid column expression (${item._left}) defined in filter`);
                        const ctor = Object.getPrototypeOf(item).constructor;
                        trgOp.add(new ctor(Field(_curAlias + '.' + _curPrefix + col.fieldName + _curSuffix, col.dataType, col.isArray), item._right));
                    } else {
                        if (isColumnElement(col))
                            throw new Error(`Invalid column (${item._left}) defined in filter`);
                        if (isEmbeddedElement(col)) {
                            _curEntity = await EmbeddedElementMetadata.resolveType(col);
                            _curPrefix = _curPrefix + (col.fieldNamePrefix || '');
                            _curSuffix = (col.fieldNameSuffix || '') + _curSuffix;
                            continue;
                        }
                        if (!isAssociationElement(col))
                            throw new Error(`Invalid column (${item._left}) defined in filter`);

                        let node: AssociationNode | undefined;
                        _curEntity = await col.association.resolveTarget();
                        if (!subSelect) {
                            const keyCol = await col.association.resolveSourceProperty();
                            const targetCol = await col.association.resolveTargetProperty();
                            subSelect = Select(Raw('1'))
                                .from(_curEntity.tableName + ' K');

                            subSelect.where(
                                Eq(
                                    Field('K.' + targetCol.fieldName, targetCol.dataType, targetCol.isArray),
                                    Field(tableAlias + '.' + keyCol.fieldName, keyCol.dataType, keyCol.isArray))
                            )
                            trgOp.add(Exists(subSelect));
                            trgOp = subSelect._where as LogicalOperator;
                            if (col.association.conditions) {
                                await prepareFilter(_curEntity, col.association.conditions, trgOp, 'K');
                            }
                            node = col.association.next;
                            _curAlias = 'K';
                        } else node = col.association;

                        while (node) {
                            const targetEntity = await node.resolveTarget();
                            const sourceColumn = await node.resolveSourceProperty();
                            const targetColumn = await node.resolveTargetProperty();
                            const joinAlias = 'J' + (((subSelect?._joins?.length) || 0) + 1);
                            subSelect.join(
                                InnerJoin(targetEntity.tableName + ' ' + joinAlias)
                                    .on(Eq(Field(joinAlias + '.' + targetColumn.fieldName, targetColumn.dataType, targetColumn.isArray),
                                        Field(_curAlias + '.' + sourceColumn.fieldName, sourceColumn.dataType, sourceColumn.isArray)))
                            )
                            _curEntity = targetEntity;
                            _curAlias = joinAlias;
                            node = node.next;
                        }
                    }
                }
                continue;
            }
        }
        trgOp.add(item);
    }
}
