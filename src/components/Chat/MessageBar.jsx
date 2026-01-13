import React, { useEffect, useRef, useState } from "react";
import { BsEmojiSmile } from "react-icons/bs";
import { ImAttachment } from "react-icons/im";
import { FaMicrophone } from "react-icons/fa";
import { MdSend } from "react-icons/md";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import axios from "axios";
import {
  ADD_IMAGE_MESSAGE_ROUTE,
  ADD_MESSAGE_ROUTE,
} from "@/utils/ApiRoutes";
import EmojiPicker from "emoji-picker-react";
import dynamic from "next/dynamic";
import PhotoPicker from "../common/PhotoPicker";

const CaptureAudio = dynamic(
  () => import("@/components/common/CaptureAudio"),
  { ssr: false }
);

export default function MessageBar() {
  const [{ socket, currentChatUser, userInfo }, dispatch] =
    useStateProvider();

  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [grabImage, setGrabImage] = useState(false);

  const emojiPickerRef = useRef(null);

  // ✅ USERS MUST EXIST BEFORE SENDING
  const isReady =
    userInfo?.id &&
    currentChatUser?.id &&
    typeof userInfo.id === "number" &&
    typeof currentChatUser.id === "number";

  // ---------------- SEND TEXT MESSAGE ----------------
  const sendMessage = async () => {
    const msg = message.trim();
    if (!msg || !isReady) return;

    try {
      setMessage("");

      const { data } = await axios.post(ADD_MESSAGE_ROUTE, {
        from: userInfo.id,
        to: currentChatUser.id,
        message: msg,
      });

      socket.current.emit("send-msg", {
        from: userInfo.id,
        to: currentChatUser.id,
        message: data.message,
      });

      dispatch({
        type: reducerCases.ADD_MESSAGE,
        newMessage: data.message,
        fromSelf: true,
      });
    } catch (err) {
      console.error(
        "Send message failed:",
        err.response?.data || err.message
      );
    }
  };

  // ---------------- SEND IMAGE MESSAGE ----------------
  const photoPickerOnChange = async (e) => {
    if (!isReady) return;

    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await axios.post(
        ADD_IMAGE_MESSAGE_ROUTE,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          params: {
            from: userInfo.id,
            to: currentChatUser.id,
          },
        }
      );

      if (response.status === 201) {
        socket.current.emit("send-msg", {
          from: userInfo.id,
          to: currentChatUser.id,
          message: response.data.message,
        });

        dispatch({
          type: reducerCases.ADD_MESSAGE,
          newMessage: response.data.message,
          fromSelf: true,
        });
      }
    } catch (err) {
      console.error("Image upload failed:", err);
    }
  };

  // ---------------- EMOJI HANDLING ----------------
  const handleEmojiClick = (emoji) => {
    setMessage((prev) => prev + emoji.emoji);
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target) &&
        event.target.id !== "emoji-open"
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("click", handleOutsideClick);
    return () =>
      document.removeEventListener("click", handleOutsideClick);
  }, []);

  useEffect(() => {
    setMessage("");
  }, [currentChatUser]);

  useEffect(() => {
    if (grabImage) {
      const picker = document.getElementById("photo-picker");
      picker?.click();
      document.body.onfocus = () =>
        setTimeout(() => setGrabImage(false), 500);
    }
  }, [grabImage]);

  // ---------------- UI ----------------
  return (
    <div className="bg-panel-header-background h-20 px-4 flex items-center gap-6 relative">
      {!showAudioRecorder && (
        <>
          <div className="flex gap-6">
            <BsEmojiSmile
              id="emoji-open"
              className="text-panel-header-icon cursor-pointer text-xl"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
            />

            {showEmojiPicker && (
              <div
                className="absolute bottom-24 left-16 z-40"
                ref={emojiPickerRef}
              >
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  theme="dark"
                />
              </div>
            )}

            <ImAttachment
              className={`text-panel-header-icon cursor-pointer text-xl ${
                !isReady && "opacity-50 pointer-events-none"
              }`}
              onClick={() => setGrabImage(true)}
            />
          </div>

          <div className="w-full h-10">
            <input
              type="text"
              disabled={!isReady}
              placeholder={
                isReady ? "Type a message" : "Loading chat..."
              }
              className="bg-input-background text-white h-10 w-full rounded-lg px-4 text-sm focus:outline-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="w-10 flex justify-center">
            {message.length ? (
              <button onClick={sendMessage} disabled={!isReady}>
                <MdSend className="text-panel-header-icon text-xl" />
              </button>
            ) : (
              <FaMicrophone
                className="text-panel-header-icon text-xl"
                onClick={() => setShowAudioRecorder(true)}
              />
            )}
          </div>
        </>
      )}

      {showAudioRecorder && (
        <CaptureAudio hide={setShowAudioRecorder} />
      )}
      {grabImage && <PhotoPicker onChange={photoPickerOnChange} />}
    </div>
  );
}
