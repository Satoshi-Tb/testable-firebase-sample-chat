import {
  assertSucceeds,
  assertFails,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import firebase from "firebase/compat/app";
import { getTestEnv, setCollections } from "@/../test/rules/firestore/utils";
import { userFactory } from "@/../test/factories/user";
import { messageFactory } from "@/../test/factories/message";
import { omit } from "lodash-es";

const user = userFactory.build({ id: "user-id" });
const other = userFactory.build({ id: "other-id" });
const users = [user, other];

const userMessage = messageFactory.build({
  id: "user-message-id",
  senderId: user.id,
});

const otherMessage = messageFactory.build({
  id: "other-message-id",
  senderId: other.id,
});
const messages = [userMessage, otherMessage];

const userCollectionName = "users";
const messageCollectionName = "messages";

export const messageTest = () => {
  let env: RulesTestEnvironment;

  beforeEach(async () => {
    env = getTestEnv();
    await env.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();

      users.forEach((item) => {
        const addObj = {
          ...item,
          createdAt: null,
        };
        adminDb.collection(userCollectionName).doc(item.id).set(addObj);
      });

      messages.forEach((item) => {
        const addObj = {
          ...item,
          createdAt: null,
        };
        adminDb.collection(messageCollectionName).doc(item.id).set(addObj);
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
      const ref = db.collection(messageCollectionName).doc(other.id);
      await assertFails(ref.get());
    });

    it("読み込みできない(list)", async () => {
      const ref = db.collection(messageCollectionName);
      await assertFails(ref.get());
    });

    it("作成できない", async () => {
      const newUser = userFactory.build();
      const ref = db.collection(messageCollectionName);
      await assertFails(ref.doc(newUser.id).set(omit(newUser, ["createdAt"])));
    });

    it("更新できない", async () => {
      const ref = db.collection(messageCollectionName).doc(other.id);
      await assertFails(ref.update({ name: "違う名前" }));
    });

    it("削除できない", async () => {
      const ref = db.collection(messageCollectionName).doc(other.id);
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
        const ref = db.collection(messageCollectionName).doc(userMessage.id);
        await assertSucceeds(ref.get());
      });

      it("作成できる", async () => {
        const newMessage = messageFactory.build({ senderId: user.id });
        const ref = db.collection(messageCollectionName);
        await assertSucceeds(
          ref.doc(newMessage.id).set(omit(newMessage, ["createdAt"]))
        );
      });

      //   //UPDATEに失敗する
      //   it("更新できる", async () => {
      //     const ref = db.collection(messageCollectionName).doc(userMessage.id);
      //     await assertSucceeds(ref.update({ content: "違う名前" }));
      //   });

      //   //DELETに失敗する
      //   it("削除できる", async () => {
      //     const ref = db.collection(messageCollectionName).doc(userMessage.id);
      //     await assertSucceeds(ref.delete());
      //   });
    });
  });
};
