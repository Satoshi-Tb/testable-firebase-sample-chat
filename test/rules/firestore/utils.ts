import {
  initializeTestEnvironment as _initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";
import firebase from "firebase/compat/app";
import { getConverter, WithId } from "@/lib/firebase";
import { DocumentData } from "firebase/firestore";

let testEnv: RulesTestEnvironment;

export const initializeTestEnvironment = async () => {
  testEnv = await _initializeTestEnvironment({
    projectId: "fs-sample-open-chat-test",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
    },
  });
};

export const getTestEnv = () => testEnv;

export const setCollections = <T extends DocumentData>(
  ref: firebase.firestore.CollectionReference,
  instances: WithId<T>[]
) => {
  Promise.all(
    instances.map((_) => ref.doc(_.id).set(getConverter<T>().toFirestore(_)))
  );
};
