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

describe('firestore.WriteBatch.commit()', function () {
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

    it('returns a Promise', function () {
      const commit = firebase.firestore().batch().commit();
      commit.should.be.a.Promise();
    });

    // FIXME this started to fail with dependency updates 20230628
    // firebase-tools firestore emulator allows more than 500 with an update?
    // official docs still indicate that 500 is the limit, so this is likely
    // an upstream bug in firestore emulator.
    xit('throws if committing more than 500 writes', async function () {
      const filledArray = new Array(501).fill({ foo: 'bar' });
      const batch = firebase.firestore().batch();

      for (let i = 0; i < filledArray.length; i++) {
        const doc = firebase.firestore().collection(COLLECTION).doc(i.toString());
        const filledArrayElement = filledArray[i];
        batch.set(doc, filledArrayElement);
      }

      try {
        await batch.commit();
        return Promise.reject(new Error('Did not throw Error.'));
      } catch (e) {
        e.code.should.containEql('firestore/invalid-argument');
        return Promise.resolve();
      }
    });

    it('throws if already committed', async function () {
      try {
        const batch = firebase.firestore().batch();
        await batch.commit();
        await batch.commit();
        return Promise.reject(new Error('Did not throw Error.'));
      } catch (e) {
        e.message.should.containEql('A write batch can no longer be used');
        return Promise.resolve();
      }
    });

    it('should set & commit', async function () {
      const lRef = firebase.firestore().doc(`${COLLECTION}/LON`);
      const nycRef = firebase.firestore().doc(`${COLLECTION}/NYC`);
      const sfRef = firebase.firestore().doc(`${COLLECTION}/SF`);

      const batch = firebase.firestore().batch();

      batch.set(lRef, { name: 'London' });
      batch.set(nycRef, { name: 'New York' });
      batch.set(sfRef, { name: 'San Francisco' });

      await batch.commit();

      const [lDoc, nycDoc, sDoc] = await Promise.all([lRef.get(), nycRef.get(), sfRef.get()]);

      lDoc.data().name.should.eql('London');
      nycDoc.data().name.should.eql('New York');
      sDoc.data().name.should.eql('San Francisco');
      await Promise.all([lRef.delete(), nycRef.delete(), sfRef.delete()]);
    });

    it('should set/merge & commit', async function () {
      const lRef = firebase.firestore().doc(`${COLLECTION}/LON`);
      const nycRef = firebase.firestore().doc(`${COLLECTION}/NYC`);
      const sfRef = firebase.firestore().doc(`${COLLECTION}/SF`);

      await Promise.all([
        lRef.set({ name: 'London' }),
        nycRef.set({ name: 'New York' }),
        sfRef.set({ name: 'San Francisco' }),
      ]);

      const batch = firebase.firestore().batch();

      batch.set(lRef, { country: 'UK' }, { merge: true });
      batch.set(nycRef, { country: 'USA' }, { merge: true });
      batch.set(sfRef, { country: 'USA' }, { merge: true });

      await batch.commit();

      const [lDoc, nycDoc, sDoc] = await Promise.all([lRef.get(), nycRef.get(), sfRef.get()]);

      lDoc.data().name.should.eql('London');
      lDoc.data().country.should.eql('UK');
      nycDoc.data().name.should.eql('New York');
      nycDoc.data().country.should.eql('USA');
      sDoc.data().name.should.eql('San Francisco');
      sDoc.data().country.should.eql('USA');

      await Promise.all([lRef.delete(), nycRef.delete(), sfRef.delete()]);
    });

    it('should set/mergeFields & commit', async function () {
      const lRef = firebase.firestore().doc(`${COLLECTION}/LON`);
      const nycRef = firebase.firestore().doc(`${COLLECTION}/NYC`);
      const sfRef = firebase.firestore().doc(`${COLLECTION}/SF`);

      await Promise.all([
        lRef.set({ name: 'London' }),
        nycRef.set({ name: 'New York' }),
        sfRef.set({ name: 'San Francisco' }),
      ]);

      const batch = firebase.firestore().batch();

      batch.set(lRef, { name: 'LON', country: 'UK' }, { mergeFields: ['country'] });
      batch.set(nycRef, { name: 'NYC', country: 'USA' }, { mergeFields: ['country'] });
      batch.set(
        sfRef,
        { name: 'SF', country: 'USA' },
        { mergeFields: [new firebase.firestore.FieldPath('country')] },
      );

      await batch.commit();

      const [lDoc, nycDoc, sDoc] = await Promise.all([lRef.get(), nycRef.get(), sfRef.get()]);

      lDoc.data().name.should.eql('London');
      lDoc.data().country.should.eql('UK');
      nycDoc.data().name.should.eql('New York');
      nycDoc.data().country.should.eql('USA');
      sDoc.data().name.should.eql('San Francisco');
      sDoc.data().country.should.eql('USA');

      await Promise.all([lRef.delete(), nycRef.delete(), sfRef.delete()]);
    });

    it('should delete & commit', async function () {
      const lRef = firebase.firestore().doc(`${COLLECTION}/LON`);
      const nycRef = firebase.firestore().doc(`${COLLECTION}/NYC`);
      const sfRef = firebase.firestore().doc(`${COLLECTION}/SF`);

      await Promise.all([
        lRef.set({ name: 'London' }),
        nycRef.set({ name: 'New York' }),
        sfRef.set({ name: 'San Francisco' }),
      ]);

      const batch = firebase.firestore().batch();

      batch.delete(lRef);
      batch.delete(nycRef);
      batch.delete(sfRef);

      await batch.commit();

      const [lDoc, nycDoc, sDoc] = await Promise.all([lRef.get(), nycRef.get(), sfRef.get()]);

      lDoc.exists().should.be.False();
      nycDoc.exists().should.be.False();
      sDoc.exists().should.be.False();
    });

    it('should update & commit', async function () {
      const lRef = firebase.firestore().doc(`${COLLECTION}/LON`);
      const nycRef = firebase.firestore().doc(`${COLLECTION}/NYC`);
      const sfRef = firebase.firestore().doc(`${COLLECTION}/SF`);

      await Promise.all([
        lRef.set({ name: 'London' }),
        nycRef.set({ name: 'New York' }),
        sfRef.set({ name: 'San Francisco' }),
      ]);

      const batch = firebase.firestore().batch();

      batch.update(lRef, { name: 'LON', country: 'UK' });
      batch.update(nycRef, { name: 'NYC', country: 'USA' });
      batch.update(sfRef, 'name', 'SF', 'country', 'USA');

      await batch.commit();

      const [lDoc, nycDoc, sDoc] = await Promise.all([lRef.get(), nycRef.get(), sfRef.get()]);

      lDoc.data().name.should.eql('LON');
      lDoc.data().country.should.eql('UK');
      nycDoc.data().name.should.eql('NYC');
      nycDoc.data().country.should.eql('USA');
      sDoc.data().name.should.eql('SF');
      sDoc.data().country.should.eql('USA');

      await Promise.all([lRef.delete(), nycRef.delete(), sfRef.delete()]);
    });
  });

  describe('modular', function () {
    it('returns a Promise', function () {
      const { getFirestore, writeBatch } = firestoreModular;
      const commit = writeBatch(getFirestore()).commit();
      commit.should.be.a.Promise();
    });

    // FIXME this started to fail with dependency updates 20230628
    // firebase-tools firestore emulator allows more than 500 with an update?
    // official docs still indicate that 500 is the limit, so this is likely
    // an upstream bug in firestore emulator.
    xit('throws if committing more than 500 writes', async function () {
      const { getFirestore, writeBatch, collection, doc, setDoc } = firestoreModular;
      const db = getFirestore();
      const filledArray = new Array(501).fill({ foo: 'bar' });
      const batch = writeBatch(db);

      for (let i = 0; i < filledArray.length; i++) {
        const docRef = doc(collection(db, COLLECTION), i.toString());
        const filledArrayElement = filledArray[i];
        setDoc(batch, docRef, filledArrayElement);
      }

      try {
        await batch.commit();
        return Promise.reject(new Error('Did not throw Error.'));
      } catch (e) {
        e.code.should.containEql('firestore/invalid-argument');
        return Promise.resolve();
      }
    });

    it('throws if already committed', async function () {
      const { getFirestore, writeBatch } = firestoreModular;
      try {
        const batch = writeBatch(getFirestore());
        await batch.commit();
        await batch.commit();
        return Promise.reject(new Error('Did not throw Error.'));
      } catch (e) {
        e.message.should.containEql('A write batch can no longer be used');
        return Promise.resolve();
      }
    });

    it('should set & commit', async function () {
      const { getFirestore, writeBatch, doc, getDoc, deleteDoc } = firestoreModular;
      const db = getFirestore();
      const lRef = doc(db, `${COLLECTION}/LON`);
      const nycRef = doc(db, `${COLLECTION}/NYC`);
      const sfRef = doc(db, `${COLLECTION}/SF`);

      const batch = writeBatch(db);
      // This is the correct way of setting batch for modular API
      batch.set(lRef, { name: 'London' });
      batch.set(nycRef, { name: 'New York' });
      batch.set(sfRef, { name: 'San Francisco' });

      await batch.commit();

      const [lDoc, nycDoc, sDoc] = await Promise.all([getDoc(lRef), getDoc(nycRef), getDoc(sfRef)]);

      lDoc.data().name.should.eql('London');
      nycDoc.data().name.should.eql('New York');
      sDoc.data().name.should.eql('San Francisco');
      await Promise.all([deleteDoc(lRef), deleteDoc(nycRef), deleteDoc(sfRef)]);
    });

    it('should set/merge & commit', async function () {
      const { getFirestore, writeBatch, doc, setDoc, getDoc, deleteDoc } = firestoreModular;
      const db = getFirestore();
      const lRef = doc(db, `${COLLECTION}/LON`);
      const nycRef = doc(db, `${COLLECTION}/NYC`);
      const sfRef = doc(db, `${COLLECTION}/SF`);

      await Promise.all([
        setDoc(lRef, { name: 'London' }),
        setDoc(nycRef, { name: 'New York' }),
        setDoc(sfRef, { name: 'San Francisco' }),
      ]);

      const batch = writeBatch(db);

      batch.set(lRef, { country: 'UK' }, { merge: true });
      batch.set(nycRef, { country: 'USA' }, { merge: true });
      batch.set(sfRef, { country: 'USA' }, { merge: true });

      await batch.commit();

      const [lDoc, nycDoc, sDoc] = await Promise.all([getDoc(lRef), getDoc(nycRef), getDoc(sfRef)]);

      lDoc.data().name.should.eql('London');
      lDoc.data().country.should.eql('UK');
      nycDoc.data().name.should.eql('New York');
      nycDoc.data().country.should.eql('USA');
      sDoc.data().name.should.eql('San Francisco');
      sDoc.data().country.should.eql('USA');

      await Promise.all([deleteDoc(lRef), deleteDoc(nycRef), deleteDoc(sfRef)]);
    });

    it('should set/mergeFields & commit', async function () {
      const { getFirestore, writeBatch, doc, setDoc, FieldPath, getDoc, deleteDoc } =
        firestoreModular;
      const db = getFirestore();
      const lRef = doc(db, `${COLLECTION}/LON`);
      const nycRef = doc(db, `${COLLECTION}/NYC`);
      const sfRef = doc(db, `${COLLECTION}/SF`);

      await Promise.all([
        setDoc(lRef, { name: 'London' }),
        setDoc(nycRef, { name: 'New York' }),
        setDoc(sfRef, { name: 'San Francisco' }),
      ]);

      const batch = writeBatch(db);

      batch.set(lRef, { name: 'LON', country: 'UK' }, { mergeFields: ['country'] });
      batch.set(nycRef, { name: 'NYC', country: 'USA' }, { mergeFields: ['country'] });
      batch.set(sfRef, { name: 'SF', country: 'USA' }, { mergeFields: [new FieldPath('country')] });

      await batch.commit();

      const [lDoc, nycDoc, sDoc] = await Promise.all([getDoc(lRef), getDoc(nycRef), getDoc(sfRef)]);

      lDoc.data().name.should.eql('London');
      lDoc.data().country.should.eql('UK');
      nycDoc.data().name.should.eql('New York');
      nycDoc.data().country.should.eql('USA');
      sDoc.data().name.should.eql('San Francisco');
      sDoc.data().country.should.eql('USA');

      await Promise.all([deleteDoc(lRef), deleteDoc(nycRef), deleteDoc(sfRef)]);
    });

    it('should delete & commit', async function () {
      const { getFirestore, writeBatch, doc, setDoc, getDoc } = firestoreModular;
      const db = getFirestore();
      const lRef = doc(db, `${COLLECTION}/LON`);
      const nycRef = doc(db, `${COLLECTION}/NYC`);
      const sfRef = doc(db, `${COLLECTION}/SF`);

      await Promise.all([
        setDoc(lRef, { name: 'London' }),
        setDoc(nycRef, { name: 'New York' }),
        setDoc(sfRef, { name: 'San Francisco' }),
      ]);

      const batch = writeBatch(db);

      batch.delete(lRef);
      batch.delete(nycRef);
      batch.delete(sfRef);

      await batch.commit();

      const [lDoc, nycDoc, sDoc] = await Promise.all([getDoc(lRef), getDoc(nycRef), getDoc(sfRef)]);

      lDoc.exists().should.be.False();
      nycDoc.exists().should.be.False();
      sDoc.exists().should.be.False();
    });

    it('should update & commit', async function () {
      const { getFirestore, writeBatch, doc, setDoc, getDoc, deleteDoc } = firestoreModular;
      const db = getFirestore();
      const lRef = doc(db, `${COLLECTION}/LON`);
      const nycRef = doc(db, `${COLLECTION}/NYC`);
      const sfRef = doc(db, `${COLLECTION}/SF`);

      await Promise.all([
        setDoc(lRef, { name: 'London' }),
        setDoc(nycRef, { name: 'New York' }),
        setDoc(sfRef, { name: 'San Francisco' }),
      ]);

      const batch = writeBatch(db);

      batch.update(lRef, { name: 'LON', country: 'UK' });
      batch.update(nycRef, { name: 'NYC', country: 'USA' });
      batch.update(sfRef, 'name', 'SF', 'country', 'USA');

      await batch.commit();

      const [lDoc, nycDoc, sDoc] = await Promise.all([getDoc(lRef), getDoc(nycRef), getDoc(sfRef)]);

      lDoc.data().name.should.eql('LON');
      lDoc.data().country.should.eql('UK');
      nycDoc.data().name.should.eql('NYC');
      nycDoc.data().country.should.eql('USA');
      sDoc.data().name.should.eql('SF');
      sDoc.data().country.should.eql('USA');

      await Promise.all([deleteDoc(lRef), deleteDoc(nycRef), deleteDoc(sfRef)]);
    });
  });
});
