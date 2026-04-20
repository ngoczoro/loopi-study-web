import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import loopyHappy from "@/assets/loopy-happy.png";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { useAppStore } from "@/lib/store";

export default function Login() {
  const navigate = useNavigate();

  const [view, setView] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpError, setOtpError] = useState("");

  const otpRefs = useRef([]);

  const generateOtp = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setOtpError("");
    toast.info(`OTP sent to ${email} (Demo: ${code})`);
    return code;
  };

  const resetForm = () => {
    setPassword("");
    setConfirmPassword("");
    setUsername("");
    setOtp(["", "", "", "", "", ""]);
    setOtpError("");
  };

  const handleOtpChange = useCallback(
    (index, value) => {
      const digit = value.replace(/\D/g, "");
      if (digit.length > 1) return;

      const newOtp = [...otp];
      newOtp[index] = digit;
      setOtp(newOtp);
      setOtpError("");

      if (digit && index < 5) {
        otpRefs.current[index + 1]?.focus();
      }
    },
    [otp],
  );

  const handleOtpKeyDown = useCallback(
    (index, e) => {
      if (e.key === "Backspace") {
        if (otp[index]) {
          const newOtp = [...otp];
          newOtp[index] = "";
          setOtp(newOtp);
        } else if (index > 0) {
          const newOtp = [...otp];
          newOtp[index - 1] = "";
          setOtp(newOtp);
          otpRefs.current[index - 1]?.focus();
        }
        e.preventDefault();
      }
    },
    [otp],
  );

  const handleOtpPaste = useCallback((e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (pasted.length > 0) {
      const newOtp = ["", "", "", "", "", ""];
      for (let i = 0; i < pasted.length; i++) {
        newOtp[i] = pasted[i];
      }
      setOtp(newOtp);
      setOtpError("");

      const focusIdx = Math.min(pasted.length, 5);
      otpRefs.current[focusIdx]?.focus();
    }
  }, []);

  const otpValue = otp.join("");

  const login = useAppStore((s) => s.login);
  const registerUser = useAppStore((s) => s.registerUser);

  const handleLogin = (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    const user = login(email, password);
    if (!user) {
      toast.error("Invalid credentials or account is locked");
      return;
    }

    toast.success(`Welcome back, ${user.username}! 🐾`);
    navigate(user.role === "admin" ? "/admin" : "/");
  };

  const handleRegister = (e) => {
    e.preventDefault();

    if (
      !username.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    generateOtp();
    setView("otp-verify");
  };

  const handleVerifyOtp = () => {
    if (otpValue.length < 6) {
      setOtpError("Please enter all 6 digits");
      return;
    }

    if (otpValue === generatedOtp) {
      registerUser(username, email);
      toast.success("Account created! Welcome! 🎉");
      navigate("/");
    } else {
      setOtpError("Invalid OTP. Please try again.");
      toast.error("Invalid OTP. Please try again.");
    }
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    generateOtp();
    setView("forgot-otp");
  };

  const handleForgotOtpVerify = () => {
    if (otpValue.length < 6) {
      setOtpError("Please enter all 6 digits");
      return;
    }

    if (otpValue === generatedOtp) {
      toast.success("OTP verified! Set your new password.");
      setOtp(["", "", "", "", "", ""]);
      setOtpError("");
      setView("reset-password");
    } else {
      setOtpError("Invalid OTP. Please try again.");
      toast.error("Invalid OTP. Please try again.");
    }
  };

  const handleResetPassword = (e) => {
    e.preventDefault();

    if (!password.trim() || !confirmPassword.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    toast.success("Password reset successfully! 🔑");
    resetForm();
    setView("login");
  };

  const OtpInputRow = () => (
    <div>
      <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => (otpRefs.current[i] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(i, e.target.value)}
            onKeyDown={(e) => handleOtpKeyDown(i, e)}
            autoFocus={i === 0}
            className={`w-11 h-12 rounded-xl bg-background text-center text-lg font-bold text-foreground border ${
              otpError
                ? "border-destructive ring-2 ring-destructive/20"
                : "border-border focus:ring-2 focus:ring-primary/30"
            } outline-none transition-all`}
          />
        ))}
      </div>

      {otpError && (
        <p className="text-xs text-destructive text-center mt-2">{otpError}</p>
      )}
    </div>
  );

  const BackButton = ({ to }) => (
    <button
      type="button"
      onClick={() => {
        resetForm();
        setView(to);
      }}
      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
    >
      <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
      Back
    </button>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <img
            src={loopyHappy}
            alt="Loopy"
            className="w-20 h-20 mx-auto mb-3"
          />
          <h1 className="text-2xl font-display font-bold text-foreground">
            StudyBeaver
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your cute study companion
          </p>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-soft-lg">
          <AnimatePresence mode="wait">
            {view === "login" && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="flex mb-6 bg-secondary/50 rounded-full p-1">
                  <button
                    onClick={() => setView("login")}
                    className="flex-1 h-9 rounded-full text-sm font-medium bg-primary text-primary-foreground shadow-soft transition-colors"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => {
                      resetForm();
                      setView("register");
                    }}
                    className="flex-1 h-9 rounded-full text-sm font-medium text-muted-foreground transition-colors"
                  >
                    Sign Up
                  </button>
                </div>
                <form onSubmit={handleLogin} className="space-y-3">
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 rounded-xl bg-background px-4 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 rounded-xl bg-background px-4 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full h-11 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-soft-md hover:scale-[1.02] active:scale-[0.98] transition-transform"
                  >
                    Log In
                  </button>
                </form>
                <button
                  onClick={() => {
                    resetForm();
                    setView("forgot");
                  }}
                  className="w-full text-center text-sm text-primary hover:underline mt-3"
                >
                  Forgot password?
                </button>
              </motion.div>
            )}

            {view === "register" && (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex mb-6 bg-secondary/50 rounded-full p-1">
                  <button
                    onClick={() => {
                      resetForm();
                      setView("login");
                    }}
                    className="flex-1 h-9 rounded-full text-sm font-medium text-muted-foreground transition-colors"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => setView("register")}
                    className="flex-1 h-9 rounded-full text-sm font-medium bg-primary text-primary-foreground shadow-soft transition-colors"
                  >
                    Sign Up
                  </button>
                </div>
                <form onSubmit={handleRegister} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full h-11 rounded-xl bg-background px-4 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 rounded-xl bg-background px-4 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 rounded-xl bg-background px-4 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-11 rounded-xl bg-background px-4 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full h-11 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-soft-md hover:scale-[1.02] active:scale-[0.98] transition-transform"
                  >
                    Create Account
                  </button>
                </form>
              </motion.div>
            )}

            {view === "otp-verify" && (
              <motion.div
                key="otp-verify"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <BackButton to="register" />
                <div className="text-center mb-5">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">✉️</span>
                  </div>
                  <h2 className="text-lg font-display font-semibold text-foreground">
                    Verify Your Email
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the 6-digit code sent to{" "}
                    <span className="font-medium text-foreground">{email}</span>
                  </p>
                </div>
                <div className="space-y-4">
                  <OtpInputRow />
                  <button
                    onClick={handleVerifyOtp}
                    disabled={otpValue.length < 6}
                    className="w-full h-11 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-soft-md hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:hover:scale-100"
                  >
                    Verify & Create Account
                  </button>
                  <button
                    onClick={generateOtp}
                    className="w-full text-center text-sm text-primary hover:underline"
                  >
                    Resend OTP
                  </button>
                </div>
              </motion.div>
            )}

            {view === "forgot" && (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <BackButton to="login" />
                <div className="text-center mb-5">
                  <h2 className="text-lg font-display font-semibold text-foreground">
                    Forgot Password?
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    We'll send a verification code to your email
                  </p>
                </div>
                <form onSubmit={handleForgotSubmit} className="space-y-3">
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 rounded-xl bg-background px-4 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full h-11 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-soft-md hover:scale-[1.02] active:scale-[0.98] transition-transform"
                  >
                    Send OTP
                  </button>
                </form>
              </motion.div>
            )}

            {view === "forgot-otp" && (
              <motion.div
                key="forgot-otp"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <BackButton to="forgot" />
                <div className="text-center mb-5">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">🔑</span>
                  </div>
                  <h2 className="text-lg font-display font-semibold text-foreground">
                    Enter OTP
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Code sent to{" "}
                    <span className="font-medium text-foreground">{email}</span>
                  </p>
                </div>
                <div className="space-y-4">
                  <OtpInputRow />
                  <button
                    onClick={handleForgotOtpVerify}
                    disabled={otpValue.length < 6}
                    className="w-full h-11 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-soft-md hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:hover:scale-100"
                  >
                    Verify OTP
                  </button>
                  <button
                    onClick={generateOtp}
                    className="w-full text-center text-sm text-primary hover:underline"
                  >
                    Resend OTP
                  </button>
                </div>
              </motion.div>
            )}

            {view === "reset-password" && (
              <motion.div
                key="reset"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <div className="text-center mb-5">
                  <h2 className="text-lg font-display font-semibold text-foreground">
                    Reset Password
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Create a new password for your account
                  </p>
                </div>
                <form onSubmit={handleResetPassword} className="space-y-3">
                  <input
                    type="password"
                    placeholder="New Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 rounded-xl bg-background px-4 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-11 rounded-xl bg-background px-4 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full h-11 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-soft-md hover:scale-[1.02] active:scale-[0.98] transition-transform"
                  >
                    Reset Password
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
