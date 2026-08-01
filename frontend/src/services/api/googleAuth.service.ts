import { signInWithPopup, signOut, UserCredential } from "firebase/auth";
import { auth, googleProvider } from "@/shared/constants/firebase.constant";
import { User } from "@/shared/@types/user.type.ts";
import config from "@/shared/constants/config.constant";
import { ApiRouteNames, apiRoutes } from "@/shared/constants/routes.constant";
import { apiClient } from "./apiClient.service";

interface GoogleAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export const googleAuthService = {
  signInWithGoogle: async (): Promise<UserCredential> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result;
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  },

  processGoogleAuth: async (
    credential: UserCredential
  ): Promise<GoogleAuthResponse> => {
    try {
      const idToken = await credential.user.getIdToken();

      const response = await apiClient.post(
        config.getApiUrl(apiRoutes[ApiRouteNames.GOOGLE_AUTH]),
        { idToken }
      );

      if (!response.status || response.status !== 200) {
        throw new Error(`Error: ${response.status}`);
      }

      return await response;
    } catch (error) {
      console.error("Error processing Google authentication:", error);
      throw error;
    }
  },

  signOut: async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  }
};
