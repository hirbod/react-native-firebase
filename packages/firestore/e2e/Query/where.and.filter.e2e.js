/*
 * Copyright (c) 2016-present Invertase Limited & Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this library except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
const COLLECTION = 'firestore';
const { wipe } = require('../helpers');
const { Filter } = firestoreModular;

describe(' firestore().collection().where(AND Filters)', function () {
  beforeEach(async function () {
    return await wipe();
  });

  describe('v8 compatibility', function () {
    beforeEach(async function beforeEachTest() {
      // @ts-ignore
      globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;
    });

    afterEach(async function afterEachTest() {
      // @ts-ignore
      globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = false;
    });

    it('throws if fieldPath string is invalid', function () {
      try {
        firebase
          .firestore()
          .collection(COLLECTION)
          .where(Filter.and(Filter('.foo.bar', '==', 1), Filter('.foo.bar', '==', 1)));

        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql("'fieldPath' Invalid field path");
        return Promise.resolve();
      }
    });

    it('throws if operator string is invalid', function () {
      try {
        firebase
          .firestore()
          .collection(COLLECTION)
          .where(Filter.and(Filter('foo.bar', '!', 1), Filter('foo.bar', '!', 1)));

        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql("'opStr' is invalid");
        return Promise.resolve();
      }
    });

    it('throws if query contains multiple array-contains', function () {
      try {
        firebase
          .firestore()
          .collection(COLLECTION)
          .where(
            Filter.and(
              Filter('foo.bar', 'array-contains', 1),
              Filter('foo.bar', 'array-contains', 1),
            ),
          );

        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql('Queries only support a single array-contains filter');
        return Promise.resolve();
      }
    });

    it('throws if value is not defined', function () {
      try {
        firebase
          .firestore()
          .collection(COLLECTION)
          .where(
            Filter.and(Filter('foo.bar', 'array-contains'), Filter('foo.bar', 'array-contains')),
          );
        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql("'value' argument expected");
        return Promise.resolve();
      }
    });

    it('throws if null value and no equal operator', function () {
      try {
        firebase
          .firestore()
          .collection(COLLECTION)
          .where(
            Filter.and(Filter('foo.bar', '==', null), Filter('foo.bar', 'array-contains', null)),
          );

        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql('You can only perform equals comparisons on null');
        return Promise.resolve();
      }
    });

    it('allows null to be used with equal operator', function () {
      firebase
        .firestore()
        .collection(COLLECTION)
        .where(Filter.and(Filter('foo.bar', '==', null), Filter('foo.bar', '==', null)));
    });

    it('allows null to be used with not equal operator', function () {
      firebase
        .firestore()
        .collection(COLLECTION)
        .where(Filter.and(Filter('foo.bar', '==', null), Filter('foo.bar', '!=', null)));
    });

    it('allows multiple inequalities (excluding `!=`) on different paths provided', async function () {
      const colRef = firebase
        .firestore()
        .collection(`${COLLECTION}/filter/different-path-inequality-filter`);
      const expected = { foo: { bar: 300 }, bar: 200 };
      await Promise.all([
        colRef.add({ foo: { bar: 1 }, bar: 1 }),
        colRef.add(expected),
        colRef.add(expected),
      ]);

      const snapshot = await colRef
        .where(Filter.and(Filter('foo.bar', '>', 123), Filter('bar', '>', 123)))
        .get();

      snapshot.size.should.eql(2);
      snapshot.forEach(s => {
        s.data().should.eql(jet.contextify(expected));
      });
    });

    it('allows inequality on the same path', async function () {
      await firebase
        .firestore()
        .collection(COLLECTION)
        .where(
          Filter.and(
            Filter('foo.bar', '>', 123),
            Filter(new firebase.firestore.FieldPath('foo', 'bar'), '>', 1234),
          ),
        );
    });

    it('throws if in query with no array value', function () {
      try {
        firebase
          .firestore()
          .collection(COLLECTION)
          .where(Filter.and(Filter('foo.bar', 'in', '123'), Filter('foo.bar', 'in', '123')));

        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql('A non-empty array is required');
        return Promise.resolve();
      }
    });

    it('throws if array-contains-any query with no array value', function () {
      try {
        firebase
          .firestore()
          .collection(COLLECTION)
          .where(
            Filter.and(
              Filter('foo.bar', 'array-contains-any', '123'),
              Filter('foo.bar', 'array-contains-any', '123'),
            ),
          );

        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql('A non-empty array is required');
        return Promise.resolve();
      }
    });

    it('throws if in query array length is greater than 30', function () {
      try {
        const queryArray = Array.from({ length: 31 }, (_, i) => i + 1);

        firebase
          .firestore()
          .collection(COLLECTION)
          .where(
            Filter.and(Filter('foo.bar', 'in', queryArray), Filter('foo.bar', 'in', queryArray)),
          );

        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql('maximum of 10 elements in the value');
        return Promise.resolve();
      }
    });

    it('throws if query has multiple array-contains-any filter', function () {
      try {
        firebase
          .firestore()
          .collection(COLLECTION)
          .where(
            Filter.and(
              Filter('foo.bar', 'array-contains-any', [1]),
              Filter('foo.bar', 'array-contains-any', [1]),
            ),
          );

        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql("You cannot use more than one 'array-contains-any' filter");
        return Promise.resolve();
      }
    });

    it("should throw error when using 'not-in' operator twice", async function () {
      const ref = firebase.firestore().collection(COLLECTION);

      try {
        ref.where(Filter.and(Filter('foo.bar', 'not-in', [1]), Filter('foo.bar', 'not-in', [2])));
        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql("You cannot use more than one 'not-in' filter.");
        return Promise.resolve();
      }
    });

    it("should throw error when combining 'not-in' operator with '!=' operator", async function () {
      const ref = firebase.firestore().collection(COLLECTION);

      try {
        ref.where(Filter.and(Filter('foo.bar', '!=', [1]), Filter('foo.bar', 'not-in', [2])));
        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql(
          "You cannot use 'not-in' filters with '!=' inequality filters",
        );
        return Promise.resolve();
      }
    });

    it("should throw error when combining 'not-in' operator with 'in' operator", async function () {
      const ref = firebase.firestore().collection(COLLECTION);

      try {
        ref.where(Filter.and(Filter('foo.bar', 'in', [1]), Filter('foo.bar', 'not-in', [2])));
        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql("You cannot use 'not-in' filters with 'in' filters.");
        return Promise.resolve();
      }
    });

    it("should throw error when combining 'not-in' operator with 'array-contains-any' operator", async function () {
      const ref = firebase.firestore().collection(COLLECTION);

      try {
        ref.where(
          Filter.and(
            Filter('foo.bar', 'array-contains-any', [1]),
            Filter('foo.bar', 'not-in', [2]),
          ),
        );

        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql(
          "You cannot use 'not-in' filters with 'array-contains-any' filters.",
        );
        return Promise.resolve();
      }
    });

    it("should throw error when 'not-in' filter has a list of more than 10 items", async function () {
      const ref = firebase.firestore().collection(COLLECTION);

      try {
        ref.where(
          Filter.and(
            Filter('foo.bar', '==', 1),
            Filter('foo.bar', 'not-in', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]),
          ),
        );

        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql(
          'filters support a maximum of 10 elements in the value array.',
        );
        return Promise.resolve();
      }
    });

    it('should throw an error if you use a FieldPath on a filter in conjunction with an orderBy() parameter that is not FieldPath', async function () {
      try {
        firebase
          .firestore()
          .collection(COLLECTION)
          .where(
            Filter.and(
              Filter(firebase.firestore.FieldPath.documentId(), '==', ['document-id']),
              Filter('foo.bar', 'not-in', [1, 2, 3, 4]),
            ),
          )
          .orderBy('differentOrderBy', 'desc');

        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql("'FirestoreFieldPath' cannot be used in conjunction");
        return Promise.resolve();
      }
    });

    it("should throw error when using '!=' operator twice ", async function () {
      const ref = firebase.firestore().collection(COLLECTION);

      try {
        ref.where(Filter.and(Filter('foo.bar', '!=', 1), Filter('foo.baz', '!=', 2)));
        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql("You cannot use more than one '!=' inequality filter.");
        return Promise.resolve();
      }
    });

    it("should allow query when combining '!=' operator with any other inequality operator on a different field", async function () {
      const colRef = firebase
        .firestore()
        .collection(`${COLLECTION}/filter/inequality-combine-not-equal`);
      const expected = { foo: { bar: 300 }, bar: 200 };
      await Promise.all([
        colRef.add({ foo: { bar: 1 }, bar: 1 }),
        colRef.add(expected),
        colRef.add(expected),
      ]);

      const snapshot = await colRef
        .where(Filter.and(Filter('foo.bar', '>', 123), Filter('bar', '!=', 123)))
        .get();
      snapshot.size.should.eql(2);
      snapshot.forEach(s => {
        s.data().should.eql(jet.contextify(expected));
      });
    });

    /* Queries */
    // Equals and another filter: '==', '>', '>=', '<', '<=', '!='
    it('returns with where "==" & "==" filter', async function () {
      const colRef = firebase.firestore().collection(`${COLLECTION}/filter/equals`);

      const expected = { foo: 'bar', bar: 'baz' };
      await Promise.all([
        colRef.add({ foo: [1, '1', 'something'] }),
        colRef.add(expected),
        colRef.add(expected),
      ]);

      const snapshot = await colRef
        .where(Filter.and(Filter('foo', '==', 'bar'), Filter('bar', '==', 'baz')))
        .get();

      snapshot.size.should.eql(2);
      snapshot.forEach(s => {
        s.data().should.eql(jet.contextify(expected));
      });
    });

    it('returns with where "==" & "!=" filter', async function () {
      const colRef = firebase.firestore().collection(`${COLLECTION}/filter/equals`);

      const expected = { foo: 'bar', baz: 'baz' };
      const notExpected = { foo: 'bar', baz: 'something' };
      await Promise.all([colRef.add(notExpected), colRef.add(expected), colRef.add(expected)]);

      const snapshot = await colRef
        .where(Filter.and(Filter('foo', '==', 'bar'), Filter('baz', '!=', 'something')))
        .get();

      snapshot.size.should.eql(2);
      snapshot.forEach(s => {
        s.data().should.eql(jet.contextify(expected));
      });
    });

    it('returns with where "==" & ">" filter', async function () {
      const colRef = firebase.firestore().collection(`${COLLECTION}/filter/equals`);

      const expected = { foo: 'bar', population: 200 };
      const notExpected = { foo: 'bar', population: 1 };
      await Promise.all([colRef.add(notExpected), colRef.add(expected), colRef.add(expected)]);

      const snapshot = await colRef
        .where(Filter.and(Filter('foo', '==', 'bar'), Filter('population', '>', 2)))
        .get();

      snapshot.size.should.eql(2);
      snapshot.forEach(s => {
        s.data().should.eql(jet.contextify(expected));
      });
    });

    it('returns with where "==" & "<" filter', async function () {
      const colRef = firebase.firestore().collection(`${COLLECTION}/filter/equals`);

      const expected = { foo: 'bar', population: 200 };
      const notExpected = { foo: 'bar', population: 1000 };
      await Promise.all([colRef.add(notExpected), colRef.add(expected), colRef.add(expected)]);

      const snapshot = await colRef
        .where(Filter.and(Filter('foo', '==', 'bar'), Filter('population', '<', 201)))
        .get();

      snapshot.size.should.eql(2);
      snapshot.forEach(s => {
        s.data().should.eql(jet.contextify(expected));
      });
    });

    it('returns with where "==" & "<=" filter', async function () {
      const colRef = firebase.firestore().collection(`${COLLECTION}/filter/equals`);

      const expected = { foo: 'bar', population: 200 };
      const notExpected = { foo: 'bar', population: 1000 };
      await Promise.all([colRef.add(notExpected), colRef.add(expected), colRef.add(expected)]);

      const snapshot = await colRef
        .where(Filter.and(Filter('foo', '==', 'bar'), Filter('population', '<=', 200)))
        .get();

      snapshot.size.should.eql(2);
      snapshot.forEach(s => {
        s.data().should.eql(jet.contextify(expected));
      });
    });

    it('returns with where "==" & ">=" filter', async function () {
      const colRef = firebase.firestore().collection(`${COLLECTION}/filter/equals`);

      const expected = { foo: 'bar', population: 200 };
      const notExpected = { foo: 'bar', population: 100 };
      await Promise.all([colRef.add(notExpected), colRef.add(expected), colRef.add(expected)]);

      const snapshot = await colRef
        .where(Filter.and(Filter('foo', '==', 'bar'), Filter('population', '>=', 200)))
        .get();

      snapshot.size.should.eql(2);
      snapshot.forEach(s => {
        s.data().should.eql(jet.contextify(expected));
      });
    });

    // Filters using single "array-contains", "array-contains-any", "not-in" and "in" filters
    it('returns with where "array-contains" filter', async function () {
      const colRef = firebase.firestore().collection(`${COLLECTION}/filter/array-contains`);

      const expected = [101, 102];
      const data = { foo: expected };

      await Promise.all([colRef.add({ foo: [1, 2, 3] }), colRef.add(data), colRef.add(data)]);

      const snapshot = await colRef.where(Filter('foo', 'array-contains', 101)).get();

      snapshot.size.should.eql(2);
      snapshot.forEach(s => {
        s.data().foo.should.eql(jet.contextify(expected));
      });
    });

    it('returns with where "array-contains-any" filter', async function () {
      const colRef = firebase.firestore().collection(`${COLLECTION}/filter/array-contains-any`);
      const expected = [101, 102, 103, 104];
      const data = { foo: expected };

      await Promise.all([colRef.add({ foo: [1, 2, 3] }), colRef.add(data), colRef.add(data)]);

      const snapshot = await colRef.where(Filter('foo', 'array-contains-any', [120, 101])).get();

      snapshot.size.should.eql(2);
      snapshot.forEach(s => {
        s.data().foo.should.eql(jet.contextify(expected));
      });
    });

    it('returns with where "not-in" filter', async function () {
      const colRef = firebase.firestore().collection(`${COLLECTION}/filter/not-in`);
      const expected = 'bar';
      const data = { foo: expected };

      await Promise.all([
        colRef.add({ foo: 'not' }),
        colRef.add({ foo: 'this' }),
        colRef.add(data),
        colRef.add(data),
      ]);

      const snapshot = await colRef.where(Filter('foo', 'not-in', ['not', 'this'])).get();

      snapshot.size.should.eql(2);
      snapshot.forEach(s => {
        s.data().foo.should.eql(jet.contextify(expected));
      });
    });

    it('returns with where "in" filter', async function () {
      const colRef = firebase.firestore().collection(`${COLLECTION}/filter/in`);
      const expected1 = 'bar';
      const expected2 = 'baz';
      const data1 = { foo: expected1 };
      const data2 = { foo: expected2 };

      await Promise.all([
        colRef.add({ foo: 'not' }),
        colRef.add({ foo: 'this' }),
        colRef.add(data1),
        colRef.add(data2),
      ]);

      const snapshot = await colRef
        .where(Filter('foo', 'in', [expected1, expected2]))
        .orderBy('foo')
        .get();

      snapshot.size.should.eql(2);
      snapshot.docs[0].data().foo.should.eql(expected1);
      snapshot.docs[1].data().foo.should.eql(expected2);
    });

    // Using AND query combinations with Equals && "array-contains", "array-contains-any", "not-in" and "in" filters
    it('returns with where "==" & "array-contains" filter', async function () {
      const colRef = firebase.firestore().collection(`${COLLECTION}/filter/equals`);

      const match = Date.now();
      await Promise.all([
        colRef.add({ foo: [1, '1', match] }),
        colRef.add({ foo: [1, '2', match.toString()], bar: 'baz' }),
        colRef.add({ foo: [1, '2', match.toString()], bar: 'baz' }),
      ]);

      const snapshot = await colRef
        .where(
          Filter.and(Filter('foo', 'array-contains', match.toString()), Filter('bar', '==', 'baz')),
        )
        .get();
      const expected = [1, '2', match.toString()];

      snapshot.size.should.eql(2);
      snapshot.forEach(s => {
        s.data().foo.should.eql(jet.contextify(expected));
      });
    });

    it('returns with where "==" & "array-contains-any" filter', async function () {
      const colRef = firebase.firestore().collection(`${COLLECTION}/filter/equals`);

      const match = Date.now();
      await Promise.all([
        colRef.add({ foo: [1, '1', match] }),
        colRef.add({ foo: [1, '2'], bar: 'baz' }),
        colRef.add({ foo: ['2', match.toString()], bar: 'baz' }),
      ]);

      const snapshot = await colRef
        .where(
          Filter.and(
            Filter('foo', 'array-contains-any', [match.toString(), 1]),
            Filter('bar', '==', 'baz'),
          ),
        )
        .get();

      snapshot.size.should.eql(2);
      snapshot.docs[0].data().bar.should.equal('baz');
      snapshot.docs[1].data().bar.should.equal('baz');
    });

    it('returns with where "==" & "not-in" filter', async function () {
      const colRef = firebase.firestore().collection(`${COLLECTION}/filter/not-in`);

      await Promise.all([
        colRef.add({ foo: 'bar', bar: 'baz' }),
        colRef.add({ foo: 'thing', bar: 'baz' }),
        colRef.add({ foo: 'bar', bar: 'baz' }),
        colRef.add({ foo: 'yolo', bar: 'baz' }),
      ]);

      const snapshot = await colRef
        .where(Filter.and(Filter('foo', 'not-in', ['yolo', 'thing']), Filter('bar', '==', 'baz')))
        .get();

      snapshot.size.should.eql(2);
      snapshot.docs[0].data().foo.should.equal('bar');
      snapshot.docs[1].data().foo.should.equal('bar');
    });

    it('returns with where "==" & "in" filter', async function () {
      const colRef = firebase.firestore().collection(`${COLLECTION}/filter/in`);

      await Promise.all([
        colRef.add({ foo: 'bar', bar: 'baz' }),
        colRef.add({ foo: 'thing', bar: 'baz' }),
        colRef.add({ foo: 'yolo', bar: 'baz' }),
      ]);

      const snapshot = await colRef
        .where(Filter.and(Filter('foo', 'in', ['bar', 'yolo']), Filter('bar', '==', 'baz')))
        .orderBy('foo')
        .get();

      snapshot.size.should.eql(2);
      snapshot.docs[0].data().foo.should.equal('bar');
      snapshot.docs[1].data().foo.should.equal('yolo');
    });

    // Special Filter queries
    it('returns when combining greater than and lesser than on the same nested field', async function () {
      const colRef = firebase.firestore().collection(`${COLLECTION}/filter/greaterandless`);

      await Promise.all([
        colRef.doc('doc1').set({ foo: { bar: 1 } }),
        colRef.doc('doc2').set({ foo: { bar: 2 } }),
        colRef.doc('doc3').set({ foo: { bar: 3 } }),
      ]);

      const snapshot = await colRef
        .where(Filter.and(Filter('foo.bar', '>', 1), Filter('foo.bar', '<', 3)))
        .get();

      snapshot.size.should.eql(1);
    });

    it('returns when combining greater than and lesser than on the same nested field using FieldPath', async function () {
      const colRef = firebase.firestore().collection(`${COLLECTION}/filter/greaterandless`);

      await Promise.all([
        colRef.doc('doc1').set({ foo: { bar: 1 } }),
        colRef.doc('doc2').set({ foo: { bar: 2 } }),
        colRef.doc('doc3').set({ foo: { bar: 3 } }),
      ]);

      const snapshot = await colRef
        .where(Filter.and(Filter('foo.bar', '>', 1), Filter('foo.bar', '<', 3)))
        .orderBy(new firebase.firestore.FieldPath('foo', 'bar'))
        .get();

      snapshot.size.should.eql(1);
    });

    it('returns with a FieldPath', async function () {
      const colRef = firebase
        .firestore()
        .collection(`${COLLECTION}/filter/where-fieldpath${Date.now() + ''}`);
      const fieldPath = new firebase.firestore.FieldPath('map', 'foo.bar@gmail.com');

      await colRef.add({
        map: {
          'foo.bar@gmail.com': true,
        },
      });
      await colRef.add({
        map: {
          'bar.foo@gmail.com': true,
        },
      });

      const snapshot = await colRef.where(Filter(fieldPath, '==', true)).get();
      snapshot.size.should.eql(1); // 2nd record should only be returned once
      const data = snapshot.docs[0].data();
      should.equal(data.map['foo.bar@gmail.com'], true);
    });
  });

  describe('modular', function () {
    it('throws if fieldPath string is invalid', function () {
      const { getFirestore, collection, query, and, where } = firestoreModular;
      try {
        query(
          collection(getFirestore(), COLLECTION),
          and(where('.foo.bar', '==', 1), where('.foo.bar', '==', 1)),
        );
        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql("'fieldPath' Invalid field path");
        return Promise.resolve();
      }
    });

    it('throws if operator string is invalid', function () {
      const { getFirestore, collection, query, and, where } = firestoreModular;
      try {
        query(
          collection(getFirestore(), COLLECTION),
          and(where('foo.bar', '!', 1), where('foo.bar', '!', 1)),
        );

        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql("'opStr' is invalid");
        return Promise.resolve();
      }
    });

    it('throws if query contains multiple array-contains', function () {
      const { getFirestore, collection, query, and, where } = firestoreModular;
      try {
        query(
          collection(getFirestore(), COLLECTION),
          and(where('foo.bar', 'array-contains', 1), where('foo.bar', 'array-contains', 1)),
        );

        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql('Queries only support a single array-contains filter');
        return Promise.resolve();
      }
    });

    it('throws if value is not defined', function () {
      const { getFirestore, collection, query, and, where } = firestoreModular;
      try {
        query(
          collection(getFirestore(), COLLECTION),
          and(where('foo.bar', 'array-contains'), where('foo.bar', 'array-contains')),
        );
        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql("'value' argument expected");
        return Promise.resolve();
      }
    });

    it('throws if null value and no equal operator', function () {
      const { getFirestore, collection, query, and, where } = firestoreModular;
      try {
        query(
          collection(getFirestore(), COLLECTION),
          and(where('foo.bar', '==', null), where('foo.bar', 'array-contains', null)),
        );

        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql('You can only perform equals comparisons on null');
        return Promise.resolve();
      }
    });

    it('allows null to be used with equal operator', function () {
      const { getFirestore, collection, query, and, where } = firestoreModular;
      query(
        collection(getFirestore(), COLLECTION),
        and(where('foo.bar', '==', null), where('foo.bar', '==', null)),
      );
    });

    it('allows null to be used with not equal operator', function () {
      const { getFirestore, collection, query, and, where } = firestoreModular;
      query(
        collection(getFirestore(), COLLECTION),
        and(where('foo.bar', '==', null), where('foo.bar', '!=', null)),
      );
    });

    it('allows multiple inequalities (excluding `!=`) on different paths provided', async function () {
      const { getFirestore, addDoc, collection, query, and, where } = firestoreModular;
      const colRef = collection(getFirestore(), `${COLLECTION}/filter/different-path-inequality`);

      const expected = { foo: { bar: 300 }, bar: 200 };
      await Promise.all([
        addDoc(colRef, { foo: { bar: 1 }, bar: 1 }),
        addDoc(colRef, expected),
        addDoc(colRef, expected),
      ]);

      const snapshot = await query(
        colRef,
        and(where('foo.bar', '>', 123), where('bar', '>', 123)),
      ).get();

      snapshot.size.should.eql(2);
      snapshot.forEach(s => {
        s.data().should.eql(jet.contextify(expected));
      });
    });

    it('allows inequality on the same path', function () {
      const { getFirestore, collection, query, and, where, FieldPath } = firestoreModular;
      query(
        collection(getFirestore(), COLLECTION),
        and(where('foo.bar', '>', 123), where(new FieldPath('foo', 'bar'), '>', 1234)),
      );
    });

    it('throws if in query with no array value', function () {
      const { getFirestore, collection, query, and, where } = firestoreModular;
      try {
        query(
          collection(getFirestore(), COLLECTION),
          and(where('foo.bar', 'in', '123'), where('foo.bar', 'in', '123')),
        );

        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql('A non-empty array is required');
        return Promise.resolve();
      }
    });

    it('throws if array-contains-any query with no array value', function () {
      const { getFirestore, collection, query, and, where } = firestoreModular;
      try {
        query(
          collection(getFirestore(), COLLECTION),
          and(
            where('foo.bar', 'array-contains-any', '123'),
            where('foo.bar', 'array-contains-any', '123'),
          ),
        );

        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql('A non-empty array is required');
        return Promise.resolve();
      }
    });

    it('throws if in query array length is greater than 30', function () {
      const { getFirestore, collection, query, and, where } = firestoreModular;
      const queryArray = Array.from({ length: 31 }, (_, i) => i + 1);

      try {
        query(
          collection(getFirestore(), COLLECTION),
          and(where('foo.bar', 'in', queryArray), where('foo.bar', 'in', queryArray)),
        );

        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql('maximum of 10 elements in the value');
        return Promise.resolve();
      }
    });

    it('throws if query has multiple array-contains-any filter', function () {
      const { getFirestore, collection, query, and, where } = firestoreModular;
      try {
        query(
          collection(getFirestore(), COLLECTION),
          and(
            where('foo.bar', 'array-contains-any', [1]),
            where('foo.bar', 'array-contains-any', [1]),
          ),
        );

        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql("You cannot use more than one 'array-contains-any' filter");
        return Promise.resolve();
      }
    });

    it("should throw error when using 'not-in' operator twice", async function () {
      const { getFirestore, collection, query, where, and } = firestoreModular;
      const ref = collection(getFirestore(), COLLECTION);

      try {
        query(ref, and(where('foo.bar', 'not-in', [1]), where('foo.bar', 'not-in', [2])));
        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql("You cannot use more than one 'not-in' filter.");
        return Promise.resolve();
      }
    });

    it("should throw error when combining 'not-in' operator with '!=' operator", async function () {
      const { getFirestore, collection, query, where, and } = firestoreModular;
      const ref = collection(getFirestore(), COLLECTION);

      try {
        query(ref, and(where('foo.bar', '!=', [1]), where('foo.bar', 'not-in', [2])));
        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql(
          "You cannot use 'not-in' filters with '!=' inequality filters",
        );
        return Promise.resolve();
      }
    });

    it("should throw error when combining 'not-in' operator with 'in' operator", async function () {
      const { getFirestore, collection, query, where, and } = firestoreModular;
      const ref = collection(getFirestore(), COLLECTION);

      try {
        query(ref, and(where('foo.bar', 'in', [1]), where('foo.bar', 'not-in', [2])));
        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql("You cannot use 'not-in' filters with 'in' filters.");
        return Promise.resolve();
      }
    });

    it("should throw error when combining 'not-in' operator with 'array-contains-any' operator", async function () {
      const { getFirestore, collection, query, where, and } = firestoreModular;
      const ref = collection(getFirestore(), COLLECTION);

      try {
        query(
          ref,
          and(where('foo.bar', 'array-contains-any', [1]), where('foo.bar', 'not-in', [2])),
        );

        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql(
          "You cannot use 'not-in' filters with 'array-contains-any' filters.",
        );
        return Promise.resolve();
      }
    });

    it("should throw error when 'not-in' filter has a list of more than 10 items", async function () {
      const { getFirestore, collection, query, where, and } = firestoreModular;
      const ref = collection(getFirestore(), COLLECTION);

      try {
        query(
          ref,
          and(
            where('foo.bar', '==', 1),
            where('foo.bar', 'not-in', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]),
          ),
        );

        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql(
          'filters support a maximum of 10 elements in the value array.',
        );
        return Promise.resolve();
      }
    });

    it('should throw an error if you use a FieldPath on a filter in conjunction with an orderBy() parameter that is not FieldPath', async function () {
      const { getFirestore, collection, query, where, and, orderBy, FieldPath } = firestoreModular;
      try {
        query(
          collection(getFirestore(), COLLECTION),
          and(
            where(FieldPath.documentId(), '==', ['document-id']),
            where('foo.bar', 'not-in', [1, 2, 3, 4]),
          ),
          orderBy('differentOrderBy', 'desc'),
        );

        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql("'FirestoreFieldPath' cannot be used in conjunction");
        return Promise.resolve();
      }
    });

    it("should throw error when using '!=' operator twice ", async function () {
      const { getFirestore, collection, query, where, and } = firestoreModular;
      const ref = collection(getFirestore(), COLLECTION);

      try {
        query(ref, and(where('foo.bar', '!=', 1), where('foo.baz', '!=', 2)));
        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql("You cannot use more than one '!=' inequality filter.");
        return Promise.resolve();
      }
    });

    it("should allow query when combining '!=' operator with any other inequality operator on a different field", async function () {
      const { getFirestore, addDoc, collection, query, where, and } = firestoreModular;
      const colRef = collection(
        getFirestore(),
        `${COLLECTION}/filter/inequality-combine-not-equal`,
      );
      const expected = { foo: { bar: 300 }, bar: 200 };
      await Promise.all([
        addDoc(colRef, { foo: { bar: 1 }, bar: 1 }),
        addDoc(colRef, expected),
        addDoc(colRef, expected),
      ]);

      const snapshot = await query(
        colRef,
        and(where('foo.bar', '>', 123), where('bar', '!=', 123)),
      ).get();
      snapshot.size.should.eql(2);
      snapshot.forEach(s => {
        s.data().should.eql(jet.contextify(expected));
      });
    });

    /* Queries */
    // Equals and another filter: '==', '>', '>=', '<', '<=', '!='
    it('returns with where "==" & "==" filter', async function () {
      const { getFirestore, collection, addDoc, getDocs, query, where, and } = firestoreModular;
      const colRef = collection(getFirestore(), `${COLLECTION}/filter/equals`);

      const expected = { foo: 'bar', bar: 'baz' };
      await Promise.all([
        addDoc(colRef, { foo: [1, '1', 'something'] }),
        addDoc(colRef, expected),
        addDoc(colRef, expected),
      ]);

      const snapshot = await getDocs(
        query(colRef, and(where('foo', '==', 'bar'), where('bar', '==', 'baz'))),
      );

      snapshot.size.should.eql(2);
      snapshot.forEach(s => {
        s.data().should.eql(jet.contextify(expected));
      });
    });

    it('returns with where "==" & "!=" filter', async function () {
      const { getFirestore, collection, addDoc, getDocs, query, where, and } = firestoreModular;
      const colRef = collection(getFirestore(), `${COLLECTION}/filter/equals`);

      const expected = { foo: 'bar', baz: 'baz' };
      const notExpected = { foo: 'bar', baz: 'something' };
      await Promise.all([
        addDoc(colRef, notExpected),
        addDoc(colRef, expected),
        addDoc(colRef, expected),
      ]);

      const snapshot = await getDocs(
        query(colRef, and(where('foo', '==', 'bar'), where('baz', '!=', 'something'))),
      );

      snapshot.size.should.eql(2);
      snapshot.forEach(s => {
        s.data().should.eql(jet.contextify(expected));
      });
    });

    it('returns with single where "==" in or filter', async function () {
      const { getFirestore, collection, addDoc, getDocs, query, where, and } = firestoreModular;
      const colRef = collection(getFirestore(), `${COLLECTION}/filter/single-or`);

      const expected = { foo: 'bar', baz: 'baz' };
      const notExpected = { foo: 'bar', baz: 'something' };
      await Promise.all([
        addDoc(colRef, notExpected),
        addDoc(colRef, expected),
        addDoc(colRef, expected),
      ]);

      const snapshot = await getDocs(query(colRef, and(where('baz', '==', 'baz'))));

      snapshot.size.should.eql(2);
      snapshot.forEach(s => {
        s.data().should.eql(jet.contextify(expected));
      });
    });

    it('returns with single where "==" in and filter', async function () {
      const { getFirestore, collection, addDoc, getDocs, query, where, or } = firestoreModular;
      const colRef = collection(getFirestore(), `${COLLECTION}/filter/single-and`);

      const expected = { foo: 'bar', baz: 'baz' };
      const notExpected = { foo: 'bar', baz: 'something' };
      await Promise.all([
        addDoc(colRef, notExpected),
        addDoc(colRef, expected),
        addDoc(colRef, expected),
      ]);

      const snapshot = await getDocs(query(colRef, or(where('baz', '==', 'baz'))));

      snapshot.size.should.eql(2);
      snapshot.forEach(s => {
        s.data().should.eql(jet.contextify(expected));
      });
    });

    it('returns with where "==" & ">" filter', async function () {
      const { getFirestore, collection, addDoc, getDocs, query, where, and } = firestoreModular;
      const colRef = collection(getFirestore(), `${COLLECTION}/filter/equals`);

      const expected = { foo: 'bar', population: 200 };
      const notExpected = { foo: 'bar', population: 1 };
      await Promise.all([
        addDoc(colRef, notExpected),
        addDoc(colRef, expected),
        addDoc(colRef, expected),
      ]);

      const snapshot = await getDocs(
        query(colRef, and(where('foo', '==', 'bar'), where('population', '>', 2))),
      );

      snapshot.size.should.eql(2);
      snapshot.forEach(s => {
        s.data().should.eql(jet.contextify(expected));
      });
    });

    it('returns with where "==" & "<" filter', async function () {
      const { getFirestore, collection, addDoc, getDocs, query, where, and } = firestoreModular;
      const colRef = collection(getFirestore(), `${COLLECTION}/filter/equals`);

      const expected = { foo: 'bar', population: 200 };
      const notExpected = { foo: 'bar', population: 1000 };
      await Promise.all([
        addDoc(colRef, notExpected),
        addDoc(colRef, expected),
        addDoc(colRef, expected),
      ]);

      const snapshot = await getDocs(
        query(colRef, and(where('foo', '==', 'bar'), where('population', '<', 201))),
      );

      snapshot.size.should.eql(2);
      snapshot.forEach(s => {
        s.data().should.eql(jet.contextify(expected));
      });
    });

    it('returns with where "==" & "<=" filter', async function () {
      const { getFirestore, collection, addDoc, getDocs, query, where, and } = firestoreModular;
      const colRef = collection(getFirestore(), `${COLLECTION}/filter/equals`);

      const expected = { foo: 'bar', population: 200 };
      const notExpected = { foo: 'bar', population: 1000 };
      await Promise.all([
        addDoc(colRef, notExpected),
        addDoc(colRef, expected),
        addDoc(colRef, expected),
      ]);

      const snapshot = await getDocs(
        query(colRef, and(where('foo', '==', 'bar'), where('population', '<=', 200))),
      );

      snapshot.size.should.eql(2);
      snapshot.forEach(s => {
        s.data().should.eql(jet.contextify(expected));
      });
    });

    it('returns with where "==" & ">=" filter', async function () {
      const { getFirestore, collection, addDoc, getDocs, query, where, and } = firestoreModular;
      const colRef = collection(getFirestore(), `${COLLECTION}/filter/equals`);

      const expected = { foo: 'bar', population: 200 };
      const notExpected = { foo: 'bar', population: 100 };
      await Promise.all([
        addDoc(colRef, notExpected),
        addDoc(colRef, expected),
        addDoc(colRef, expected),
      ]);

      const snapshot = await getDocs(
        query(colRef, and(where('foo', '==', 'bar'), where('population', '>=', 200))),
      );

      snapshot.size.should.eql(2);
      snapshot.forEach(s => {
        s.data().should.eql(jet.contextify(expected));
      });
    });

    // Filters using single "array-contains", "array-contains-any", "not-in" and "in" filters
    it('returns with where "array-contains" filter', async function () {
      const { getFirestore, collection, addDoc, getDocs, query, where } = firestoreModular;
      const colRef = collection(getFirestore(), `${COLLECTION}/filter/array-contains-modular`);

      const expected = [101, 102];
      const data = { foo: expected };

      await Promise.all([
        addDoc(colRef, { foo: [1, 2, 3] }),
        addDoc(colRef, data),
        addDoc(colRef, data),
      ]);

      const snapshot = await getDocs(query(colRef, where('foo', 'array-contains', 101)));

      snapshot.size.should.eql(2);
      snapshot.forEach(s => {
        s.data().foo.should.eql(jet.contextify(expected));
      });
    });

    it('returns with where "array-contains-any" filter', async function () {
      const { getFirestore, collection, addDoc, getDocs, query, where } = firestoreModular;
      const colRef = collection(getFirestore(), `${COLLECTION}/filter/array-contains-any-modular`);
      const expected = [101, 102, 103, 104];
      const data = { foo: expected };

      await Promise.all([
        addDoc(colRef, { foo: [1, 2, 3] }),
        addDoc(colRef, data),
        addDoc(colRef, data),
      ]);

      const snapshot = await getDocs(query(colRef, where('foo', 'array-contains-any', [120, 101])));

      snapshot.size.should.eql(2);
      snapshot.forEach(s => {
        s.data().foo.should.eql(jet.contextify(expected));
      });
    });

    it('returns with where "not-in" filter', async function () {
      const { getFirestore, collection, addDoc, getDocs, query, where } = firestoreModular;
      const colRef = collection(getFirestore(), `${COLLECTION}/filter/not-in-modular`);
      const expected = 'bar';
      const data = { foo: expected };

      await Promise.all([
        addDoc(colRef, { foo: 'not' }),
        addDoc(colRef, { foo: 'this' }),
        addDoc(colRef, data),
        addDoc(colRef, data),
      ]);

      const snapshot = await getDocs(query(colRef, where('foo', 'not-in', ['not', 'this'])));

      snapshot.size.should.eql(2);
      snapshot.forEach(s => {
        s.data().foo.should.eql(jet.contextify(expected));
      });
    });

    it('returns with where "in" filter', async function () {
      const { getFirestore, collection, addDoc, getDocs, query, where, orderBy } = firestoreModular;
      const colRef = collection(getFirestore(), `${COLLECTION}/filter/where-in-modular`);
      const expected1 = 'bar';
      const expected2 = 'baz';
      const data1 = { foo: expected1 };
      const data2 = { foo: expected2 };

      await Promise.all([
        addDoc(colRef, { foo: 'not' }),
        addDoc(colRef, { foo: 'this' }),
        addDoc(colRef, data1),
        addDoc(colRef, data2),
      ]);

      const snapshot = await getDocs(
        query(colRef, where('foo', 'in', [expected1, expected2]), orderBy('foo')),
      );

      snapshot.size.should.eql(2);
      snapshot.docs[0].data().foo.should.eql(expected1);
      snapshot.docs[1].data().foo.should.eql(expected2);
    });

    // Using AND query combinations with Equals && "array-contains", "array-contains-any", "not-in" and "in" filters
    it('returns with where "==" & "array-contains" filter', async function () {
      const { getFirestore, collection, addDoc, getDocs, query, where, and } = firestoreModular;
      const colRef = collection(getFirestore(), `${COLLECTION}/filter/equals-modular`);

      const match = Date.now();
      await Promise.all([
        addDoc(colRef, { foo: [1, '1', match] }),
        addDoc(colRef, { foo: [1, '2', match.toString()], bar: 'baz' }),
        addDoc(colRef, { foo: [1, '2', match.toString()], bar: 'baz' }),
      ]);

      const snapshot = await getDocs(
        query(
          colRef,
          and(where('foo', 'array-contains', match.toString()), where('bar', '==', 'baz')),
        ),
      );
      const expected = [1, '2', match.toString()];

      snapshot.size.should.eql(2);
      snapshot.forEach(s => {
        s.data().foo.should.eql(jet.contextify(expected));
      });
    });

    it('returns with where "==" & "array-contains-any" filter', async function () {
      const { getFirestore, collection, addDoc, getDocs, query, where, and } = firestoreModular;
      const colRef = collection(getFirestore(), `${COLLECTION}/filter/equals-modular`);

      const match = Date.now();
      await Promise.all([
        addDoc(colRef, { foo: [1, '1', match] }),
        addDoc(colRef, { foo: [1, '2'], bar: 'baz' }),
        addDoc(colRef, { foo: ['2', match.toString()], bar: 'baz' }),
      ]);

      const snapshot = await getDocs(
        query(
          colRef,
          and(where('foo', 'array-contains-any', [match.toString(), 1]), where('bar', '==', 'baz')),
        ),
      );

      snapshot.size.should.eql(2);
      snapshot.docs[0].data().bar.should.equal('baz');
      snapshot.docs[1].data().bar.should.equal('baz');
    });

    it('returns with where "==" & "not-in" filter', async function () {
      const { getFirestore, collection, addDoc, getDocs, query, where, and } = firestoreModular;
      const colRef = collection(getFirestore(), `${COLLECTION}/filter/not-in`);

      await Promise.all([
        addDoc(colRef, { foo: 'bar', bar: 'baz' }),
        addDoc(colRef, { foo: 'thing', bar: 'baz' }),
        addDoc(colRef, { foo: 'bar', bar: 'baz' }),
        addDoc(colRef, { foo: 'yolo', bar: 'baz' }),
      ]);

      const snapshot = await getDocs(
        query(colRef, and(where('foo', 'not-in', ['yolo', 'thing']), where('bar', '==', 'baz'))),
      );

      snapshot.size.should.eql(2);
      snapshot.docs[0].data().foo.should.equal('bar');
      snapshot.docs[1].data().foo.should.equal('bar');
    });

    it('returns with where "==" & "in" filter', async function () {
      const { getFirestore, collection, addDoc, getDocs, query, where, and, orderBy } =
        firestoreModular;
      const colRef = collection(getFirestore(), `${COLLECTION}/filter/in`);

      await Promise.all([
        addDoc(colRef, { foo: 'bar', bar: 'baz' }),
        addDoc(colRef, { foo: 'thing', bar: 'baz' }),
        addDoc(colRef, { foo: 'yolo', bar: 'baz' }),
      ]);

      const snapshot = await getDocs(
        query(
          colRef,
          and(where('foo', 'in', ['bar', 'yolo']), where('bar', '==', 'baz')),
          orderBy('foo'),
        ),
      );

      snapshot.size.should.eql(2);
      snapshot.docs[0].data().foo.should.equal('bar');
      snapshot.docs[1].data().foo.should.equal('yolo');
    });

    // Special Filter queries
    it('returns when combining greater than and lesser than on the same nested field', async function () {
      const { getFirestore, collection, doc, setDoc, getDocs, query, where, and } =
        firestoreModular;
      const colRef = collection(getFirestore(), `${COLLECTION}/filter/greaterandless`);

      await Promise.all([
        setDoc(doc(colRef, 'doc1'), { foo: { bar: 1 } }),
        setDoc(doc(colRef, 'doc2'), { foo: { bar: 2 } }),
        setDoc(doc(colRef, 'doc3'), { foo: { bar: 3 } }),
      ]);

      const snapshot = await getDocs(
        query(colRef, and(where('foo.bar', '>', 1), where('foo.bar', '<', 3))),
      );

      snapshot.size.should.eql(1);
    });

    it('returns when combining greater than and lesser than on the same nested field using FieldPath', async function () {
      const {
        getFirestore,
        collection,
        doc,
        setDoc,
        getDocs,
        query,
        where,
        and,
        orderBy,
        FieldPath,
      } = firestoreModular;
      const colRef = collection(getFirestore(), `${COLLECTION}/filter/greaterandless`);

      await Promise.all([
        setDoc(doc(colRef, 'doc1'), { foo: { bar: 1 } }),
        setDoc(doc(colRef, 'doc2'), { foo: { bar: 2 } }),
        setDoc(doc(colRef, 'doc3'), { foo: { bar: 3 } }),
      ]);

      const snapshot = await getDocs(
        query(
          colRef,
          and(
            where(new FieldPath('foo', 'bar'), '>', 1),
            where(new FieldPath('foo', 'bar'), '<', 3),
          ),
          orderBy(new FieldPath('foo', 'bar')),
        ),
      );

      snapshot.size.should.eql(1);
    });

    it('returns with a FieldPath', async function () {
      const { getFirestore, collection, addDoc, getDocs, query, where, FieldPath } =
        firestoreModular;
      const colRef = collection(
        getFirestore(),
        `${COLLECTION}/filter/where-fieldpath${Date.now() + ''}`,
      );
      const fieldPath = new FieldPath('map', 'foo.bar@gmail.com');

      await addDoc(colRef, {
        map: {
          'foo.bar@gmail.com': true,
        },
      });
      await addDoc(colRef, {
        map: {
          'bar.foo@gmail.com': true,
        },
      });

      const snapshot = await getDocs(query(colRef, where(fieldPath, '==', true)));
      snapshot.size.should.eql(1); // 2nd record should only be returned once
      const data = snapshot.docs[0].data();
      should.equal(data.map['foo.bar@gmail.com'], true);
    });
  });
});
