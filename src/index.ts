
// interface FieldSchemaDefinition<T> {
//     name: string;
//     readonly type: T
// }

// interface ObjectSchemaDefinition<Type extends string> {
//     readonly _type: Type;
//     readonly fields: Record<string, FieldSchemaDefinition<any>>;
// }

// type ObjectSchemaFields<T extends ObjectSchemaDefinition<any>> = T['fields'];

// interface DocumentSchemaDefinition<Type extends string> extends ObjectSchemaDefinition<Type> {

// }


// interface ArrayFieldSchemaDefinition<TElementDefinitions extends ObjectSchemaDefinition<any>[], TSchema> extends FieldSchemaDefinition<TSchema> {
//     readonly elements: TElementDefinitions
// }

// interface ReferenceFieldSchemaDefinition<TDocumentDefinitions extends DocumentSchemaDefinition<any>[], TSchema> extends FieldSchemaDefinition<TSchema> {
//     readonly documents: TDocumentDefinitions
// }



// type FieldsSchema<T extends Record<string, FieldSchemaDefinition<any>>> = { [K in keyof T]: T[K]['type'] };
// type ObjectSchema<T extends ObjectSchemaDefinition<any>, TExtraProperties = {}> = T extends ObjectSchemaDefinition<any> ? FieldsSchema<T['fields']> & { _type: T['_type']} & TExtraProperties : never;
// type ArraySchema<T extends ObjectSchemaDefinition<any>> = readonly ObjectSchema<T, { _key: string }>[];

// type Media = Readonly<{ asset: string; alt: string; }>
// type Reference = Readonly<{ _ref: string; _type: string; }>

// const F = {
//     string: function(name: string) : FieldSchemaDefinition<string> {
//         throw new Error("Not implemented");
//     },

//     enum: function <T extends Record<string, string>>(name: string, values: T) : FieldSchemaDefinition<keyof T> {
//         throw new Error("Not implemented");
//     },

//     image: function(name: string) : FieldSchemaDefinition<Media> {
//         throw new Error("Not implemented");
//     },

//     array: function<TOf extends ObjectSchemaDefinition<any>[]>(name: string, of: [...TOf]) : ArrayFieldSchemaDefinition<TOf, ArraySchema<TOf[number]>> {
//         throw new Error("Not implemented");
//     },

//     reference: function<TTo extends DocumentSchemaDefinition<any>[]>(name: string, to: TTo) : ReferenceFieldSchemaDefinition<TTo, Reference> {
//         throw new Error("Not implemented");
//     }
// }

// function imageProjection<TPropertyName extends string>(name: TPropertyName) {
//     return function aaa<T extends ObjectSchemaDefinition<any>, TResult>(qb: QueryBuilder<T, TResult>, [imageField]: [FieldSchemaDefinition<Media>]) {
//         return new QueryBuilder<T, TResult & { [K in TPropertyName]: { foo: string } }>();
//     }
// }

// interface ArrayElementProjection<TElementType extends ObjectSchemaDefinition<any>, TSchema> {
//     elementType: TElementType,
//     schema: TSchema & { _type: TElementType['_type'] }
// }

// type ArrayProjectionsResult<TOf extends ObjectSchemaDefinition<any>, TProjections extends ArrayElementProjection<any, any>[]> = TOf extends TProjections[number]['elementType'] ? TProjections[number]['schema'] : ObjectSchema<TOf>;

// function arrayProjection<TPropertyName extends string, TProjections extends ArrayElementProjection<any, any>[]>(name: TPropertyName, projections: TProjections) {
//     return function aaa<T extends ObjectSchemaDefinition<any>, TOf extends ObjectSchemaDefinition<any>[], TArrayElement, TResult>(qb: QueryBuilder<T, TResult>, [arrayField]: [ArrayFieldSchemaDefinition<TOf, readonly TArrayElement[]>]) {
//         return new QueryBuilder<T, TResult & { [K in TPropertyName]: readonly (ArrayProjectionsResult<TOf[number], TProjections>)[] }>();
//     }    
// }

// type Projection<T extends ObjectSchemaDefinition<any>, TResult, TFields extends any[], TProjectedBuilder> = (qb: QueryBuilder<T, TResult>, f: { [I in keyof TFields]: ObjectSchemaFields<T>[TFields[I]] }) => TProjectedBuilder

// type ReferenceFieldsOnly<T> = { [P in keyof T as T[P] extends ReferenceFieldSchemaDefinition<any, any> ? P : never ]: T[P] };
// type ReferenceFieldDocumentSchema<T> = T extends ReferenceFieldSchemaDefinition<infer TDocumentSchemaDefinition, any> ? ObjectSchema<TDocumentSchemaDefinition[number]> : never;

// class QueryBuilder<T extends ObjectSchemaDefinition<any>, TResult> {
    
//     pick<K extends keyof T['fields']>(...fields: K[]) : QueryBuilder<T, TResult & FieldsSchema<Pick<T['fields'], K>>> {
//         return new QueryBuilder<T, TResult & FieldsSchema<Pick<T['fields'], K>>>();
//     }

//     resolve<K extends keyof ReferenceFieldsOnly<ObjectSchemaFields<T>>>(field: K) : QueryBuilder<T, TResult & { [P in K]: ReferenceFieldDocumentSchema<ReferenceFieldsOnly<ObjectSchemaFields<T>>[K]> }> {
//         throw new Error("Not implemented");
//     }

//     map<TFields extends (keyof ObjectSchemaFields<T>)[], TProjectedBuilder>(fields: [...TFields], projection: Projection<T, TResult, TFields, TProjectedBuilder>) : TProjectedBuilder {
//         throw new Error("Not implemented");
//     }

//     fetch() : readonly TResult[] {
//         throw new Error("Not implemented");    
//     }
// }

// function query<T extends ObjectSchemaDefinition<any>>(schema: T) : QueryBuilder<T, {}>{
//     return new QueryBuilder<T, {}>();
// }





// const Hero = {
//     _type: "hero" as const,
//     fields: {
//         heading: F.string("heading"),
//         image: F.image("image"),
//     }
// }

// class HeroProjection implements ArrayElementProjection<typeof Hero, { foo: string }> {
//     elementType: typeof Hero;
//     schema: { _type: 'hero', foo: string; };
// }

// const TextWithImage = {
//     _type: "textWithImage" as const,
//     fields: {
//         text: F.string("text"),
//         image: F.image("image"),
//     }
// }

// const Category = {
//     _type: "category" as const,
//     fields: {
//         name: F.string("name"),
//         description: F.string("description"),
//     }
// }

// const Person = {
//     _type: "person" as const,
//     fields: {
//         name: F.string("name"),
//         bio: F.string("bio"),
//     }
// }

// function reference<TTo extends DocumentSchemaDefinition<any>[]>(name: string, to: TTo) {

// }

// const Article = {
//     _type: "article" as const,
//     fields: {
//         title: F.string("title"),
//         mainImage: F.image("mainImage"),
//         layout: F.enum("layout", { "DEFAULT": "Default", "FULLWIDTH": "Fullwidth" }),
//         body: F.array("body", [Hero, TextWithImage]),
//         category: F.reference("category", [Category, Person])
//     },
// }

// function foo() {

//     const [article] = query(Article)
//         .pick("title", "body", "layout")
//         .resolve('category')
//         .map(["mainImage"], imageProjection("mainImage"))
//         .map(["body"], arrayProjection("projectedBody", [new HeroProjection()] ))
//         .fetch();

//     article.layout;
//     article.category.name;
    
//     if (article.category._type === "person") {
//         article.category.bio;
//     }
//     if (article.category._type === "category") {
//         article.category.description;
//     }
//     article.body.map(b => b._type === "hero" ? b.image : b._type === "textWithImage" ? b.text : undefined);
//     article.projectedBody.map(b => b._type === "hero" ? b.foo : b._type === "textWithImage" ? b.text : undefined);
// }
