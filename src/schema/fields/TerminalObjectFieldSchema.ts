import { ProjectionBuilder } from "../FieldSchema";


export class TerminalObjectFieldSchema<TValueType> {

    __type: TValueType | undefined;

    createProjections(pb: ProjectionBuilder) {
        return {};
    }
}
