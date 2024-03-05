import { objectSchema, F } from "../../src";


export const Quote = objectSchema({
    _type: "quote",
    fields: {
        text: F.string(),
        author: F.string()
    }
});
