import { F, documentSchema } from "../../src";


export const ExternalContributor = documentSchema({
    document: true,
    _type: "externalContributor",
    fields: {
        name: F.string(),
        company: F.string()
    }
});
