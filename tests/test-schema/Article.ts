import { F, documentSchema } from "../../src"
import { ObjectArrayFieldSchema } from "../../src/schema/fields/ObjectArrayFieldSchema"
import { Category } from "./Category"
import { Employee } from "./Employee"
import { ExternalContributor } from "./ExternalContributor"
import { Hero } from "./Hero"
import { Quote } from "./Quote"

const ArticleBase = documentSchema({
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
        author: F.reference([Employee, ExternalContributor]),
        body: F.objectArray([Hero, Quote])
    }
})

type WithExtraFields<T, TFields> = T & { fields: TFields };

export const Article : WithExtraFields<typeof ArticleBase, { relatedArticles: ObjectArrayFieldSchema<[() => typeof Article]> }> = {
    ...ArticleBase, 
    fields: {...ArticleBase.fields, relatedArticles: F.objectArray([()=>Article])}};
