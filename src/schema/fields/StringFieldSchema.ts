import { FieldSchema, ProjectionBuilder, ProjectionsAccessor } from "../FieldSchema";
import { createProjectionsAccessor } from "../utils";

type StringFieldProjections = { toUpper: () => ProjectionsAccessor<StringFieldSchema, StringFieldProjections> };

export class StringFieldSchema implements FieldSchema<string, StringFieldProjections> {
    __type: string | undefined;

    createProjections = (pb: ProjectionBuilder) : StringFieldProjections => ({
        toUpper: () => createProjectionsAccessor<StringFieldSchema, StringFieldProjections>(
            new StringFieldSchema(),
            new ProjectionBuilder(`upper(${pb})`))
    })
}

