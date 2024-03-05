import { objectSchema, F } from "../../src";


export const Hero = objectSchema({
    _type: "hero",
    fields: {
        heading: F.string()
    }
});


