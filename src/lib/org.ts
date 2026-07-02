import {
  collection,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { getFirebaseDb, membersCollection } from "./firebase";
import type { Organization, UserProfile } from "@/types";

export async function ensureUserProfile(
  uid: string,
  email: string,
  displayName?: string
): Promise<UserProfile> {
  const userRef = doc(getFirebaseDb(), "users", uid);
  const existing = await getDoc(userRef);

  if (existing.exists()) {
    const data = existing.data();
    return {
      id: uid,
      email: data.email,
      displayName: data.displayName,
      defaultOrgId: data.defaultOrgId,
      createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
    };
  }

  const orgRef = doc(collection(getFirebaseDb(), "orgs"));
  const orgId = orgRef.id;
  const orgName = "Моя організація";

  await setDoc(orgRef, {
    name: orgName,
    createdBy: uid,
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(getFirebaseDb(), membersCollection(orgId), uid), {
    role: "owner",
    joinedAt: serverTimestamp(),
  });

  await setDoc(userRef, {
    email,
    displayName: displayName ?? null,
    defaultOrgId: orgId,
    createdAt: serverTimestamp(),
  });

  return {
    id: uid,
    email,
    displayName,
    defaultOrgId: orgId,
    createdAt: new Date(),
  };
}

export async function getOrganization(orgId: string): Promise<Organization | null> {
  const snap = await getDoc(doc(getFirebaseDb(), "orgs", orgId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    name: data.name,
    createdBy: data.createdBy,
    createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
  };
}
