import { FieldSchema, FieldsAccessor, ProjectionBuilder, ProjectionsAccessor } from "../FieldSchema";
import { createProjectionsAccessor } from "../utils";
import { TerminalObjectFieldSchema } from "./TerminalObjectFieldSchema";
import { toObject, toArray } from "../../utils";
import { DocumentSchema } from "../DocumentSchema";
import { ExtractValueTypeFromFieldsSchema, ExtractValueTypeFromObjectSchemaUnion, ProjectionResultSchema } from "./ObjectFieldSchema";

export type Reference = {
    _ref: string;
    _type: 'reference';
};

export type ReferenceFieldProjections<TDocumentTypes extends DocumentSchema<any>> = ReturnType<ReferenceFieldSchema<TDocumentTypes>['createProjections']>;

export type ResolutionResult<TDocumentTypes extends DocumentSchema<any>> = ExtractValueTypeFromObjectSchemaUnion<TDocumentTypes>;

type ValueTypeFromProjectionResult<T extends Record<string, ProjectionsAccessor<any, any>>> = 
    (T extends ConditionalProjectionResult<infer TDocumentType, infer TProjectionResult> ? never : ExtractValueTypeFromFieldsSchema<ProjectionResultSchema<T>>) & 
    (T extends ConditionalProjectionResult<infer TDocumentType, infer TProjectionResult> ? { _type: TDocumentType["_type"]; } & ExtractValueTypeFromFieldsSchema<ProjectionResultSchema<TProjectionResult>> : {});

type ProjectionAccessorFromProjectionResults<T extends Record<string, ProjectionsAccessor<any, any>>> = ProjectionsAccessor<TerminalObjectFieldSchema<ValueTypeFromProjectionResult<T>>, {}>;

export type PickReferenceResult<TProjections extends (f: any) => any> = ProjectionAccessorFromProjectionResults<ReturnType<TProjections>>;

export type ConditionalProjectionResult<TDocumentType extends DocumentSchema<any>, TProjectionResult extends Record<string, ProjectionsAccessor<any, any>>> = TProjectionResult & { __type: TDocumentType } & ProjectionAccessorFromProjectionResults<TProjectionResult>;

type OfTypeFunction<TDocumentTypes extends DocumentSchema<any>> = {
    ofType: <T extends TDocumentTypes, K extends Record<string, ProjectionsAccessor<any, any>>>(schema: T, projection: (fields: FieldsAccessor<T["fields"]>) => K) => ConditionalProjectionResult<T, K>;
};

export class ReferenceFieldSchema<TDocumentTypes extends DocumentSchema<any>> implements FieldSchema<Reference, ReferenceFieldProjections<TDocumentTypes>> {

    __type: Reference | undefined;

    constructor(readonly documentTypes: TDocumentTypes[]) { }

    createProjections = (pb: ProjectionBuilder) => ({
        resolve: () => {
            const resultField = new TerminalObjectFieldSchema<ResolutionResult<TDocumentTypes>>();

            return createProjectionsAccessor(
                resultField,
                new ProjectionBuilder(`${pb}->{...}`));
        },

        pick: <TProjections extends ((fields: FieldsAccessor<TDocumentTypes["fields"]> & OfTypeFunction<TDocumentTypes>) => any)[]>(...projections: TProjections): PickReferenceResult<TProjections[number]> => {

            const fields = toObject(this.documentTypes.flatMap(d => toArray(d.fields)).map(([k, v]) => [k, createProjectionsAccessor(v, new ProjectionBuilder(k))]));
            fields.ofType = (schema : DocumentSchema<any>, projection: (f:any)=>any) => { 
                const f = toObject(toArray(schema.fields).map(([k, v]) => [k, createProjectionsAccessor(v, new ProjectionBuilder(k))]));
                const r = projection(f);
                return { ...r, __type:schema, toString: () => `_type == '${schema._type}' => { ${toArray(r).map(([k, v]) => `"${k}": ${v}`).join(', ')} }` }
            }

            let commonResult = {} as any;
            let typedResults = {} as any;

            for (const p of projections) {
                const result = p(fields as any);
                const { __type, ...rest } = result;
                if (__type) {
                    typedResults[result.__type._type] = rest;
                } else {
                    commonResult = {...commonResult, ...rest };
                }
            }
            
            const resultField = new TerminalObjectFieldSchema<ValueTypeFromProjectionResult<ReturnType<TProjections[number]>>>();

            const typedResultsArray = toArray(typedResults);
            const a = []
            
            if (typedResultsArray.length > 0) a.push(`_type`);
            
            a.push(toArray(commonResult).map(([k, v]) => `"${k}": ${v}`).join(', '))

            if (typedResultsArray.length > 0)
                a.push(typedResultsArray.map(([k, v]) => v).join(', '));            

            return createProjectionsAccessor(
                resultField,
                new ProjectionBuilder(`${pb}->{ ${a.join(', ')} }`));
        }
    });
}

