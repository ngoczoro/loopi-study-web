/**
 * Auth utilities cho mock system
 * Quản lý localStorage, OTP, và user authentication
 */

const USERS_KEY = "loopi_users";
const OTP_KEY = "loopi_otp";
const OTP_EXPIRY_MINS = 2;

// ========== localStorage Helpers ==========

/**
 * Lấy danh sách users từ localStorage
 * Nếu không có, khởi tạo với mock data
 */
export function getUsers() {
  try {
    const stored = localStorage.getItem(USERS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error reading users from localStorage:", e);
  }

  // Default mock users (chỉ khi localStorage trống)
  const defaultUsers = [
    {
      id: "admin1",
      username: "Admin",
      email: "admin@studybeaver.com",
      password: "admin123",
      role: "admin",
      locked: false,
      createdAt: "Jan 01",
    },
    {
      id: "u1",
      username: "Alice",
      email: "alice@example.com",
      password: "alice123",
      role: "student",
      locked: false,
      createdAt: "Feb 10",
    },
    {
      id: "u2",
      username: "Bob",
      email: "bob@example.com",
      password: "bob123",
      role: "student",
      locked: false,
      createdAt: "Feb 15",
    },
    {
      id: "u3",
      username: "Charlie",
      email: "charlie@example.com",
      password: "charlie123",
      role: "student",
      locked: true,
      createdAt: "Mar 01",
    },
  ];

  localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
  return defaultUsers;
}

/**
 * Lưu users vào localStorage
 */
export function saveUsers(users) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return true;
  } catch (e) {
    console.error("Error saving users to localStorage:", e);
    return false;
  }
}

// ========== OTP Helpers ==========

/**
 * Generate OTP 6 số
 */
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Lưu OTP vào localStorage
 * Format: { email: "...", code: "123456", expiresAt: timestamp }
 */
export function saveOTP(email, code) {
  try {
    const expiresAt = Date.now() + OTP_EXPIRY_MINS * 60 * 1000;
    const otpData = {
      email: email.toLowerCase(),
      code,
      expiresAt,
    };

    localStorage.setItem(OTP_KEY, JSON.stringify(otpData));

    // Log to console for testing
    console.log(
      `🔐 OTP for ${email}: ${code} (valid for ${OTP_EXPIRY_MINS} min)`,
    );

    return otpData;
  } catch (e) {
    console.error("Error saving OTP to localStorage:", e);
    return null;
  }
}

/**
 * Lấy OTP hiện tại từ localStorage
 */
export function getOTP() {
  try {
    const stored = localStorage.getItem(OTP_KEY);
    if (!stored) return null;

    const otpData = JSON.parse(stored);

    // Kiểm tra hết hạn
    if (Date.now() > otpData.expiresAt) {
      clearOTP();
      return null;
    }

    return otpData;
  } catch (e) {
    console.error("Error reading OTP from localStorage:", e);
    return null;
  }
}

/**
 * Xóa OTP khỏi localStorage
 */
export function clearOTP() {
  try {
    localStorage.removeItem(OTP_KEY);
    return true;
  } catch (e) {
    console.error("Error clearing OTP from localStorage:", e);
    return false;
  }
}

/**
 * Xác minh OTP
 * Return: { valid: boolean, reason?: string }
 */
export function verifyOTP(email, inputCode) {
  const otpData = getOTP();

  if (!otpData) {
    return { valid: false, reason: "no-otp" }; // Không có OTP hoặc đã hết hạn
  }

  if (otpData.email !== email.toLowerCase()) {
    return { valid: false, reason: "email-mismatch" }; // Email không khớp
  }

  if (otpData.code !== inputCode) {
    return { valid: false, reason: "invalid-code" }; // Mã sai
  }

  clearOTP(); // Xóa OTP sau verify thành công
  return { valid: true };
}

// ========== User Auth Helpers ==========

/**
 * Đăng nhập với email + password
 */
export function loginUser(email, password) {
  const users = getUsers();
  const normalizedEmail = email.trim().toLowerCase();

  const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    return { ok: false, reason: "not-found" };
  }

  if (user.locked) {
    return { ok: false, reason: "locked" };
  }

  if (user.password !== password) {
    return { ok: false, reason: "invalid-password" };
  }

  return { ok: true, user };
}

/**
 * Đăng ký user mới
 */
export function registerUserAuth(username, email, password) {
  const users = getUsers();
  const normalizedEmail = email.trim().toLowerCase();

  // Kiểm tra email tồn tại
  if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    return { ok: false, reason: "email-exists" };
  }

  // Tạo user mới
  const newUser = {
    id: Math.random().toString(36).slice(2, 10),
    username,
    email: normalizedEmail,
    password,
    role: "student",
    locked: false,
    createdAt: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
    }),
  };

  users.push(newUser);
  saveUsers(users);

  return { ok: true, user: newUser };
}

/**
 * Reset password
 */
export function resetPasswordAuth(email, newPassword) {
  const users = getUsers();
  const normalizedEmail = email.trim().toLowerCase();

  const userIdx = users.findIndex(
    (u) => u.email.toLowerCase() === normalizedEmail,
  );

  if (userIdx === -1) {
    return { ok: false, reason: "not-found" };
  }

  users[userIdx].password = newPassword;
  saveUsers(users);

  return { ok: true, user: users[userIdx] };
}

/**
 * Cek user tồn tại theo email
 */
export function getUserByEmail(email) {
  const users = getUsers();
  const normalizedEmail = email.trim().toLowerCase();
  return users.find((u) => u.email.toLowerCase() === normalizedEmail) || null;
}
