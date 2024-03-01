import { ObjectSchema } from "./ObjectSchema";

export interface DocumentSchema<TObjectType extends string> extends ObjectSchema<TObjectType> {
    document: true;
}
