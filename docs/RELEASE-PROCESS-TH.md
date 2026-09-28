# ตรวจรุ่นก่อนแจก C Companion

GitHub repository นี้เป็น source สำหรับให้ผู้อื่นติดตั้งบนเครื่องของตนเอง ไม่เชื่อมกับการ deploy บน VPS ของผู้สร้าง

## ก่อนสร้างรุ่นแจก

1. ตรวจว่าไม่มี `.env`, กุญแจ, ฐานข้อมูล, backup หรือข้อมูลส่วนตัวใน Git ด้วย `git status --short` และ `git ls-files`.
2. รัน `npm ci`, `npm test`, `npx tsc --noEmit`, `npm run evaluate`, `npm run build`, `npx playwright install chromium` และ `npm run test:e2e`.
3. CI สร้างแอปด้วย Node 24 และ Docker แล้วตรวจว่า OCI image label `org.opencontainers.image.revision` ตรงกับ Git commit.
4. ดาวน์โหลด `release-manifest.json` จาก CI ของ commit ที่จะแจก ไฟล์นี้ระบุรุ่น, commit และ SHA-256 ของไฟล์ที่ติดตามใน Git.
5. ทดลองติดตั้งจาก GitHub clone ใหม่ในโฟลเดอร์อื่น โดยใช้บัญชี AI สำหรับทดสอบของผู้ติดตั้งเอง ตรวจถามคำถาม, อ้างอิง, การเปิดซ้ำ และการคงประวัติ.

อย่ากำหนดว่า CI ผ่านเท่ากับการตอบทุกคำถามถูกต้อง ให้ประเมินคำถามจริงและอ่านคำตอบด้วยคนเมื่อเตรียมรุ่นใหม่

## หากรุ่นใหม่มีปัญหา

ใช้ commit หรือ release ก่อนหน้าที่ผ่านเกณฑ์ด้วย source และ Docker image ที่ตรงกัน เก็บ Docker volume ของผู้ติดตั้งไว้ ห้ามใช้ `docker compose down -v` ก่อนย้อนรุ่น ตรวจ schema ก่อนย้อนรุ่นเมื่อมีการเปลี่ยนฐานข้อมูล และตรวจ `/api/health` กับประวัติสนทนาหลังเริ่มใหม่

## ขอบเขตสิทธิ์

MIT License ใช้กับโค้ด หนังสือและดัชนีใน `book/` มีสิทธิ์แยกตาม `book/NOTICE.md` ผู้ติดตั้งต้องใช้บริการ AI และบัญชีของตนเอง
