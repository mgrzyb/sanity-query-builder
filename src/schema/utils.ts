import { FieldSchema, ProjectionBuilder, ProjectionsAccessor } from "./FieldSchema";

export function createProjectionsAccessor<TFieldSchema extends FieldSchema<any, TProjections>, TProjections extends Record<string, any>>(f: TFieldSchema, pb: ProjectionBuilder): ProjectionsAccessor<TFieldSchema, TProjections> {
    return {
        __field: f,
        toString: () => pb.toString(),
        ...f.createProjections(pb)
    };
}