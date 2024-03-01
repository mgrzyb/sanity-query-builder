import { toArray } from "./utils";
import { toObject } from "./utils";
import { ObjectSchema } from "./schema/ObjectSchema";
import { FieldSchema, FieldsAccessor, ProjectionsAccessor } from "./schema/FieldSchema";
import { ProjectionResultSchema, ExtractValueTypeFromFieldsSchema } from "./schema/fields/ObjectFieldSchema";

export class QueryBuilder<TFieldsSchema extends Record<string, FieldSchema<any, any>>> {

    constructor(private readonly rootSchema: ObjectSchema<any>, private readonly fieldAccessors: FieldsAccessor<TFieldsSchema>) {
    }

    pick<TProjectionResult extends Record<string, ProjectionsAccessor<any, any>>>(projection: (fields: FieldsAccessor<TFieldsSchema>) => TProjectionResult) {
        const projectionResult = projection(this.fieldAccessors);
        return new QueryBuilder<ProjectionResultSchema<TProjectionResult>>(
            this.rootSchema,
            toObject(toArray(projectionResult).map(([k, v]) => [k, v])));
    }

    fetch(): readonly ExtractValueTypeFromFieldsSchema<TFieldsSchema>[] {
        throw new Error('Not implemented');
    }

    toString() {
        const projections = toArray(this.fieldAccessors).map(([k, v]) => `"${k}": ${v}`).join(', ');
        return `*[_type == "${this.rootSchema._type}"] { ${projections} }`
    }
}



