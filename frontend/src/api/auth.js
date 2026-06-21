import axios from "axios";

const API = axios.create({
  baseURL: "https://intellmeet-1-79gh.onrender.com/api/auth",
});

export const loginUser = (data) => API.post("/login", data);

export const signupUser = (data) => API.post("/register", data);
