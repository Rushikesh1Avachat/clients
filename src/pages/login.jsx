import axios from "axios";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import React, { useEffect } from "react";
import { FcGoogle } from "react-icons/fc";
import { firebaseAuth } from "../utils/FirebaseConfig";

import { useStateProvider } from "@/context/StateContext";
import { useRouter } from "next/router";
import Image from "next/image";
import { reducerCases } from "@/context/constants";
import { CHECK_USER_ROUTE } from "@/utils/ApiRoutes";

export default function Login() {
const router = useRouter();
const [{ userInfo, newUser }, dispatch] = useStateProvider();

useEffect(() => {
  if (userInfo?.id && !newUser) {
    router.push("/");
  }
}, [userInfo, newUser, router]);

const login = async () => {
  try {
    const provider = new GoogleAuthProvider();

    const {
      user: { displayName: name, email, photoURL: profileImage },
    } = await signInWithPopup(firebaseAuth, provider);

    if (!email) return;

    const res = await axios.post(CHECK_USER_ROUTE, { email });
    const data = res.data;

    // 🟡 NEW USER
    if (!data.success) {
      dispatch({ type: reducerCases.SET_NEW_USER, newUser: true });

      dispatch({
        type: reducerCases.SET_USER_INFO,
        userInfo: {
          name,
          email,
          profileImage,
          status: "Available",
        },
      });

      router.push("/onboarding");
      return;
    }

    // 🟢 EXISTING USER
    dispatch({
      type: reducerCases.SET_USER_INFO,
      userInfo: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        profileImage: data.user.profilePicture,
        status: data.user.about,
      },
    });

    router.push("/");
  } catch (error) {
    // ONLY network / firebase errors come here
    console.error("Login failed:", error.message);
  }
};

  return (
    <div className="flex justify-center items-center bg-panel-header-background h-screen w-screen flex-col gap-6">
      <div className="flex items-center justify-center gap-2 text-white">
        <Image
          src="/whatsapp.gif"
          alt="whatsapp-gif"
          height={300}
          width={300}
        />
        <span className="text-7xl">WhatsApp</span>
      </div>
      <button
        className="flex items-center justify-center gap-7 bg-search-input-container-background p-5 rounded-lg"
        onClick={login}
      >
        <FcGoogle className="text-4xl" />
        <span className="text-white text-2xl">Login With Google</span>
      </button>
    </div>
  );
}
