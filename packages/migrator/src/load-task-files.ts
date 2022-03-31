import glob from 'fast-glob';
import fs from 'fs';
import path from 'path';
import {MigrationTask} from './types';

export function loadTaskFiles(pattern: string): MigrationTask[] {
    const out: MigrationTask[] = [];
    const files = glob.sync(pattern.replace(/\\/g, '/'), {absolute: true, onlyFiles: true});
    for (const filename of files) {
        const ext = path.extname(filename).toLowerCase();
        if (ext === '.sql') {
            const script = fs.readFileSync(filename, 'utf-8');
            out.push({
                title: path.basename(filename),
                script
            });
        } else if (ext === '.json') {
            try {
                const json: any = JSON.parse(fs.readFileSync(filename, 'utf-8'));
                if (typeof json === 'object' && json.tableName && json.rows) {
                    if (!json.tableName) { // noinspection ExceptionCaughtLocallyJS
                        throw new Error('"tableName" property does not exists');
                    }
                    json.title = json.title || 'Migrate data into ' + json.tableName;
                    out.push(json);
                }
            } catch (e: any) {
                e.message = e.message + '\n' + filename;
                throw e;
            }

        }
    }
    return out;
}
