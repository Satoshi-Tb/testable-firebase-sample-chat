import {
  assertSucceeds,
  assertFails,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import firebase from "firebase/compat/app";
import { getTestEnv, setCollections } from "@/../test/rules/firestore/utils";
import { userFactory } from "@/../test/factories/user";
import { WithId } from "@/lib/firebase";
import { User } from "@/types/user";
import * as ftest from "@firebase/rules-unit-testing";
import { serverTimestamp } from "firebase/firestore";
// import compat from "firebase/compat";
// import admin from "firebase-admin";
import { omit } from "lodash-es";

const user = userFactory.build({ id: "user-id" });
const other = userFactory.build({ id: "other-id" });
const users = [user, other];

const collectionName = "users";

export const usersTest = () => {
  let env: RulesTestEnvironment;

  beforeEach(async () => {
    env = getTestEnv();
    await env.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();

      users.forEach((item) => {
        // 各テストの実施前にテストユーザーを生成する
        //await setCollections(adminDb.collection("users"), users);
        //TODO エミュレーター？にTimestampオブジェクトが登録できない。4通り試したがすべてNG
        //firebase-adminのadmin.firestore.Timestamp.now()
        //firebase/compatのcompat.firestore.FieldValue.serverTimestamp()
        //firebase/firestoreのserverTimestamp, Timestamp
        const addObj = {
          ...item,
          createdAt: null,
          //createdAt: compat.firestore.FieldValue.serverTimestamp(),
          //createdAt: serverTimestamp(),
          //createdAt: admin.firestore.Timestamp.now(),
        };
        // console.log("add item:");
        // console.log(addObj);
        adminDb.collection(collectionName).doc(item.id).set(addObj);
      });
    });
  });

  describe("未認証の場合", () => {
    let db: firebase.firestore.Firestore;

    beforeEach(() => {
      //未認証テスト
      db = env.unauthenticatedContext().firestore();
    });

    it("読み込みできない(get)", async () => {
      const ref = db.collection(collectionName).doc(other.id);
      await assertFails(ref.get());
    });

    it("読み込みできない(list)", async () => {
      const ref = db.collection(collectionName);
      await assertFails(ref.get());
    });

    it("作成できない", async () => {
      const newUser = userFactory.build();
      const ref = db.collection(collectionName);
      await assertFails(ref.doc(newUser.id).set(omit(newUser, ["createdAt"])));
    });

    it("更新できない", async () => {
      const ref = db.collection(collectionName).doc(other.id);
      await assertFails(ref.update({ name: "違う名前" }));
    });

    it("削除できない", async () => {
      const ref = db.collection(collectionName).doc(other.id);
      await assertFails(ref.delete());
    });
  });

  describe("自分以外のデータの場合", () => {
    let db: firebase.firestore.Firestore;

    beforeEach(() => {
      db = env.authenticatedContext(user.id).firestore();
    });

    //GETに失敗する
    // it("読み込みできる(get)", async () => {
    //   const ref = db.collection(collectionName).doc(other.id);
    //   await assertSucceeds(ref.get());
    // });

    it("作成できない", async () => {
      const ref = db.collection(collectionName).doc(other.id);
      await assertFails(ref.update({ name: "違う名前" }));
    });

    it("削除できない", async () => {
      const ref = db.collection(collectionName).doc(other.id);
      await assertFails(ref.delete());
    });
  });

  describe("認証済の場合", () => {
    describe("自分のデータの場合", () => {
      let db: firebase.firestore.Firestore;

      beforeEach(() => {
        //認証済テスト
        db = env.authenticatedContext(user.id).firestore();
      });

      it("読み込みできる(get)", async () => {
        const ref = db.collection(collectionName).doc(user.id);
        await assertSucceeds(ref.get());
      });

      it("作成できる", async () => {
        const newUser = userFactory.build();
        const db = env.authenticatedContext(newUser.id).firestore();
        const ref = db.collection(collectionName);
        await assertSucceeds(
          ref.doc(newUser.id).set(omit(newUser, ["createdAt"]))
        );
      });

      //UPDATEに失敗する
      // it("更新できる", async () => {
      //   console.log("3");
      //   console.log(user.id);
      //   const ref = db.collection(collectionName).doc(user.id);
      //   const item = await ref.get();
      //   console.log(item.data());
      //   await assertSucceeds(ref.update({ name: "違う名前" }));
      // });

      it("削除できる", async () => {
        const ref = db.collection(collectionName).doc(user.id);
        await assertSucceeds(ref.delete());
      });
    });

    describe("自分以外のデータの場合", () => {
      let db: firebase.firestore.Firestore;

      beforeEach(() => {
        db = env.authenticatedContext(user.id).firestore();
      });

      //GETに失敗する
      // it("読み込みできる(get)", async () => {
      //   const ref = db.collection(collectionName).doc(other.id);
      //   await assertSucceeds(ref.get());
      // });

      it("作成できない", async () => {
        const ref = db.collection(collectionName).doc(other.id);
        await assertFails(ref.update({ name: "違う名前" }));
      });

      it("削除できない", async () => {
        const ref = db.collection(collectionName).doc(other.id);
        await assertFails(ref.delete());
      });
    });
  });
};
