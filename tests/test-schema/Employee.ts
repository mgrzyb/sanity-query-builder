import { F, documentSchema } from "../../src";


export const Employee = documentSchema({
    document: true,
    _type: "person",
    fields: {
        name: F.string(),
        position: F.string()
    }
});
