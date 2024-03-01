import { toArray, toObject } from "../../utils";
import { FieldProjectionsAccessor, FieldSchema, FieldsAccessor, ProjectionAccessorFieldSchema, ProjectionBuilder, ProjectionsAccessor } from "../FieldSchema";
import { ObjectSchema } from "../ObjectSchema";
import { createProjectionsAccessor } from "../utils";
import { ObjectTypeFieldSchema } from "./ObjectTypeFieldSchma";
import { TerminalObjectFieldSchema } from "./TerminalObjectFieldSchema";

export type ProjectionResultSchema<TProjectionResult extends Record<string, ProjectionsAccessor<any, any>>> = { [K in keyof TProjectionResult]: ProjectionAccessorFieldSchema<TProjectionResult[K]> };
export type ExtractValueTypeFromFieldsSchema<TSchema extends Record<string, FieldSchema<any, any>>> = { [K in keyof TSchema]: ValueTypeFromFieldSchema<TSchema[K]> };
export type ValueTypeFromFieldSchema<TFieldSchema extends FieldSchema<any, any>> = TFieldSchema extends FieldSchema<infer T, any> ? T : "never2";
export type ExtractValueTypeFromObjectSchemaUnion<TSchema extends ObjectSchema<any>> = TSchema extends ObjectSchema<any> ? ExtractValueTypeFromFieldsSchema<TSchema["fields"]> & { _type: TSchema["_type"] }: "never3";

type ObjectFieldProjections<TObjectType extends string, TFieldsSchema extends Record<string, FieldSchema<any, any>>> =
    {
        pick: <TProjectionResult extends Record<string, ProjectionsAccessor<any, any>>>(projection: (fields: FieldsAccessor<TFieldsSchema> & { _type: ProjectionsAccessor<ObjectTypeFieldSchema<TObjectType>, {}> }) => TProjectionResult) => ProjectionsAccessor<TerminalObjectFieldSchema<ExtractValueTypeFromFieldsSchema<ProjectionResultSchema<TProjectionResult>>>, {}>
    } & { [K in keyof TFieldsSchema]: FieldProjectionsAccessor<TFieldsSchema[K]> }
    ;

export class ObjectFieldSchema<TObjectType extends string, TFieldsSchema extends Record<string, FieldSchema<any, any>>> implements FieldSchema<ExtractValueTypeFromFieldsSchema<TFieldsSchema> & { _type: TObjectType; }, ObjectFieldProjections<TObjectType, TFieldsSchema>> {

    __type: (ExtractValueTypeFromFieldsSchema<TFieldsSchema> & { _type: TObjectType; }) | undefined;

    constructor(readonly objectType: TObjectType, readonly fields: TFieldsSchema) { }

    createProjections(pb: ProjectionBuilder): ObjectFieldProjections<TObjectType, TFieldsSchema> {
        const fieldsArray = [
            ...toArray(this.fields),
            ["_type", new ObjectTypeFieldSchema<TObjectType>(this.objectType) as any]
        ];
        return {
            ...toObject(fieldsArray.map(
                ([k, v]) => [k, createProjectionsAccessor(v, new ProjectionBuilder(`${pb}.${k}`))])),

            pick: <TProjectionResult extends Record<string, ProjectionsAccessor<any, any>>>(projection: (fields: FieldsAccessor<TFieldsSchema> & { _type: ProjectionsAccessor<ObjectTypeFieldSchema<TObjectType>, {}>; }) => TProjectionResult) => {

                const projectionResult = projection(toObject(fieldsArray.map(([k, v]) => [k, createProjectionsAccessor(v, new ProjectionBuilder(`${pb}.${k}`))])));
                const projectionResultsArray = toArray(projectionResult);

                const projectionResultField = new TerminalObjectFieldSchema<ExtractValueTypeFromFieldsSchema<ProjectionResultSchema<TProjectionResult>>>();

                return createProjectionsAccessor<TerminalObjectFieldSchema<ExtractValueTypeFromFieldsSchema<ProjectionResultSchema<TProjectionResult>>>, {}>(
                    projectionResultField,
                    new ProjectionBuilder(`{ ${projectionResultsArray.map(([k, v]) => `"${k}": ${v}`).join(', ')} }`));
            }
        };
    }
}
