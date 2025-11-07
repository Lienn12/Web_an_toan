# gen_weak_keys_no_base.py
# Chạy local: python gen_weak_keys_no_base.py [--count N] [--out FILE]
# Mặc định sinh 1000 key yếu và lưu vào weak_keys_N.txt
# LƯU Ý: chỉ dùng file này cho testing local/staging. KHÔNG đưa các key này vào production.

import random
import argparse
from datetime import datetime

# Danh sách mẫu nội bộ (dùng để sinh key yếu). Bạn không cần tạo file gì thêm.
base_common = [
    "123456","password","qwerty","111111","123123","admin","letmein","welcome",
    "iloveyou","abc123","passw0rd","password1","user","default","secret",
    "1234","0000","root","test","guest","admin123","qwerty123","login",
    "master","hello","freedom","qazwsx","trustno1","dragon","sunshine",
    "princess","welcome1","welcome123","password123","pass","access","oracle",
    "superuser","system","manager","operator","manager1","changeme","abcd1234",
    "1q2w3e","asdf1234","football","baseball","shadow","michael","pokemon",
    "batman","flower","hacker","whatever","computer","internet","monkey",
    "lovely","star","mustang","hello123","admin1","admin!","user123","user1"
]

# Prefix / suffix / numeric variants
prefixes = ["", "go", "my", "the", "jwt", "key", "me", "admin", "dev", "test", "svc"]
suffixes = ["", "!", "@", "#", "_", "-", "2023", "2024", "01", "99", "007", "00"]
nums = ["", "1", "12", "123", "1234", "2023", "2024", "99", "007", "000"]

def generate_variants(base_list, required_n):
    out = []
    # Generate deterministic expansion but will shuffle later
    for b in base_list:
        for p in prefixes:
            for s in suffixes:
                for num in nums:
                    candidate = f"{p}{b}{num}{s}"
                    out.append(candidate)
                    if len(out) >= required_n:
                        return out[:required_n]
    # If still not enough (unlikely), append simple weakXXX
    i = 0
    while len(out) < required_n:
        out.append(f"weak{i:04d}")
        i += 1
    return out[:required_n]

def main():
    parser = argparse.ArgumentParser(description="Generate weak keys for local testing")
    parser.add_argument("--count", "-c", type=int, default=1000, help="Số lượng key muốn tạo (mặc định 1000)")
    parser.add_argument("--out", "-o", type=str, default=None, help="Tên file output (mặc định weak_keys_<count>.txt)")
    args = parser.parse_args()

    n = max(1, args.count)
    out_name = args.out if args.out else f"weak_keys_{n}.txt"

    random.seed(42)  # deterministic shuffle for reproducibility
    keys = generate_variants(base_common, n)
    random.shuffle(keys)

    # Add header with metadata (optional)
    header = f"# Generated: {datetime.utcnow().isoformat()}Z\n# Count: {n}\n"
    with open(out_name, "w", encoding="utf-8") as f:
        f.write(header)
        for k in keys:
            f.write(k + "\n")

    print(f"Đã tạo {len(keys)} khóa yếu -> {out_name}")
    print("Mở file trong thư mục hiện tại để xem. KHÔNG chia sẻ file này công khai.")

if __name__ == "__main__":
    main()
