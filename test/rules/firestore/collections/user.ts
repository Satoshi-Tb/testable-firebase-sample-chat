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
import compat from "firebase/compat";
import admin from "firebase-admin";

const user = userFactory.build({ id: "user-id" });
const other = userFactory.build({ id: "other-id" });
const users = [user, other];

export const usersTest = () => {
  let env: RulesTestEnvironment;

  beforeEach(async () => {
    env = getTestEnv();
    await env.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      // 各テストの実施前にテストユーザーを生成する
      //await setCollections(adminDb.collection("users"), users);
      //TODO エミュレーター？にTimestampオブジェクトが登録できない。4通り試したがすべてNG
      //firebase-adminのadmin.firestore.Timestamp.now()
      //firebase/compatのcompat.firestore.FieldValue.serverTimestamp()
      //firebase/firestoreのserverTimestamp, Timestamp
      const addObj = {
        ...user,
        createdAt: null,
        //createdAt: compat.firestore.FieldValue.serverTimestamp(),
        //createdAt: serverTimestamp(),
        //createdAt: admin.firestore.Timestamp.now(),
      };
      console.log(addObj);
      users.forEach((user) => {
        adminDb.collection("users").doc(user.id).set(addObj);
      });
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
        const ref = db.collection("users").doc(user.id);
        await assertSucceeds(ref.get());
      });
    });
  });
};
