#Nhóm 9: 
- Nguyễn Văn Tú 22810310083
- Nguyễn Thị Liên 22810310123
- Mai Văn Hoàng 22810310128
---
# eSports Ranking System với Blockchain & JWT Security Analysis

## Giới thiệu

Hệ thống quản lý và xếp hạng eSports với tính năng lưu trữ bảng xếp hạng trên blockchain (đảm bảo tính minh bạch và không thể thay đổi). Đồng án kết hợp với đề tài **Web An Toàn**: Phân tích và khai thác lỗ hổng JWT bị ký sai hoặc không an toàn - demo crack JWT HS256 với key yếu.

### Tính năng chính

- Quản lý giải đấu, đội tuyển, cầu thủ
- Bảng xếp hạng được lưu trữ trên Blockchain (immutable)
- Phân tích bảo mật JWT: Demo khai thác JWT HS256 với thuật toán ký yếu
- Hệ thống phân phối phần thưởng qua Smart Contract
- Phân quyền: Admin, Team Manager, Player, User
- Kết nối ví blockchain (MetaMask)

---

## Công nghệ sử dụng

### Frontend
- **Framework**: React.js 18+ với Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router DOM v6
- **UI Components**: Headless UI, Heroicons
- **Blockchain**: Ethers.js
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast

### Backend
- **Runtime**: Node.js (Express.js)
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Token) - **có demo lỗ hổng HS256**
- **Blockchain**: Web3.js / Ethers.js
- **ORM/Query**: Raw SQL hoặc Sequelize
- **Security**: bcrypt, cors, helmet

### Blockchain
- **Network**: Ethereum Testnet (Sepolia/Goerli) hoặc Hardhat Local
- **Smart Contract**: Solidity
- **Wallet**: MetaMask

---

## Cấu trúc thư mục

### Frontend Structure
```
esports-ranking-frontend/
├── public/
│   └── assets/images/          # Hình ảnh tĩnh
├── src/
│   ├── assets/                 # Tài nguyên (images, icons, styles)
│   ├── components/
│   │   ├── common/            # Components tái sử dụng (Button, Modal, Table...)
│   │   ├── layout/            # Layout components (Header, Sidebar, Footer)
│   │   ├── auth/              # Components xác thực (LoginForm, RegisterForm)
│   │   ├── tournament/        # Components giải đấu
│   │   ├── team/              # Components đội tuyển
│   │   ├── player/            # Components cầu thủ
│   │   └── blockchain/        # Components blockchain (WalletConnect, Rewards)
│   ├── pages/
│   │   ├── public/            # Trang công khai (Home, Leaderboard)
│   │   ├── auth/              # Trang đăng nhập/đăng ký
│   │   ├── admin/             # Dashboard Admin
│   │   ├── team-manager/      # Dashboard Team Manager
│   │   ├── player/            # Dashboard Player
│   │   └── user/              # Dashboard User
│   ├── services/              # API services (authService, tournamentService...)
│   ├── hooks/                 # Custom React Hooks
│   ├── context/               # React Context (AuthContext, Web3Context)
│   ├── store/                 # Zustand store (state management)
│   ├── routes/                # Route definitions
│   ├── utils/                 # Utility functions (validators, formatters, blockchain)
│   ├── App.jsx
│   └── main.jsx
├── .env.example               # Environment variables template
├── package.json
└── tailwind.config.js
```

### Backend Structure
```
esports-ranking-backend/
├── src/
│   ├── config/
│   │   ├── config.js          # Database & app configuration
│   │   └── passport.js        # JWT strategy (có demo lỗ hổng)
│   ├── constant/
│   │   ├── ErrorCodes.js      # Error codes
│   │   ├── messageConstants.js # Message templates
│   │   └── roles.js           # User roles
│   ├── controllers/
│   │   ├── GameController.js  # Game/Tournament logic
│   │   ├── TeamController.js  # Team management
│   │   └── UserController.js  # User management
│   ├── helper/
│   │   ├── MailHelper.js      # Email utilities
│   │   └── MessageResponse.js # Response formatter
│   ├── middlewares/
│   │   ├── jwt_token.js       # JWT verification (SECURE)
│   │   └── jwt_token1.js      # JWT với lỗ hổng HS256 (DEMO)
│   ├── models/                # Database models
│   │   ├── Game.js
│   │   ├── Team.js
│   │   ├── User.js
│   │   ├── Tournament.js
│   │   ├── Ranking.js
│   │   └── Wallet.js
│   ├── response/
│   │   └── ResponseSuccess.js # Success response format
│   ├── routes/
│   │   ├── auth.route.js      # Authentication routes
│   │   ├── game.route.js      # Game/Tournament routes
│   │   ├── team.route.js      # Team routes
│   │   └── user.route.js      # User routes
│   ├── services/
│   │   ├── GameService.js     # Business logic cho games
│   │   ├── TeamService.js     # Business logic cho teams
│   │   └── UserService.js     # Business logic cho users
│   ├── views/                 # Email templates (nếu có)
│   └── server.js              # Entry point
├── contracts/                 # Smart contracts (Solidity)
├── scripts/                   # Deployment scripts
├── test/                      # Unit tests
├── .env                       # Environment variables
├── package.json
└── hardhat.config.js          # Hardhat config (nếu dùng)
```

---

## Hướng dẫn cài đặt & chạy

###  Yêu cầu môi trường

- **Node.js**: v18.x trở lên
- **npm** hoặc **yarn**
- **MySQL**: v8.0 trở lên
- **MetaMask**: Extension cho trình duyệt
- **Hardhat** (optional): Nếu chạy blockchain local

###  1. Clone repository

```bash
git clone <repository-url>
cd project_esports
```

###  2. Cài đặt Database

#### Tạo database MySQL

```sql
CREATE DATABASE esports_ranking;
USE esports_ranking;
```

#### Import database

```bash
mysql -u root -p esports_ranking < database/esports_ranking.sql
```

Hoặc import trực tiếp qua phpMyAdmin/MySQL Workbench.

#### Database Schema (các bảng chính)

- `users` - Người dùng (role: admin, team_manager, player, user)
- `teams` - Đội tuyển
- `team_members` - Thành viên đội
- `tournaments` - Giải đấu
- `matches` - Trận đấu
- `rankings` - Bảng xếp hạng (có hash blockchain)
- `wallets` - Ví blockchain của user/team
- `transactions` - Lịch sử giao dịch phần thưởng

### 🔧 3. Cấu hình Backend

#### Di chuyển vào thư mục backend

```bash
cd esports-ranking
```

#### Cài đặt dependencies

```bash
npm install
```

#### Tạo file `.env`

Copy từ `.env.example` và điền thông tin:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=esports_ranking

# JWT Settings
JWT_SECRET=your_super_secret_key_here
JWT_WEAK_SECRET=weak123        # Key yếu để demo lỗ hổng
JWT_EXPIRES_IN=7d

# Blockchain
BLOCKCHAIN_NETWORK=sepolia
PRIVATE_KEY=your_private_key
CONTRACT_ADDRESS=deployed_contract_address
INFURA_API_KEY=your_infura_key

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

#### Chạy backend

```bash
cd esports-ranking
npm npm run dev
```

Server sẽ chạy tại: `http://localhost:8081`

###  4. Cấu hình Frontend

#### Di chuyển vào thư mục frontend

```bash
cd ../frontend_bxh_esport

#### Cài đặt dependencies

```bash
npm install
```

#### Tạo file `.env`

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_BLOCKCHAIN_NETWORK=sepolia
VITE_CONTRACT_ADDRESS=deployed_contract_address
```

#### Chạy frontend

```bash
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

###  5. Deploy Smart Contract (Optional - Local Blockchain)

Nếu muốn chạy blockchain local:

```bash
cd esports-ranking
npx hardhat node                    # Terminal 1: Chạy local blockchain
npx hardhat run scripts/deploy.js   # Terminal 2: Deploy contract
```

Copy contract address vào file `.env` của cả backend và frontend.

---
⚠️ I. Mô hình demo

Hệ thống backend cung cấp hai middleware JWT:

Middleware	Mô tả	Mục đích
jwt_token.js	JWT chuẩn, bảo mật	Dùng trong hệ thống thật
jwt_token1.js	JWT HS256 với secret yếu (ví dụ "weak123")	Dùng để demo tấn công

Khi API dùng middleware jwt_token1.js, hacker có thể tấn công bằng cách:

Đọc JWT trả về từ backend

Brute force khóa bí mật HS256

Ký lại token theo ý muốn (role=admin)

Gửi token giả mạo để gọi API admin mà không bị 403

🧪 II. Demo Chi Tiết – Các Bước Khai Thác
1️⃣ Bước 1: Chạy file scripts_test.js

Mục tiêu: Đọc JWT từ response HTTP, đặc biệt khi server đang chạy HTTP (không bật HTTPS) và cookie không phải httpOnly → JS có thể đọc được.

Lệnh chạy:

node scripts_test.js


scripts_test.js sẽ:

Gửi request HTTP tới server

Lấy header và body phản hồi

Trích xuất JWT từ JSON hoặc Cookie

In ra token mà backend trả về

Ví dụ output:

Received JWT:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...


👉 Đây là token hacker sẽ dò khóa.

2️⃣ Bước 2: Brute Force JWT để tìm khóa bí mật

Chạy script:

node find_key.js


find_key.js chứa thuật toán brute-force dictionary cho HS256:

Lấy JWT từ output bước 1

Tách token ra thành header/payload/signature

Dò tất cả key trong dictionary (weak keys, “admin”, “123456”, “weak123”,…)

Với mỗi key → tính HMAC SHA256 → so với signature

Ví dụ output:

Found matching secret key: weak123


🎯 Hacker đã tìm được khóa bí mật của backend!

3️⃣ Bước 3: Tạo JWT giả mạo (Forge Token)

Hacker sửa payload:

{
  "id": 1,
  "email": "hacker@example.com",
  "role": "admin"
}


Sau đó ký lại:

node forge_token.js


Kết quả:

Forged JWT:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...


Token này có role: admin nhưng backend KHÔNG phát hiện được vì:

Backend dùng HS256

Secret key yếu (weak123)

Hacker đã tìm ra key

4️⃣ Bước 4: Gửi token giả mạo lên API admin
curl -X GET http://localhost:8081/api/admin/secret \
  -H "Authorization: Bearer eyJhbGciOi...(token forge)"

❗Kết quả:
200 OK
{
  "message": "Welcome admin!"
}


🎉 Leo quyền thành công – bypass toàn bộ phân quyền, dù hacker chỉ là user bình thường.

🛡️ III. Test lại với hệ thống đã được bảo vệ

Sau khi triển khai hệ thống đúng chuẩn bảo mật, nhóm thử tấn công lại.

1️⃣ Khi bật HTTPS

JavaScript không thể sniff request/response nếu website chạy qua HTTPS bảo mật.

2️⃣ Khi JWT được set với httpOnly cookie

Ví dụ:

res.cookie("accessToken", token, {
    httpOnly: true,
    secure: true,
    sameSite: "Strict"
});


Khi đó:

JS không thể đọc cookie

Không thể lấy JWT từ document.cookie

Không thể chạy brute-force vì hacker không có token để phân tích

Khi chạy lại scripts_test.js:

document.cookie → "" 
Cannot read JWT from client


💡 Đây là lý do mọi ứng dụng nên dùng httpOnly cookie thay vì localStorage để lưu JWT.

🚀 IV. Kết luận phần demo
Trạng thái hệ thống	Có thể tấn công?	Lý do
JWT HS256 + secret yếu + HTTP + cookie không httpOnly	✔️ Crack được	Hacker đọc token → brute force → forge token
JWT HS256 + secret mạnh + HTTPS + cookie httpOnly	❌ Không tấn công được	Không đọc được JWT → không thể brute force
JWT RS256 (public/private key)	❌ Không thể brute-force	Không có private key → không ký được token
🎯 Khuyến nghị bảo mật

Không dùng HS256 với secret đơn giản

Dùng RS256 (asymmetric)

Luôn set cookie httpOnly + secure

Luôn bật HTTPS

Không bao giờ lưu JWT trên localStorage
