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
const { wipe } = require('../helpers');
const COLLECTION = 'firestore';

describe('firestore().collection().limit()', function () {
  before(function () {
    return wipe();
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

    it('throws if limit is invalid', function () {
      try {
        firebase.firestore().collection(COLLECTION).limit(-1);
        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql("'limit' must be a positive integer value");
        return Promise.resolve();
      }
    });

    it('sets limit on internals', async function () {
      const colRef = firebase.firestore().collection(COLLECTION).limit(123);

      colRef._modifiers.options.limit.should.eql(123);
    });

    it('limits the number of documents', async function () {
      const colRef = firebase.firestore().collection(COLLECTION);

      // Add 3
      await colRef.add({});
      await colRef.add({});
      await colRef.add({});

      const snapshot = await colRef.limit(2).get();
      snapshot.size.should.eql(2);
    });
  });

  describe('modular', function () {
    it('throws if limit is invalid', function () {
      const { getFirestore, collection, limit, query } = firestoreModular;
      try {
        query(collection(getFirestore(), COLLECTION), limit(-1));
        return Promise.reject(new Error('Did not throw an Error.'));
      } catch (error) {
        error.message.should.containEql("'limit' must be a positive integer value");
        return Promise.resolve();
      }
    });

    it('sets limit on internals', async function () {
      const { getFirestore, collection, limit, query } = firestoreModular;
      const colRef = query(collection(getFirestore(), COLLECTION), limit(123));

      colRef._modifiers.options.limit.should.eql(123);
    });

    it('limits the number of documents', async function () {
      const { getFirestore, collection, addDoc, getDocs, limit, query } = firestoreModular;
      const colRef = collection(getFirestore(), COLLECTION);

      // Add 3
      await addDoc(colRef, {});
      await addDoc(colRef, {});
      await addDoc(colRef, {});

      const snapshot = await getDocs(query(colRef, limit(2)));
      snapshot.size.should.eql(2);
    });
  });
});
