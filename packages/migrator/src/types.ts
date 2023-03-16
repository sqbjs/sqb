export type MigrationsThunk = (string | Migration)[] |
    (() => (string | Migration)[]) |
    (() => Promise<(string | Migration)[]>);

export interface MigrationPackage {
    description: string;
    informationTableName?: string;
    migrations: MigrationsThunk | ((string | Migration)[]);
}

export interface SchemaOptions {
    schema: string;
    owner: string;
    tablespace: string;
    currentVersion: number;
    targetVersion: number;
}

export interface Migration {
    backup?: boolean;
    version: number;
    tasks: string[] | MigrationTask[];
}

export type MigrationTaskFunction = (connection: any) => void | Promise<void>;
export type MigrationTask = SqlScriptMigrationTask | CustomMigrationTask | InsertDataMigrationTask;

export interface BaseMigrationTask {
    title: string;
}

export interface SqlScriptMigrationTask extends BaseMigrationTask {
    title: string;
    script: string;
}

export interface CustomMigrationTask extends BaseMigrationTask {
    title: string;
    fn: MigrationTaskFunction;
}

export interface InsertDataMigrationTask extends BaseMigrationTask {
    title: string;
    tableName: string;
    rows: Record<string, any>[];
}
