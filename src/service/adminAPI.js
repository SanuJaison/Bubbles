import commonAPI from "./commonAPI";

const buildQuery = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    query.set(key, String(value));
  });

  const serialized = query.toString();

  return serialized ? `?${serialized}` : "";
};

export const getAdminMeAPI = async (reqHeader) => {
  return await commonAPI("GET", "admin/me", "", reqHeader);
};

export const getAdminOverviewAPI = async (reqHeader) => {
  return await commonAPI("GET", "admin/overview", "", reqHeader);
};

export const getAdminUsersAPI = async (params, reqHeader) => {
  return await commonAPI(
    "GET",
    `admin/users${buildQuery(params)}`,
    "",
    reqHeader,
  );
};

export const getAdminUserAPI = async (userId, reqHeader) => {
  return await commonAPI("GET", `admin/users/${userId}`, "", reqHeader);
};

export const getAdminFeedbackAPI = async (params, reqHeader) => {
  return await commonAPI(
    "GET",
    `admin/feedback${buildQuery(params)}`,
    "",
    reqHeader,
  );
};

export const updateAdminFeedbackStatusAPI = async (
  feedbackId,
  status,
  reqHeader,
) => {
  return await commonAPI(
    "PATCH",
    `admin/feedback/${feedbackId}`,
    { status },
    reqHeader,
  );
};
