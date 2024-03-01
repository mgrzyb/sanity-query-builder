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

export type ReferenceFieldProjections<TDocumentTypes extends DocumentSchema<any>[]> = ReturnType<ReferenceFieldSchema<TDocumentTypes>['createProjections']>;

export type ResolutionResult<TDocumentTypes extends DocumentSchema<any>[]> = ExtractValueTypeFromObjectSchemaUnion<TDocumentTypes[number]>;

type Foo<T extends Record<string, ProjectionsAccessor<any, any>>> = ProjectionsAccessor<
    TerminalObjectFieldSchema<
        (T extends ConditionalProjectionResult<infer TDocumentType, infer TProjectionResult> ?
            never :
            ExtractValueTypeFromFieldsSchema<ProjectionResultSchema<T>>) &
        (T extends ConditionalProjectionResult<infer TDocumentType, infer TProjectionResult> ?
            { _type: TDocumentType["_type"] } & ExtractValueTypeFromFieldsSchema<ProjectionResultSchema<TProjectionResult>> :
            any)>, {}>;

export type PickReferenceResult<TProjections extends (f: any) => any> = Foo<ReturnType<TProjections>>;

export type ConditionalProjectionResult<TDocumentType extends DocumentSchema<any>, TProjections extends Record<string, ProjectionsAccessor<any, any>>> = TProjections & { __type: TDocumentType };

export class ReferenceFieldSchema<TDocumentTypes extends DocumentSchema<any>[]> implements FieldSchema<Reference, ReferenceFieldProjections<TDocumentTypes>> {

    __type: Reference | undefined;

    constructor(readonly documentTypes: TDocumentTypes) { }

    createProjections = (pb: ProjectionBuilder) => ({
        resolve: () => {
            const resultField = new TerminalObjectFieldSchema<ResolutionResult<TDocumentTypes>>();

            return createProjectionsAccessor(
                resultField,
                new ProjectionBuilder(`${pb}->{...}`));
        },

        pick: <TProjections extends ((fields: FieldsAccessor<TDocumentTypes[number]["fields"]> &
        {
            ofType: <T extends DocumentSchema<any>, K extends Record<string, ProjectionsAccessor<any, any>>>(schema: T, projection: (fields: FieldsAccessor<T["fields"]>) => K) => ConditionalProjectionResult<T, K>;
        }) => any)[]>(
            ...projections: TProjections
        ): PickReferenceResult<TProjections[number]> => {

            throw new Error('Not implemented');
            // const fields = toObject(toArray(this.documentTypes).map(([k, v]) => [k, createProjectionsAccessor(v, new ProjectionBuilder(k))]));

            // for (const p of projections) {
            //     const result = p(fields);
            // }
            // const resultField = new TerminalObjectFieldSchema<ResolutionResult<TDocumentTypes>>();

            // return createProjectionsAccessor(
            //     resultField,
            //     new ProjectionBuilder(`{...${pb}}`));
        }
    });
}
