import bcrypt from "bcrypt";
import models from "../models/index.js";
import { getAdminWallet } from "../utils/wallet.js";
import { ethers } from "ethers"; // <-- 1. Import Ethers

// --- 2. Khởi tạo Ethers Provider (một lần) ---
// Chúng ta giả định node Anvil/Hardhat đang chạy ở đây
// Dùng .env để lấy RPC_URL, nếu không thì dùng mặc định
const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
const provider = new ethers.JsonRpcProvider(rpcUrl);

/**
 * Hàm helper để "import và nạp tiền" vào Anvil/Hardhat
 * @param {string} walletAddress - Địa chỉ ví cần nạp
 * @param {string} amountEth - Số lượng ETH (dạng chuỗi)
 */
async function fundWalletOnAnvil(walletAddress, amountEth = "1000000000000") {
  try {
    console.log(`[ANVIL SYNC] Bắt đầu nạp ${amountEth} ETH cho ví ${walletAddress}...`);

    // 1. Impersonate (Giả mạo tài khoản)
    await provider.send("hardhat_impersonateAccount", [walletAddress]);

    // 2. Set balance (Nạp tiền)
    // Chuyển đổi số ETH (ví dụ "1000") thành số hex của Wei
    const hexBalance = "0x" + ethers.parseEther(amountEth).toString(16);
    await provider.send("hardhat_setBalance", [walletAddress, hexBalance]);

    // (Tùy chọn) Kiểm tra lại số dư
    const newBalance = await provider.getBalance(walletAddress);
    console.log(`[ANVIL SYNC] Thành công. Số dư mới: ${ethers.formatEther(newBalance)} ETH`);
  } catch (rpcErr) {
    // Đây là lỗi không nghiêm trọng, chỉ cảnh báo
    console.warn(`[ANVIL WARN] Không thể nạp tiền cho ví ${walletAddress}.`);
    console.warn(`[ANVIL WARN] Lỗi: ${rpcErr.message}. Node Anvil có đang chạy không?`);
  }
}

// --- 3. Hàm initAdminAccount (đã cập nhật) ---
export const initAdminAccount = async () => {
  try {
    const adminUsername = process.env.ADMIN_USERNAME || "admin123";
    let adminUser = await models.User.findOne({ where: { username: adminUsername } });

    let walletAddress; // Biến để lưu địa chỉ ví

    if (adminUser) {
      // Nếu Admin đã tồn tại
      console.log("Admin đã tồn tại:", adminUser.username);
      walletAddress = adminUser.wallet_address; // Lấy ví từ DB
    } else {
      // Nếu Admin chưa tồn tại -> Tạo mới
      console.log("Admin chưa tồn tại, đang khởi tạo...");
      const wallet = getAdminWallet();
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

      walletAddress = wallet.address; // Lấy ví từ thông tin mới tạo

      adminUser = await models.User.create({
        username: adminUsername,
        full_name: "System Admin",
        email: process.env.ADMIN_EMAIL,
        password: hashedPassword,
        role: 4,
        status: 1,
        deleted: 0,
        created_by: null,
        wallet_address: wallet.address,
        private_key: wallet.privateKey,
      });

      console.log("Admin khởi tạo thành công:", adminUser.username);
      console.log("Ví admin:", wallet.address);
    }

    // --- 4. TỰ ĐỘNG IMPORT VÀO ANVIL ---
    // Bất kể là admin cũ hay mới, chúng ta đều đảm bảo ví này
    // có tiền trên Anvil khi ứng dụng khởi động.
    if (!walletAddress) {
      console.error("Lỗi nghiêm trọng: Không thể xác định ví admin để nạp tiền.");
      return adminUser; // Vẫn return user
    }

    // Nạp số tiền cực lớn cho Admin
    const adminBalance = "1000000000000000"; // 1 Quadrillion ETH
    await fundWalletOnAnvil(walletAddress, adminBalance);

    return adminUser; // Trả về user đã tìm thấy hoặc mới tạo
  } catch (err) {
    console.error("initAdminAccount error:", err);
  }
};