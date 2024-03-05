import { DocumentSchema } from "../DocumentSchema";
import { FieldSchema, ProjectionBuilder } from "../FieldSchema";
import { ObjectSchema } from "../ObjectSchema";
import { Reference, ReferenceFieldProjections, ReferenceFieldSchema } from "./ReferenceFieldSchema";


//type ObjectArrayElementProjections<TElementType> = TElementType extends DocumentSchema<infer TDocumentType> ? ReturnType<ReferenceFieldSchema<TElementType>['createProjections']> : T extends ()=>DocumentSchema<infer TDocumentType> ? ReferenceFieldProjections<TDocumentType> : never;

export class ObjectArrayFieldSchema<TElementTypes extends (ObjectSchema<any> | (()=>ObjectSchema<any>))[]> implements FieldSchema<Reference[], { }>
{
    __type: Reference[] | undefined;

    constructor(readonly elementTypes: TElementTypes) { }

    createProjections(pb: ProjectionBuilder) {
        return {
            map: () => ({}),
        };
    }
}
