import { F, documentSchema } from "../../src";


export const Category = documentSchema({
    document: true,
    _type: "category",
    fields: {
        name: F.string()
    }
});
