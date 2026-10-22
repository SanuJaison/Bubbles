import commonAPI from "./commonAPI"

export const registerAPI = async (reqBody) => {
    return await commonAPI("POST", "users/register", reqBody);
};

export const loginAPI = async (reqBody) => {
    return await commonAPI("POST", "users/login", reqBody);
};

export const googleAuthAPI = async (reqBody) => {
    return await commonAPI("POST", "users/google", reqBody);
};

export const chooseUsernameAPI = async (reqBody, reqHeader) => {
    return await commonAPI("PATCH", "users/username", reqBody, reqHeader);
};

export const forgotPasswordAPI = async (reqBody) => {
    return await commonAPI("POST", "users/forgot-password", reqBody);
};

export const resetPasswordAPI = async (reqBody) => {
    return await commonAPI("POST", "users/reset-password", reqBody);
};

export const verifyEmailAPI = async (reqBody) => {
    return await commonAPI("POST", "users/verify-email", reqBody);
};

export const resendVerificationAPI = async (reqBody) => {
    return await commonAPI("POST", "users/resend-verification", reqBody);
};

export const getUserProfileAPI = async (reqHeader) => {
    return await commonAPI("GET", "users/profile", "", reqHeader);
}

export const editUserProfileAPI = async (reqBody, reqHeader) => {
    return await commonAPI("PATCH", "users/profile", reqBody, reqHeader);
};

export const getAllUsersAPI = async (reqHeader) => {
    return await commonAPI("GET", "users/all", "", reqHeader);
};

export const createOrGetChatAPI = async (reqBody, reqHeader) => {
    return await commonAPI("POST", "chats", reqBody, reqHeader);
};

export const getMyChatsAPI = async (reqHeader) => {
    return await commonAPI("GET", "chats", "", reqHeader);
};

export const sendMessageAPI = async (reqBody, reqHeader) => {
    return await commonAPI("POST", "messages", reqBody, reqHeader);
};

export const getChatMessagesAPI = async (chatId, reqHeader) => {
    return await commonAPI("GET", `messages/chat/${chatId}`, "", reqHeader);
};

export const markMessagesAsReadAPI = async (chatId, reqHeader) => {
    return await commonAPI("PATCH", `messages/read/${chatId}`, "", reqHeader);
};

export const markMessagesAsDeliveredAPI = async (chatId, reqHeader) => {
    return await commonAPI("PATCH", `messages/delivered/${chatId}`, "", reqHeader);
};

export const togglePinMessageAPI = async (messageId, reqHeader) => {
    return await commonAPI("PATCH", `messages/pin/${messageId}`, "", reqHeader);
};

export const deleteMessageAPI = async (messageId, reqHeader) => {
    return await commonAPI("DELETE", `messages/${messageId}`, "", reqHeader);
};

export const editMessageAPI = async (messageId, reqBody, reqHeader) => {
    return await commonAPI("PATCH", `messages/${messageId}`, reqBody, reqHeader);
};

export const updateChatWallpaperAPI = async (reqBody, reqHeader) => {
    return await commonAPI("PATCH", "users/wallpaper", reqBody, reqHeader);
};

export const updateUserSettingsAPI = async (reqBody, reqHeader) => {
    return await commonAPI("PATCH", "users/settings", reqBody, reqHeader);
};

export const changePasswordAPI = async (reqBody, reqHeader) => {
    return await commonAPI("PATCH", "users/password", reqBody, reqHeader);
};

export const forwardMessageAPI = async (reqBody, reqHeader) => {
    return await commonAPI("POST", "messages/forward", reqBody, reqHeader);
};

export const toggleBlockUserAPI = async (userId, reqHeader) => {
    return await commonAPI("PATCH", `users/block/${userId}`, "", reqHeader);
};

export const deleteChatAPI = async (chatId, reqHeader) => {
    return await commonAPI("DELETE", `chats/${chatId}`, "", reqHeader);
};

export const clearChatAPI = async (chatId, reqHeader) => {
    return await commonAPI("DELETE", `messages/chat/${chatId}`, "", reqHeader);
};

export const reportUserAPI = async (userId, reqBody, reqHeader) => {
    return await commonAPI("POST", `users/report/${userId}`, reqBody, reqHeader);
};

// ── Groups ───────────────────────────────────────────────────────────────────
export const createGroupAPI = async (reqBody, reqHeader) => {
    return await commonAPI("POST", "chats/group", reqBody, reqHeader);
};

export const getChatByIdAPI = async (chatId, reqHeader) => {
    return await commonAPI("GET", `chats/${chatId}`, "", reqHeader);
};

export const updateGroupAPI = async (chatId, reqBody, reqHeader) => {
    return await commonAPI("PATCH", `chats/${chatId}/group`, reqBody, reqHeader);
};

export const addGroupMembersAPI = async (chatId, reqBody, reqHeader) => {
    return await commonAPI("POST", `chats/${chatId}/members`, reqBody, reqHeader);
};

export const removeGroupMemberAPI = async (chatId, userId, reqHeader) => {
    return await commonAPI("DELETE", `chats/${chatId}/members/${userId}`, "", reqHeader);
};

export const setGroupAdminAPI = async (chatId, userId, reqBody, reqHeader) => {
    return await commonAPI("PATCH", `chats/${chatId}/members/${userId}/admin`, reqBody, reqHeader);
};

export const updateGroupPermissionsAPI = async (chatId, reqBody, reqHeader) => {
    return await commonAPI("PATCH", `chats/${chatId}/permissions`, reqBody, reqHeader);
};

export const leaveGroupAPI = async (chatId, reqHeader) => {
    return await commonAPI("POST", `chats/${chatId}/leave`, "", reqHeader);
};

export const deleteGroupAPI = async (chatId, reqHeader) => {
    return await commonAPI("DELETE", `chats/${chatId}/group`, "", reqHeader);
};

export const reportChatAPI = async (chatId, reqBody, reqHeader) => {
    return await commonAPI("POST", `chats/${chatId}/report`, reqBody, reqHeader);
};

export const logCallAPI = async (reqBody, reqHeader) => {
    return await commonAPI("POST", "messages/call-log", reqBody, reqHeader);
};

// ── Bubbles AI ───────────────────────────────────────────────────────────────
export const chatWithAIAPI = async (reqBody, reqHeader) => {
    return await commonAPI("POST", "ai/chat", reqBody, reqHeader);
};

export const transcribeAudioAPI = async (reqBody, reqHeader) => {
    return await commonAPI("POST", "ai/transcribe", reqBody, reqHeader);
};