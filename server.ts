import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

// Load Firebase configuration
const configPath = path.join(process.cwd(), "firebase-applet-config.json");
let firebaseConfig: any = {};
if (fs.existsSync(configPath)) {
  firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
}

// Initialize Firebase for server
const firebaseApp = initializeApp(firebaseConfig);
const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId)
  : getFirestore(firebaseApp);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());


  // API Route: Send reset password verification code
  app.post("/api/forgot-password/send", async (req: any, res: any) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, error: "請提供 Email 信箱！" });
      }

      const emailLower = email.trim().toLowerCase();

      // 1. Verify user exists in Firestore 'users' collection
      const userRef = doc(db, "users", emailLower);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        return res.status(404).json({
          success: false,
          error: "此 Email 尚未註冊，請確認輸入是否正確！",
        });
      }

      // 2. Generate random 6-digit verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes from now

      // 3. Save code to Firestore 'resets' collection
      const resetRef = doc(db, "resets", emailLower);
      await setDoc(resetRef, {
        email: emailLower,
        code: verificationCode,
        expiresAt,
      });

      // 4. Send email using Nodemailer
      const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
      const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
      
      // Use the dedicated SMTP credentials provided by the user
      const smtpUser = "ntsupport00010@gmail.com";
      const smtpPass = "ahgt oazx rxjg juxq";
      const smtpFrom = "ntsupport00010@gmail.com";

      console.log(`[SMTP] Attempting to send verification email to: ${emailLower}`);
      console.log(`[SMTP] Host: ${smtpHost}:${smtpPort}, User: ${smtpUser}`);

      // Check if SMTP is configured
      if (!smtpUser || !smtpPass) {
        console.warn("SMTP settings are not configured in environment variables!");
        return res.json({
          success: true,
          smtpConfigured: false,
          codePreview: verificationCode, // Return in response only if SMTP is not configured for easy testing
          message: "您的帳號已驗證成功！但由於系統端尚未配置郵件發送服務 (SMTP_USER 與 SMTP_PASS)，因此無法發送真實信件。開發測試用驗證碼已生成，請見說明。",
        });
      }

      // Create Transporter
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const mailOptions = {
        from: `"實習手冊帳戶系統" <${smtpFrom}>`,
        to: emailLower,
        subject: "🔒 實習手冊帳戶系統 - 帳號密碼重設安全驗證碼",
        html: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
            <div style="text-align: center; border-bottom: 2px solid #ec4899; padding-bottom: 15px; margin-bottom: 20px;">
              <h2 style="color: #ec4899; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px;">實習手冊帳戶系統</h2>
              <p style="color: #64748b; font-size: 13px; margin: 5px 0 0 0;">Internship Manual Account System</p>
            </div>
            
            <div style="padding: 10px 0;">
              <p style="font-size: 15px; color: #334155; line-height: 1.6; margin-bottom: 10px;">
                您好：<br>
                系統收到您為此電子信箱提出「重設登入密碼」的申請。為了確保是您本人操作，請使用下方提供的安全驗證碼：
              </p>
              
              <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #fdf2f8; border-radius: 16px; border: 1px solid #fbcfe8;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #db2777; display: block; margin-bottom: 5px;">
                  ${verificationCode}
                </span>
                <span style="font-size: 11px; color: #9d174d; display: block; font-weight: 600;">
                  (本驗證碼 10 分鐘內有效，且僅能使用一次)
                </span>
              </div>
              
              <p style="font-size: 13px; color: #64748b; line-height: 1.6;">
                請在系統介面中輸入此驗證碼，以進行下一步重設您的新密碼。
              </p>
              
              <div style="background-color: #f8fafc; border-left: 4px solid #94a3b8; padding: 12px; margin-top: 25px; border-radius: 4px;">
                <p style="font-size: 11px; color: #475569; margin: 0; line-height: 1.5;">
                  <strong>安全提示：</strong><br>
                  如果您並未提出此重設密碼申請，請忽略此封郵件，您的帳號目前依然安全無虞。請勿將驗證碼提供給任何人。
                </p>
              </div>
            </div>
            
            <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 25px; font-size: 11px; color: #94a3b8;">
              <p style="margin: 0;">此信件由系統自動發出，請勿直接回覆。</p>
              <p style="margin: 5px 0 0 0;">© 2026 實習手冊帳戶系統 All Rights Reserved.</p>
            </div>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);

      res.json({
        success: true,
        smtpConfigured: true,
        message: "安全驗證碼已成功寄送到您的 Email 電子信箱，請至信箱收取並填寫！",
      });
    } catch (err: any) {
      console.error("Nodemailer send email error:", err);
      
      const errMsg = err.message || "";
      if (errMsg.includes("535") || errMsg.includes("Invalid login") || errMsg.includes("Username and Password not accepted")) {
        return res.status(500).json({ 
          success: false, 
          error: "【SMTP 登入驗證失敗 (535)】\n由於 Google 的安全保護機制，Nodemailer 不能直接使用您的「一般 Google 密碼」來登入。\n\n💡 請依照以下步驟排除：\n1. 前往您的 Google 帳戶安全設定 (https://myaccount.google.com/security)\n2. 確定已啟用「兩步驟驗證」(2-Step Verification)\n3. 搜尋「應用程式密碼」(App Passwords)\n4. 建立一組供「郵件」使用的新密碼，系統會產生一組 16 字元的專用密碼\n5. 回到本專案右上的「Settings」設定，將您的 SMTP_PASS 欄位更新為此「16字元專用密碼」後重試！"
        });
      }
      
      res.status(500).json({ success: false, error: "寄送電子郵件時發生錯誤: " + err.message });
    }
  });

  // API Route: Verify reset password code
  app.post("/api/forgot-password/verify", async (req: any, res: any) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        return res.status(400).json({ success: false, error: "請填寫 Email 與驗證碼！" });
      }

      const emailLower = email.trim().toLowerCase();
      const resetRef = doc(db, "resets", emailLower);
      const resetDoc = await getDoc(resetRef);

      if (!resetDoc.exists()) {
        return res.status(400).json({ success: false, error: "驗證碼不正確或已過期，請重新申請！" });
      }

      const resetData = resetDoc.data();
      if (resetData.code !== code.trim()) {
        return res.status(400).json({ success: false, error: "驗證碼錯誤，請仔細檢查輸入！" });
      }

      if (Date.now() > resetData.expiresAt) {
        return res.status(400).json({ success: false, error: "驗證碼已過期，請重新發送！" });
      }

      res.json({ success: true, message: "身分驗證成功！" });
    } catch (err: any) {
      console.error("Verify code error:", err);
      res.status(500).json({ success: false, error: "伺服器驗證失敗: " + err.message });
    }
  });

  // API Route: Reset password
  app.post("/api/forgot-password/reset", async (req: any, res: any) => {
    try {
      const { email, code, newPassword } = req.body;
      if (!email || !code || !newPassword) {
        return res.status(400).json({ success: false, error: "請填寫完整必填資料！" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, error: "新密碼長度至少需有 6 個字元！" });
      }

      const emailLower = email.trim().toLowerCase();

      // Verify the code matches one last time to prevent direct bypass
      const resetRef = doc(db, "resets", emailLower);
      const resetDoc = await getDoc(resetRef);

      if (!resetDoc.exists()) {
        return res.status(400).json({ success: false, error: "驗證逾時或失效，請重新操作！" });
      }

      const resetData = resetDoc.data();
      if (resetData.code !== code.trim() || Date.now() > resetData.expiresAt) {
        return res.status(400).json({ success: false, error: "驗證碼無效或已過期！" });
      }

      // Update user password in 'users' collection
      const userRef = doc(db, "users", emailLower);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        return res.status(404).json({ success: false, error: "找不到對應的使用者帳號！" });
      }

      const userData = userDoc.data();
      await setDoc(userRef, {
        ...userData,
        password: newPassword,
      });

      // Cleanup the reset code from Firestore
      await deleteDoc(resetRef);

      res.json({ success: true, message: "密碼重設成功！請使用您的新密碼登入。" });
    } catch (err: any) {
      console.error("Reset password server error:", err);
      res.status(500).json({ success: false, error: "重設密碼失敗: " + err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
