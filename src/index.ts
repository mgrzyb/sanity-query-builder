import { QueryBuilder } from "./QueryBuilder";
import { DocumentSchema } from "./schema/DocumentSchema";
import { FieldsAccessor, ProjectionBuilder } from "./schema/FieldSchema";
import { createProjectionsAccessor } from "./schema/utils";
import { toArray, toObject } from "./utils";

export * from './schema';

export function from<T extends DocumentSchema<any>>(schema: T) {
    const fieldAccessors = toObject<FieldsAccessor<T["fields"]>>(
        toArray(schema.fields).map(([k, v]) => {
            const pb = new ProjectionBuilder(k);
            return [k, createProjectionsAccessor(v, pb)];
        }));

    return new QueryBuilder<T['fields']>(schema, fieldAccessors);
}