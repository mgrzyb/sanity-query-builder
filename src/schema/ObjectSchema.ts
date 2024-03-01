export interface ObjectSchema<TObjectType extends string> {
    readonly _type: TObjectType;
    readonly fields: Record<string, FieldSchema<any, any>>;
}
