import { objectSchema, F, documentSchema } from "../src"

export const Hero = objectSchema({
    _type: "hero",
    fields: {
        heading: F.string()
    }
})

export const Category = documentSchema({
    document: true,
    _type: "category",
    fields: {
        name: F.string()
    }
})

export const Employee = documentSchema({
    document: true,
    _type: "person",
    fields: {
        name: F.string(),
        position: F.string()
    }
})

export const ExternalContributor = documentSchema({
    document: true,
    _type: "externalContributor",
    fields: {
        name: F.string(),
        company: F.string()
    }
})

export const Article = documentSchema({
    document: true,
    _type: "article",
    fields: {
        title: F.string(),
        link: F.object('link', {
            label: F.string(),
            url: F.string(),
            target: F.enum({ "BLANK": "_blank", "SELF": "_self" }),
        }),
        category: F.reference([Category]),
        author: F.reference([Employee, ExternalContributor])
    }
})
