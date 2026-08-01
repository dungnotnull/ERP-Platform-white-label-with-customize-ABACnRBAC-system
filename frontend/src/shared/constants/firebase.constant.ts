import config from "@/shared/constants/config.constant.ts";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: config.thirdParty.firebase.apiKey,
  authDomain: config.thirdParty.firebase.authDomain,
  projectId: config.thirdParty.firebase.projectId,
  storageBucket: config.thirdParty.firebase.storageBucket,
  messagingSenderId: config.thirdParty.firebase.messagingSenderId,
  appId: config.thirdParty.firebase.appId
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };
