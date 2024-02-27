import { toArray } from "./utils";
import { toObject } from "./utils";

interface FieldSchema<TValueType, TProjections extends Record<string, any>> {
    createProjections(pb: ProjectionBuilder<any>): TProjections;
}

type FieldProjectionsAccessor<T extends FieldSchema<any, any>> = ProjectionBuilderAccessor<ReturnType<T['createProjections']>>;

class StringFieldSchema implements FieldSchema<string, { toUpper: () => FieldProjectionsAccessor<StringFieldSchema> }> {
    createProjections = (pb: ProjectionBuilder<string>) => ({
        toUpper: () => createProjectionBuilderAccessor(
            F.string(), 
            new ProjectionBuilder(`${pb}.toUpper()`, F.string()))
    })
}

interface ObjectSchema<TObjectType extends string> {
    readonly _type: TObjectType;
    readonly fields: Record<string, FieldSchema<any, any>>;
}

interface DocumentSchema<TObjectType extends string> extends ObjectSchema<TObjectType> {
    document: true;
}

type ProjectionBuilderAccessor<TProjections> = { [K in keyof TProjections]: TProjections[K] };
type FieldsAccessor<T extends Record<string, FieldSchema<any, any>>> = { [K in keyof T]: ProjectionBuilderAccessor<ReturnType<T[K]['createProjections']>> };

class QueryBuilder<TObjectSchema extends ObjectSchema<any>> {

    private readonly fields: FieldsAccessor<TObjectSchema['fields']>;
    private readonly projections: Record<string, ProjectionBuilderAccessor<any>>[] = [];

    constructor(private schema: TObjectSchema) {
        this.fields = toObject<FieldsAccessor<TObjectSchema['fields']>>(
            toArray(schema.fields).map(([k, v]) => {
                const pb = new ProjectionBuilder(k, v);
                return [k, createProjectionBuilderAccessor(v, pb)];
            }));
    }

    pick(projection: (fields: FieldsAccessor<TObjectSchema['fields']>) => Record<string, ProjectionBuilderAccessor<any>>) {
        this.projections.push(projection(this.fields));
        return this;
    }

    toString() {

        const foo = this.projections.flatMap(p => toArray(p)).map(([k, v]) => `"${k}": ${v}`).join(',');
        return `*[_type == "${this.schema._type}"] { ${foo} }`
    }
}

class ProjectionBuilder<TExpressionType> {
    constructor(readonly expression: string, expressionSchema: FieldSchema<TExpressionType, any>) {
    }

    toString() {
        return this.expression
    }
}

function createProjectionBuilderAccessor<TProjections extends Record<string, any>>(f: FieldSchema<any, TProjections>, pb: ProjectionBuilder<TProjections>): ProjectionBuilderAccessor<TProjections> {
    return {
        toString: () => pb.toString(),
        ...f.createProjections(pb)
    };
}

export function objectSchema<TObjectType extends string, TObjectSchema extends ObjectSchema<TObjectType>>(s: TObjectSchema): TObjectSchema {
    return s;
}

export function documentSchema<TDocumentType extends string, TDocumentSchema extends DocumentSchema<TDocumentType>>(s: TDocumentSchema): TDocumentSchema {
    return s;
}

export function from<T extends DocumentSchema<any>>(documentSchema: T) {
    return new QueryBuilder<T>(documentSchema);
}

export const F = {
    string: () => new StringFieldSchema()
    reference: (schema: ObjectSchema<any>) => new ReferenceFieldSchema(schema)
}