import { FieldSchema, ProjectionBuilder } from "../FieldSchema";

export class EnumFieldSchema<TValues extends Record<string, string>> implements FieldSchema<keyof TValues, {}> {

    __type: keyof TValues | undefined;

    constructor(readonly values: TValues) { }

    createProjections(pb: ProjectionBuilder): {} { return {}; }
}
