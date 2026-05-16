import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import loopyHappy from "@/assets/loopy-happy.png";
import { toast } from "sonner";
import { ArrowLeft, Loader } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const navigate = useNavigate();
  const {
    register,
    login,
    verifyOTP,
    resendOTP,
    forgotPassword,
    resetPassword,
    verifyResetOTP,
    isLoading,
    email: storedEmail,
  } = useAuth();

  const [view, setView] = useState("login");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
  });
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [otpPurpose, setOtpPurpose] = useState(""); // "login" | "register" | "forgot"
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);

  const otpRefs = useRef([]);

  // Auto redirect if already logged in
  useEffect(() => {
    if (JSON.parse(localStorage.getItem("auth-store") || "{}")?.state?.user) {
      navigate("/");
    }
  }, [navigate]);

  // Timer countdown for resend
  useEffect(() => {
    if (timer <= 0) {
      setCanResend(true);
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
    });
    setOtp(["", "", "", "", "", ""]);
    setOtpError("");
    setOtpPurpose("");
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!formData.email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Please enter a valid email");
      return;
    }

    if (!formData.password.trim()) {
      toast.error("Please enter your password");
      return;
    }

    const result = await login(formData.email, formData.password);

    if (result.success) {
      toast.success(`Welcome back! 🐾`);
      resetForm();
      navigate(result.data.user.role === "admin" ? "/admin" : "/");
    } else {
      // Better error messages for different scenarios
      if (
        result.message?.toLowerCase().includes("verify") ||
        result.message?.toLowerCase().includes("email")
      ) {
        toast.error("Please verify your email first");
      } else if (result.message?.toLowerCase().includes("banned")) {
        toast.error("This account has been banned");
      } else if (result.message?.toLowerCase().includes("invalid")) {
        toast.error("Invalid email or password");
      } else {
        toast.error(result.message || "Login failed");
      }
    }
  };

  // Register handler
  const handleRegister = async (e) => {
    e.preventDefault();

    if (
      !formData.fullName.trim() ||
      !formData.email.trim() ||
      !formData.password.trim() ||
      !formData.confirmPassword.trim()
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    const result = await register(
      formData.email,
      formData.password,
      formData.confirmPassword,
      formData.fullName,
    );

    if (result.success) {
      toast.success("Account created! Check your email for OTP.");
      // Keep email for OTP verification
      setFormData({
        email: formData.email,
        password: "",
        confirmPassword: "",
        fullName: "",
      });
      setOtpPurpose("register");
      setOtp(["", "", "", "", "", ""]);
      setOtpError("");
      setView("otp-verify");
      setTimer(300);
      setCanResend(false);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } else {
      // Check if email already exists
      if (
        result.message?.toLowerCase().includes("already") ||
        result.message?.toLowerCase().includes("exist")
      ) {
        toast.error(
          "Email already registered. Please login or use another email.",
        );
      } else {
        toast.error(result.message || "Registration failed");
      }
    }
  };

  // Verify OTP handler
  const handleVerifyOtp = async () => {
    if (otpValue.length < 6) {
      setOtpError("Please enter all 6 digits");
      return;
    }

    let result;
    if (otpPurpose === "forgot") {
      result = await verifyResetOTP(formData.email, otpValue);
    } else {
      result = await verifyOTP(formData.email, otpValue);
    }

    if (result.success) {
      if (otpPurpose === "register") {
        toast.success("Email verified! You can now login.");
        // Keep email for login, clear password fields
        setFormData({
          ...formData,
          password: "",
          confirmPassword: "",
          fullName: "",
        });
        setOtp(["", "", "", "", "", ""]);
        setOtpError("");
        setOtpPurpose("");
        setView("login");
      } else if (otpPurpose === "forgot") {
        toast.success("OTP verified! Set your new password.");
        // We keep the OTP digits so resetPassword can use them
        setOtpError("");
        setView("reset-password");
      }
    } else {
      setOtpError(result.message || "Invalid OTP");
      toast.error(result.message || "OTP verification failed");
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (!canResend) {
      toast.error("Please wait before requesting a new OTP");
      return;
    }

    const type = otpPurpose === "register" ? "REGISTER" : "FORGOT_PASSWORD";
    const result = await resendOTP(formData.email, type);

    if (result.success) {
      toast.success("New OTP sent to your email");
      setOtp(["", "", "", "", "", ""]);
      setOtpError("");
      setTimer(300);
      setCanResend(false);
      otpRefs.current[0]?.focus();
    } else {
      toast.error(result.message || "Failed to resend OTP");
    }
  };

  // Forgot password handler
  const handleForgotSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Please enter a valid email");
      return;
    }

    // Request OTP for forgot password
    const result = await forgotPassword(formData.email);
    if (result.success) {
      toast.success("OTP sent to your email");
      // Keep email for OTP verification
      setFormData({
        email: formData.email,
        password: "",
        confirmPassword: "",
        fullName: "",
      });
      setOtpPurpose("forgot");
      setOtp(["", "", "", "", "", ""]);
      setOtpError("");
      setView("forgot-otp");
      setTimer(300);
      setCanResend(false);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } else {
      toast.error(
        result.message ||
          "No account found for this email or failed to send OTP",
      );
    }
  };

  // Reset password handler (after OTP verification in forgot flow)
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!formData.password.trim() || !formData.confirmPassword.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    const result = await resetPassword(
      formData.email,
      otpValue,
      formData.password,
      formData.confirmPassword,
    );
    if (result.success) {
      toast.success(
        "Password reset successfully! Please login with your new password.",
      );
      resetForm();
      setView("login");
    } else {
      toast.error(result.message || "Password reset failed");
    }
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
            disabled={isLoading}
            className={`w-11 h-12 rounded-xl bg-background text-center text-lg font-bold text-foreground border ${
              otpError
                ? "border-destructive ring-2 ring-destructive/20"
                : "border-border focus:ring-2 focus:ring-primary/30"
            } outline-none transition-all disabled:bg-gray-100`}
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
            Loopi Study
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
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleFormChange}
                    disabled={isLoading}
                    className="w-full h-11 rounded-xl bg-background px-4 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none disabled:bg-gray-100"
                  />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleFormChange}
                    disabled={isLoading}
                    className="w-full h-11 rounded-xl bg-background px-4 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none disabled:bg-gray-100"
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-soft-md hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader size={16} className="animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      "Log In"
                    )}
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
                    name="fullName"
                    placeholder="Full Name"
                    value={formData.fullName}
                    onChange={handleFormChange}
                    disabled={isLoading}
                    className="w-full h-11 rounded-xl bg-background px-4 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none disabled:bg-gray-100"
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleFormChange}
                    disabled={isLoading}
                    className="w-full h-11 rounded-xl bg-background px-4 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none disabled:bg-gray-100"
                  />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password (min 8 characters)"
                    value={formData.password}
                    onChange={handleFormChange}
                    disabled={isLoading}
                    className="w-full h-11 rounded-xl bg-background px-4 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none disabled:bg-gray-100"
                  />
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleFormChange}
                    disabled={isLoading}
                    className="w-full h-11 rounded-xl bg-background px-4 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none disabled:bg-gray-100"
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-soft-md hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader size={16} className="animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
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
                <BackButton
                  to={otpPurpose === "login" ? "login" : "register"}
                />
                <div className="text-center mb-5">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">✉️</span>
                  </div>
                  <h2 className="text-lg font-display font-semibold text-foreground">
                    Verify Your Email
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the 6-digit code sent to{" "}
                    <span className="font-medium text-foreground">
                      {formData.email}
                    </span>
                  </p>
                </div>
                <div className="space-y-4">
                  <OtpInputRow />
                  <button
                    onClick={handleVerifyOtp}
                    disabled={otpValue.length < 6 || isLoading}
                    className="w-full h-11 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-soft-md hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader size={16} className="animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify & Continue"
                    )}
                  </button>
                  <button
                    onClick={handleResendOtp}
                    disabled={!canResend || isLoading}
                    className="w-full text-center text-sm text-primary hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {canResend
                      ? "Resend OTP"
                      : `Resend in ${formatTime(timer)}`}
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
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleFormChange}
                    disabled={isLoading}
                    className="w-full h-11 rounded-xl bg-background px-4 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none disabled:bg-gray-100"
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-soft-md hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader size={16} className="animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send OTP"
                    )}
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
                    <span className="font-medium text-foreground">
                      {formData.email}
                    </span>
                  </p>
                </div>
                <div className="space-y-4">
                  <OtpInputRow />
                  <button
                    onClick={handleVerifyOtp}
                    disabled={otpValue.length < 6 || isLoading}
                    className="w-full h-11 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-soft-md hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader size={16} className="animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify OTP"
                    )}
                  </button>
                  <button
                    onClick={handleResendOtp}
                    disabled={!canResend || isLoading}
                    className="w-full text-center text-sm text-primary hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {canResend
                      ? "Resend OTP"
                      : `Resend in ${formatTime(timer)}`}
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
                    name="password"
                    placeholder="New Password (min 8 characters)"
                    value={formData.password}
                    onChange={handleFormChange}
                    disabled={isLoading}
                    className="w-full h-11 rounded-xl bg-background px-4 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none disabled:bg-gray-100"
                  />
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm New Password"
                    value={formData.confirmPassword}
                    onChange={handleFormChange}
                    disabled={isLoading}
                    className="w-full h-11 rounded-xl bg-background px-4 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none disabled:bg-gray-100"
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-soft-md hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader size={16} className="animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      "Reset Password"
                    )}
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
