import { Factory } from "fishery";
import { Timestamp } from "firebase/firestore";
import { User } from "@/types/user";

export const messageFactory = Factory.define<User>(({ sequence }) => ({
  id: sequence.toString(),
  createdAt: Timestamp.fromDate(new Date()),
  name: `テストユーザー${sequence}`,
  photoUrl: "",
}));
