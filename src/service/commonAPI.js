import axiosInstance from "./axiosInstance"

const commonAPI = async (httpMethod, url, reqBody, reqHeader) => {
    const reqConfig = {
        method: httpMethod,
        url,
        data: reqBody,
        headers: reqHeader
    }

    try {
        const response = await axiosInstance(reqConfig)
        return response
    } catch (error) {
        throw error
    }
}

export default commonAPI