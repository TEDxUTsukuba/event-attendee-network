import firebaseApp from "./config";
import { signInWithPopup, GoogleAuthProvider, getAuth } from "firebase/auth";

const auth = getAuth(firebaseApp);

export const loginAsGoogle = async () => {
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
  } catch (e) {
    console.error(e);
    return;
  }
  window.location.reload();
};

export const logout = async () => {
  await auth.signOut();
  window.location.reload();
};

export default auth;
