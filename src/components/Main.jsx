import { onAuthStateChanged } from "firebase/auth";
import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useRouter } from "next/router";
import axios from "axios";

import Chat from "@/components/Chat/Chat";
import ChatList from "@/components/Chatlist/ChatList";
import Empty from "./Empty";
import VideoCall from "./Call/VideoCall";
import VoiceCall from "./Call/VoiceCall";
import IncomingCall from "./common/IncomingCall";
import IncomingVideoCall from "./common/IncomingVideoCall";
import SearchMessages from "./Chat/SearchMessages";

import { firebaseAuth } from "../utils/FirebaseConfig";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import {
  CHECK_USER_ROUTE,
  GET_MESSAGES_ROUTE,
  HOST,
} from "@/utils/ApiRoutes";

export default function Main() {
  const [
    {
      userInfo,
      currentChatUser,
      videoCall,
      voiceCall,
      incomingVoiceCall,
      incomingVideoCall,
      messageSearch,
    },
    dispatch,
  ] = useStateProvider();

  const router = useRouter();
  const socket = useRef(null);
  const [redirectLogin, setRedirectLogin] = useState(false);
  const [socketInitialized, setSocketInitialized] = useState(false);

  /* ================= AUTH LISTENER ================= */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      firebaseAuth,
      async (currentUser) => {
        try {
          if (!currentUser) {
            setRedirectLogin(true);
            return;
          }

          if (!userInfo && currentUser.email) {
            const { data } = await axios.post(CHECK_USER_ROUTE, {
              email: currentUser.email,
            });

            if (!data.status) {
              router.push("/login");
              return;
            }

            dispatch({
              type: reducerCases.SET_USER_INFO,
              userInfo: {
                id: data.data.id,
                email: data.data.email,
                name: data.data.name,
                profileImage: data.data.profilePicture,
                status: data.data.about,
              },
            });
          }
        } catch (error) {
          console.error(
            "Auth error:",
            error.response?.data || error.message
          );
        }
      }
    );

    return () => unsubscribe();
  }, []);

  /* ================= REDIRECT ================= */
  useEffect(() => {
    if (redirectLogin) router.push("/login");
  }, [redirectLogin]);

  /* ================= SOCKET INIT ================= */
  useEffect(() => {
    if (!userInfo || socket.current) return;

    socket.current = io(HOST, {
      transports: ["websocket"],
    });

    socket.current.emit("add-user", userInfo.id);

    dispatch({
      type: reducerCases.SET_SOCKET,
      socket,
    });

    setSocketInitialized(true);
  }, [userInfo]);

  /* ================= SOCKET EVENTS ================= */
  useEffect(() => {
    if (!socket.current || !socketInitialized) return;

    socket.current.on("msg-recieve", ({ message }) => {
      dispatch({
        type: reducerCases.ADD_MESSAGE,
        newMessage: message,
      });
    });

    socket.current.on("online-users", ({ onlineUsers }) => {
      dispatch({
        type: reducerCases.SET_ONLINE_USERS,
        onlineUsers,
      });
    });

    socket.current.on("mark-read-recieve", ({ id, recieverId }) => {
      dispatch({
        type: reducerCases.SET_MESSAGES_READ,
        id,
        recieverId,
      });
    });

    socket.current.on("incoming-voice-call", ({ from, roomId, callType }) => {
      dispatch({
        type: reducerCases.SET_INCOMING_VOICE_CALL,
        incomingVoiceCall: { ...from, roomId, callType },
      });
    });

    socket.current.on("voice-call-rejected", () => {
      dispatch({
        type: reducerCases.SET_VOICE_CALL,
        voiceCall: undefined,
      });
      dispatch({
        type: reducerCases.SET_INCOMING_VOICE_CALL,
        incomingVoiceCall: undefined,
      });
    });

    socket.current.on("incoming-video-call", ({ from, roomId, callType }) => {
      dispatch({
        type: reducerCases.SET_INCOMING_VIDEO_CALL,
        incomingVideoCall: { ...from, roomId, callType },
      });
    });

    socket.current.on("video-call-rejected", () => {
      dispatch({
        type: reducerCases.SET_VIDEO_CALL,
        videoCall: undefined,
      });
      dispatch({
        type: reducerCases.SET_INCOMING_VIDEO_CALL,
        incomingVideoCall: undefined,
      });
    });

    return () => {
      socket.current?.off();
    };
  }, [socketInitialized]);

  /* ================= FETCH MESSAGES ================= */
  useEffect(() => {
    const getMessages = async () => {
      try {
        if (!userInfo?.id || !currentChatUser?.id) return;

        const { data } = await axios.get(
          `${GET_MESSAGES_ROUTE}/${userInfo.id}/${currentChatUser.id}`
        );

        dispatch({
          type: reducerCases.SET_MESSAGES,
          messages: data.messages,
        });
      } catch (error) {
        console.error(
          "Message fetch failed:",
          error.response?.data || error.message
        );
      }
    };

    if (currentChatUser && userInfo) {
      getMessages();
    }
  }, [currentChatUser, userInfo]);

  /* ================= RENDER ================= */
  return (
    <>
      {incomingVoiceCall && <IncomingCall />}
      {incomingVideoCall && <IncomingVideoCall />}

      {videoCall && (
        <div className="h-screen w-screen overflow-hidden">
          <VideoCall />
        </div>
      )}

      {voiceCall && (
        <div className="h-screen w-screen overflow-hidden">
          <VoiceCall />
        </div>
      )}

      {!videoCall && !voiceCall && (
        <div className="grid grid-cols-main h-screen w-screen overflow-hidden">
          <ChatList />
          {currentChatUser ? (
            <div className={messageSearch ? "grid grid-cols-2" : "grid-cols-2"}>
              <Chat />
              {messageSearch && <SearchMessages />}
            </div>
          ) : (
            <Empty />
          )}
        </div>
      )}
    </>
  );
}
