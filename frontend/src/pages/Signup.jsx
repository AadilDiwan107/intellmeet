import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const { signup, loading } = useAuthStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password) {
      alert("Fill all fields");
      return;
    }

    const success = await signup(form);

    if (success) {
      navigate("/lobby"); // better flow
    } else {
      alert("Signup failed");
    }
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-dark position-relative overflow-hidden">

      {/* 🔥 BACKGROUND GLOW */}
      <div
        className="position-absolute top-0 start-50 translate-middle-x"
        style={{
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(0,123,255,0.25), transparent)",
          filter: "blur(120px)",
          zIndex: 0,
        }}
      />

      <div className="row w-100 justify-content-center" style={{ maxWidth: "420px", zIndex: 1 }}>
        <div className="col-12">

          {/* 💎 GLASS CARD */}
          <div
            className="p-4 shadow-lg"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              borderRadius: "20px",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "white",
            }}
          >

            {/* HEADER */}
            <div className="text-center mb-4">
              <h2 className="fw-bold text-white">IntellMeet</h2>
              <p className="text-light small">
                Create your account
              </p>
            </div>

            {/* FORM */}
            <div className="d-flex flex-column gap-3">

              {/* NAME */}
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                type="text"
                placeholder="Name"
                className="form-control text-white border-0"
                style={{
                  background: "rgba(137, 168, 164, 0.4)",
                  borderRadius: "10px",
                }}
              />

              {/* EMAIL */}
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                type="email"
                placeholder="Email"
                className="form-control text-white border-0"
                style={{
                  background: "rgba(137, 168, 164, 0.4)",
                  borderRadius: "10px",
                }}
              />

              {/* PASSWORD */}
              <input
                name="password"
                value={form.password}
                onChange={handleChange}
                type="password"
                placeholder="Password"
                className="form-control text-white border-0"
                style={{
                  background: "rgba(137, 168, 164, 0.4)",
                  borderRadius: "10px",
                }}
              />

              {/* BUTTON */}
              <button
                onClick={handleSubmit}
                className="btn w-100 fw-semibold"
                style={{
                  background: "linear-gradient(135deg, #0d6efd, #3b82f6)",
                  border: "none",
                  borderRadius: "10px",
                }}
              >
                {loading ? "Please wait..." : "Signup"}
              </button>

              {/* LOGIN */}
              <p
                className="text-center text-light small mt-2"
                style={{ cursor: "pointer" }}
                onClick={() => navigate("/login")}
              >
                Already have an account?{" "}
                <span className="text-info fw-semibold">Login</span>
              </p>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;