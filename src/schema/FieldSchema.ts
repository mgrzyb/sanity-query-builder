export type ProjectionsAccessor<TFieldSchema, TProjections> = { [K in keyof TProjections]: TProjections[K] };
export type FieldsAccessor<T extends Record<string, FieldSchema<any, any>>> = { [K in keyof T]: FieldProjectionsAccessor<T[K]> };
export type FieldProjectionsAccessor<T extends FieldSchema<any, any>> = ProjectionsAccessor<T, ReturnType<T['createProjections']>>;
export type ProjectionAccessorFieldSchema<TProjectionAccessor extends ProjectionsAccessor<any, any>> = (TProjectionAccessor extends ProjectionsAccessor<infer TFieldSchema, any> ? TFieldSchema : "never1");

export interface FieldSchema<TValueType, TProjections extends Record<string, any>> {
    __type: TValueType | undefined;
    createProjections(pb: ProjectionBuilder): TProjections;
}

export class ProjectionBuilder {
    constructor(readonly expression: string) {
    }

    toString() {
        return this.expression
    }
}
