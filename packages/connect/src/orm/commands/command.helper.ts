import {
    And, Eq, Exists, InnerJoin, isCompOperator, isLogicalOperator, JoinStatement, LeftOuterJoin,
    LogicalOperator, Raw, Select, SelectQuery
} from '@sqb/builder';
import {EntityModel} from '../model/entity-model';
import {isDataProperty, isObjectProperty, isAssociationElement} from '../orm.helper';
import {AssociationNode} from '../model/association-node';

export interface JoinInfo {
    association: AssociationNode;
    sourceEntity: EntityModel;
    targetEntity: EntityModel;
    joinAlias: string;
    join: JoinStatement;
}

export async function joinAssociationGetFirst(joinInfos: JoinInfo[],
                                              association: AssociationNode,
                                              parentAlias: string,
                                              innerJoin?: boolean): Promise<JoinInfo> {
    const joins = await joinAssociation(joinInfos, association, parentAlias, innerJoin);
    return joins[0];
}

export async function joinAssociationGetLast(joinInfos: JoinInfo[],
                                             association: AssociationNode,
                                             parentAlias: string,
                                             innerJoin?: boolean): Promise<JoinInfo> {
    const joins = await joinAssociation(joinInfos, association, parentAlias, innerJoin);
    return joins[joins.length - 1];
}

export async function joinAssociation(joinInfos: JoinInfo[],
                                      association: AssociationNode,
                                      parentAlias: string,
                                      innerJoin?: boolean): Promise<JoinInfo[]> {
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
            join.on(Eq(joinAlias + '.' + targetCol.fieldName,
                Raw(parentAlias + '.' + keyCol.fieldName)))
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
    entityDef: EntityModel,
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
                let _curEntity = entityDef;
                let _curAlias = tableAlias;
                let subSelect: SelectQuery | undefined;
                for (let i = 0; i < l; i++) {
                    pt = itemPath[i];
                    const col = _curEntity.getProperty(pt);
                    if (!col)
                        throw new Error(`Unknown property (${item._expression}) defined in filter`);
                    // if last item on path
                    if (i === l - 1) {
                        if (!isDataProperty(col))
                            throw new Error(`Invalid column expression (${item._expression}) defined in filter`);
                        const ctor = Object.getPrototypeOf(item).constructor;
                        trgOp.add(new ctor(_curAlias + '.' + col.fieldName, item._value));
                    } else {
                        if (isDataProperty(col))
                            throw new Error(`Invalid column (${item._expression}) defined in filter`);
                        if (isObjectProperty(col)) {
                            _curEntity = await col.resolveType();
                            continue;
                        }
                        if (!isAssociationElement(col))
                            throw new Error(`Invalid column (${item._expression}) defined in filter`);

                        let node: AssociationNode | undefined;
                        _curEntity = await col.association.resolveTarget();
                        if (!subSelect) {
                            const keyCol = await col.association.resolveSourceProperty();
                            const targetCol = await col.association.resolveTargetProperty();
                            subSelect = Select(Raw('1'))
                                .from(_curEntity.tableName + ' K');
                            subSelect.where(
                                Eq('K.' + targetCol.fieldName,
                                    Raw(tableAlias + '.' + keyCol.fieldName))
                            )
                            trgOp.add(Exists(subSelect));
                            trgOp = subSelect._where as LogicalOperator;
                            if (col.association.conditions) {
                                await prepareFilter(_curEntity, col.association.conditions, trgOp, 'K');
                            }
                            node = col.association.next;
                            _curAlias = 'K';
                        } else node = col.association;

                        let joinIdx = 1;
                        while (node) {
                            const targetEntity = await node.resolveTarget();
                            const sourceColumn = await node.resolveSourceProperty();
                            const targetColumn = await node.resolveTargetProperty();
                            const joinAlias = 'J' + (joinIdx++);
                            subSelect.join(
                                InnerJoin(targetEntity.tableName + ' ' + joinAlias)
                                    .on(Eq(joinAlias + '.' + targetColumn.fieldName,
                                        Raw(_curAlias + '.' + sourceColumn.fieldName)))
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
