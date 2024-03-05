import { testType } from "type-plus";
import { from } from "../../src";
import { QueryResultType } from "../utils";
import { Article } from "../test-schema/Article";
import { Reference } from "../../src/schema/fields/ReferenceFieldSchema";
import { ExtractValueTypeFromFieldsSchema } from "../../src/schema/fields/ObjectFieldSchema";

describe('Object arrays', () => {

    test('Pick the whole array', () => {
        const q = from(Article).pick(a => ({
            relatedArticles: a.relatedArticles,
        }));
        testType.strictCanAssign<QueryResultType<typeof q>, { relatedArticles: Reference[] }>(true);
        expect(q.toString()).toBe('*[_type == "article"] { "relatedArticles": relatedArticles }')
    })

    test('Map references', () => {
        // const q = from(Article).pick(a => ({
        //     relatedArticles: a.relatedArticles.map(r => r.resolve()),
        // }));
        // testType.strictCanAssign<QueryResultType<typeof q>, { relatedArticles: ExtractValueTypeFromFieldsSchema<typeof Article["fields"]> }>(true);
        // expect(q.toString()).toBe('*[_type == "article"] { "relatedArticles": relatedArticles[]->{...} }')
    })
    
    test('Pick from referenced elements', () => {
        // const q = from(Article).pick(a => ({
        //     relatedTitles: a.relatedArticles.map(r => r.pick(a => ({ a.title}))),
        // }));
        // testType.strictCanAssign<QueryResultType<typeof q>, { relatedTitles: string[] }>(true);
        // expect(q.toString()).toBe('*[_type == "article"] { "relatedTitles": relatedArticles[]->{ "title": title} }')
    })    
    
    test('Pick from object elements', () => {
        // const q = from(Article).pick(a => ({
        //     body: a.body.map(
        //         e => e.ofType(Hero, h => ({ title: h.title })),
        //         e => e.ofType(Quote, q => ({ 
        //             text: q.text,
        //             author: q.author
        //          }))),
        // }));
        // testType.strictCanAssign<QueryResultType<typeof q>, { body: {_type: 'hero', title: string} | {_type: 'quote', text: string, author: string} }>(true);
        // expect(q.toString()).toBe(`*[_type == "article"] { "body": body[] { _type=='hero' => { _type, "title": title }, _type=='quote' => { _type, "text": text, "author": author } } }`)
    })        
})