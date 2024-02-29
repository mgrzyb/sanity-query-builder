import { testType } from "type-plus";
import { toArray } from "./utils";
import { toObject } from "./utils";

interface FieldSchema<TValueType, TProjections extends Record<string, any>> {
    __type: TValueType | undefined;
    createProjections(pb: ProjectionBuilder): TProjections;
}

interface ObjectSchema<TObjectType extends string> {
    readonly _type: TObjectType;
    readonly fields: Record<string, FieldSchema<any, any>>;
}

interface DocumentSchema<TObjectType extends string> extends ObjectSchema<TObjectType> {
    document: true;
}

type ProjectionsAccessor<TFieldSchema, TProjections> = { [K in keyof TProjections]: TProjections[K] };
type FieldsAccessor<T extends Record<string, FieldSchema<any, any>>> = { [K in keyof T]: FieldProjectionsAccessor<T[K]> };
type FieldProjectionsAccessor<T extends FieldSchema<any, any>> = ProjectionsAccessor<T, ReturnType<T['createProjections']>>;
type ProjectionAccessorFieldSchema<TProjectionAccessor extends ProjectionsAccessor<any, any>> = (TProjectionAccessor extends ProjectionsAccessor<infer TFieldSchema, any> ? TFieldSchema : "never1");

type ProjectionResultSchema<TProjectionResult extends Record<string, ProjectionsAccessor<any, any>>> = { [K in keyof TProjectionResult]: ProjectionAccessorFieldSchema<TProjectionResult[K]> };
class QueryBuilder<TFieldsSchema extends Record<string, FieldSchema<any, any>>> {

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

class ProjectionBuilder {
    constructor(readonly expression: string) {
    }

    toString() {
        return this.expression
    }
}

function createProjectionsAccessor<TFieldSchema extends FieldSchema<any, TProjections>, TProjections extends Record<string, any>>(f: TFieldSchema, pb: ProjectionBuilder): ProjectionsAccessor<TFieldSchema, TProjections> {
    return {
        __field: f,
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

type ValueTypeFromFieldSchema<TFieldSchema extends FieldSchema<any, any>> = TFieldSchema extends FieldSchema<infer T, any> ? T : "never2";

type ExtractValueTypeFromFieldsSchema<TSchema extends Record<string, FieldSchema<any, any>>> = { [K in keyof TSchema]: ValueTypeFromFieldSchema<TSchema[K]> };
type ExtractValueTypeFromObjectSchemaUnion<TSchema extends ObjectSchema<any>> = TSchema extends ObjectSchema<any> ? ExtractValueTypeFromFieldsSchema<TSchema["fields"]> : "never3";

export function from<T extends DocumentSchema<any>>(schema: T) {
    const fieldAccessors = toObject<FieldsAccessor<T["fields"]>>(
        toArray(schema.fields).map(([k, v]) => {
            const pb = new ProjectionBuilder(k);
            return [k, createProjectionsAccessor(v, pb)];
        }));

    return new QueryBuilder<T['fields']>(schema, fieldAccessors);
}


type StringFieldProjections = { toUpper: () => ProjectionsAccessor<StringFieldSchema, StringFieldProjections> };
class StringFieldSchema implements FieldSchema<string, StringFieldProjections> {
    __type: string | undefined;

    createProjections = (pb: ProjectionBuilder) : StringFieldProjections => ({
        toUpper: () => createProjectionsAccessor<StringFieldSchema, StringFieldProjections>(
            F.string(),
            new ProjectionBuilder(`upper(${pb})`))
    })
}

class EnumFieldSchema<TValues extends Record<string, string>> implements FieldSchema<keyof TValues, {}> {

    __type: keyof TValues | undefined;

    constructor(readonly values: TValues) { }

    createProjections(pb: ProjectionBuilder) : {} { return {}; }
}

type ObjectFieldProjections<TObjectType extends string, TFieldsSchema extends Record<string, FieldSchema<any, any>>> =
    {
        pick: <TProjectionResult extends Record<string, ProjectionsAccessor<any, any>>>(projection: (fields: FieldsAccessor<TFieldsSchema> & { _type: ProjectionsAccessor<ObjectTypeFieldSchma<TObjectType>, {}> }) => TProjectionResult) => ProjectionsAccessor<TerminalObjectFieldSchema<ExtractValueTypeFromFieldsSchema<ProjectionResultSchema<TProjectionResult>>>, {}>
    } & { [K in keyof TFieldsSchema]: FieldProjectionsAccessor<TFieldsSchema[K]> }
    ;

class ObjectFieldSchema<TObjectType extends string, TFieldsSchema extends Record<string, FieldSchema<any, any>>> implements FieldSchema<ExtractValueTypeFromFieldsSchema<TFieldsSchema> & { _type: TObjectType }, ObjectFieldProjections<TObjectType, TFieldsSchema>> {

    __type: (ExtractValueTypeFromFieldsSchema<TFieldsSchema> & { _type: TObjectType }) | undefined;

    constructor(readonly objectType: TObjectType, readonly fields: TFieldsSchema) { }

    createProjections(pb: ProjectionBuilder): ObjectFieldProjections<TObjectType, TFieldsSchema> {
        const fieldsArray = [
            ...toArray(this.fields), 
            ["_type", new ObjectTypeFieldSchma<TObjectType>(this.objectType) as any]
        ];
        return {
            ...toObject(fieldsArray.map(
                ([k, v]) => [k, createProjectionsAccessor(v, new ProjectionBuilder(`${pb}.${k}`))])),

            pick: <TProjectionResult extends Record<string, ProjectionsAccessor<any, any>>>(projection: (fields: FieldsAccessor<TFieldsSchema> & { _type: ProjectionsAccessor<ObjectTypeFieldSchma<TObjectType>, {}> }) => TProjectionResult) => {

                const projectionResult = projection(toObject(fieldsArray.map(([k, v]) => [k, createProjectionsAccessor(v, new ProjectionBuilder(k))])));
                const projectionResultsArray = toArray(projectionResult);

                const projectionResultField = new TerminalObjectFieldSchema<ExtractValueTypeFromFieldsSchema<ProjectionResultSchema<TProjectionResult>>>();

                return createProjectionsAccessor<TerminalObjectFieldSchema<ExtractValueTypeFromFieldsSchema<ProjectionResultSchema<TProjectionResult>>>, {}>(
                    projectionResultField,
                    new ProjectionBuilder(`{ ${projectionResultsArray.map(([k, v]) => `"${k}": ${pb}.${v}`).join(', ')} }`));
            }
        }
    }
}

class TerminalObjectFieldSchema<TValueType> {

    __type: TValueType | undefined;

    createProjections(pb: ProjectionBuilder) {
        return {};
    }
}

export type Reference = {
    _ref: string;
    _type: 'reference';
};

type ReferenceFieldProjections<TDocumentTypes extends DocumentSchema<any>[]> = ReturnType<ReferenceFieldSchema<TDocumentTypes>['createProjections']>;

type ResolutionResult<TDocumentTypes extends DocumentSchema<any>[]> = ExtractValueTypeFromObjectSchemaUnion<TDocumentTypes[number]>;

type TypeScpecificProjectionAccessors<TDocumentTypes extends DocumentSchema<any>[]> = { []}
class ReferenceFieldSchema<TDocumentTypes extends DocumentSchema<any>[]> implements FieldSchema<Reference, ReferenceFieldProjections<TDocumentTypes>> {

    __type: Reference | undefined;

    constructor(readonly documentTypes: TDocumentTypes) { }

    createProjections = (pb: ProjectionBuilder) => ({
    
        resolve: () => {
            const resultField = new TerminalObjectFieldSchema<ResolutionResult<TDocumentTypes>>()

            return createProjectionsAccessor(
                resultField,
                new ProjectionBuilder(`${pb}->{...}`));
        },

        pick: <TProjections extends ((fields: FieldsAccessor<TDocumentTypes[number]["fields"]> & { employee: any, externalContributor : any }) => any)[]>(
            ...projections: TProjections
            ) : ReturnType<TProjections[number]> => {
                
                const fields = toObject(toArray(this.documentTypes).map(([k, v]) => [k, createProjectionsAccessor(v, new ProjectionBuilder(k))]));

                for (const p of projections) {
                    const result = p(fields);
                }
                const resultField = new TerminalObjectFieldSchema<ResolutionResult<TDocumentTypes>>()

            return createProjectionsAccessor(
                resultField,
                new ProjectionBuilder(`{...${pb}}`));
         }
    })
}

class ObjectTypeFieldSchma<TObjectType extends string> implements FieldSchema<TObjectType, {}> {
    __type: TObjectType | undefined;
    constructor(readonly objectType: TObjectType) { }
    createProjections = (pb: ProjectionBuilder) => ({})
}

export const F = {
    string: () => new StringFieldSchema(),
    object: <TObjectType extends string, TFieldsSchema extends Record<string, FieldSchema<any, any>>>(type: TObjectType, fields: TFieldsSchema) => new ObjectFieldSchema<TObjectType, TFieldsSchema>(type, fields),
    enum: <TValues extends Record<string, string>>(values: TValues) => new EnumFieldSchema(values),
    reference: <TDocumentTypes extends DocumentSchema<any>[]>(types: TDocumentTypes) => new ReferenceFieldSchema(types)
}
