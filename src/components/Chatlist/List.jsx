import React, { useEffect } from "react";
import ChatLIstItem from "./ChatLIstItem";
import { useStateProvider } from "@/context/StateContext";
import axios from "axios";
import { GET_INITIAL_CONTACTS_ROUTE } from "@/utils/ApiRoutes";
import { reducerCases } from "@/context/constants";

export default function List() {
  const [{ userInfo, userContacts, filteredContacts }, dispatch] =useStateProvider();
useEffect(() => {
  const getContacts = async () => {
    try {
      const {
        data: { users, onlineUsers },
      } = await axios.get(
        `${GET_INITIAL_CONTACTS_ROUTE}/${userInfo.id}`
      );

      dispatch({
        type: reducerCases.SET_USER_CONTACTS,
        userContacts: users,
      });

      dispatch({
        type: reducerCases.SET_ONLINE_USERS,
        onlineUsers,
      });
    } catch (error) {
      console.error("Get contacts error:", error.response?.data || error);
    }
  };

  if (userInfo?.id) {
    getContacts();
  }
}, [userInfo, dispatch]);

  return (
    <div className="bg-search-input-container-background flex-auto overflow-auto max-h-full custom-scrollbar">
      {filteredContacts && filteredContacts.length > 0
        ? filteredContacts.map((contact) => {
            return <ChatLIstItem data={contact} key={contact.id} />;
          })
        : userContacts.map((contact) => {
            return <ChatLIstItem data={contact} key={contact.id} />;
          })}
    </div>
  );
}
