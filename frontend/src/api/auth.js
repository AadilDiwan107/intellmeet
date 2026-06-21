import axios from "axios";

const API = axios.post("http://localhost:5000/api/auth/login")

export const loginUser = (data) => API.post("/login", data);
export const signupUser = (data) => API.post("/register", data);
