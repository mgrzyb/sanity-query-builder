import { FieldSchema, ProjectionBuilder } from "../FieldSchema";


export class ObjectTypeFieldSchema<TObjectType extends string> implements FieldSchema<TObjectType, {}> {
    __type: TObjectType | undefined;
    constructor(readonly objectType: TObjectType) { }
    createProjections = (pb: ProjectionBuilder) => ({});
}
