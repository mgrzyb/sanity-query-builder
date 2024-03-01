import { testType } from "type-plus";
import { from } from "../../src";
import { Article } from "../TestSchema";
import { ExpandRecursively, QueryResultType } from "../utils";

describe('Objects', () => {

    test('Pick the whole object', () => {
        const q = from(Article).pick(a => ({
            link: a.link,
        }));
        testType.strictCanAssign<QueryResultType<typeof q>, { link: { url: string, label: string, target: 'BLANK' | 'SELF', _type: 'link' } }>(true);
        expect(q.toString()).toBe('*[_type == "article"] { "link": link }')
    })

    test('Pick single property', () => {
        const q = from(Article).pick(a => ({
            linkUrl: a.link.url,
        }));
        testType.equal<QueryResultType<typeof q>, { linkUrl: string }>(true);
        expect(q.toString()).toBe('*[_type == "article"] { "linkUrl": link.url }')
    })

    test('Individual fields can be picked from objects', () => {
        const q = from(Article).pick(a => ({
            link: a.link.pick(l => ({
                _type: l._type,
                url: l.url,
            })),
        }))
        testType.equal<QueryResultType<typeof q>, { link: { url: string, _type: 'link' } }>(true);
        expect(q.toString()).toBe('*[_type == "article"] { "link": { "_type": link._type, "url": link.url } }')
    })

    test('Individual fields can be picked from objects', () => {
        const q = from(Article).pick(a => ({
            link: a.link.pick(l => ({ url: l.url })),
        }));
        testType.equal<QueryResultType<typeof q>, { link: { url: string } }>(true);
        expect(q.toString()).toBe('*[_type == "article"] { "link": { "url": link.url } }')
    })

    test('Furhter projections can be applied to object fields', () => {
        const q = from(Article).pick(a => ({
            link: a.link.pick(l => ({ url: l.url.toUpper() })),
        }));
        testType.equal<QueryResultType<typeof q>, { link: { url: string } }>(true);
        expect(q.toString()).toBe('*[_type == "article"] { "link": { "url": upper(link.url) } }')
    })
})