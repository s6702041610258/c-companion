# การใช้งานและดูแล C Companion
รุ่น 1.2.1 • ติดตั้ง Hermes Agent พร้อมเว็บด้วย Docker

## เริ่มใช้บนเครื่องใหม่
1. ติดตั้งและเปิด Docker Desktop หรือ Docker Engine + Compose
2. แตกชุดแจกลงโฟลเดอร์ใหม่ แล้วเปิด `Start.command` (Mac), `Start.bat` (Windows) หรือ `bash start.sh` (Linux)
3. เลือกผู้ให้บริการ AI เข้าสู่ระบบหรือกรอก API key แล้วเลือกโมเดลใน Hermes
4. หลังตรวจการตอบจริงผ่าน เปิด http://localhost:8091

ใช้ `bash start.sh --choose-model` หรือ `Start.bat -ChooseModel` เมื่อต้องการเปลี่ยนบัญชีหรือโมเดล Hermes และเว็บอยู่ใน Docker ชุดเดียวกัน ไม่มีการตั้ง Hermes URL เองหรือใช้บริการของผู้สร้าง

## คิวคำถาม
ประมวลผลพร้อมกัน 2 คำขอ รอคิวได้ 100 คำขอ รอได้สูงสุด 5 นาที และประมวลผลแต่ละคำขอไม่เกิน 100 วินาที
เป็นขีดจำกัดทรัพยากรพร้อมกัน ไม่ใช่โควตารายชั่วโมงหรือรายวัน หน้าเว็บแสดงสถานะและหยุดรอได้
บทสนทนาเดียวมีคำถามค้างได้ครั้งละหนึ่งคำถาม เพื่อรักษาลำดับบริบท คำถามมี request key ป้องกันการส่งซ้ำในคำขอเดียวกัน
เมื่อ restart งานที่ยังไม่เสร็จจะถูกทำเครื่องหมายให้ส่งใหม่ ไม่แสดงว่าตอบสำเร็จทั้งที่ข้อมูลไม่ครบ
การยกเลิก AI เป็น best effort ฝั่งผู้ให้บริการอาจยังประมวลผลต่อได้

## ตรวจระบบ
`docker compose ps`
`docker compose logs --tail=30 app backup monitor`
`docker compose exec monitor cat /state/status.json`
`docker compose exec app node ops/usage.mjs 7` ดูจำนวนครั้งและโทเคนที่ Hermes รายงานใน 7 วัน; ยอดเงินให้ดูที่ผู้ให้บริการ AI
health ตรวจแอปและฐานข้อมูล monitor ตรวจ Hermes /models, สำเนาที่เก่าเกิน 8 ชั่วโมง, พื้นที่ดิสก์เหลือน้อยกว่า 10%, และคำตอบล้มเหลวหลายครั้ง
การที่ /models ตอบได้ไม่รับประกันว่า AI จะสร้างทุกคำตอบได้
ตรวจทุกนาทีและบันทึกสถานะล่าสุดใน Docker volume พร้อมบันทึก log สำหรับการตรวจย้อนหลัง
monitor ทำงานบนเครื่องเดียวกับเว็บ จึงตรวจเหตุเครื่องปิดทั้งเครื่องไม่ได้

## สำรองและทดลองกู้
backup สร้าง SQLite snapshot ที่สอดคล้องกันขณะเว็บทำงานทุก 6 ชั่วโมง ตรวจ integrity และ SHA-256 แล้วเก็บ 28 ชุดล่าสุด
สั่งทันที: `docker compose exec backup node ops/backup.mjs --once`
ทดลองคืนสำเนาแยก: `docker compose exec backup node ops/restore-check.mjs /backups/<ชื่อไฟล์>.db`
การทดลองตรวจ hash, integrity, จำนวนข้อมูลทุกตาราง และความสามารถเขียนข้อมูล ใช้ /tmp และไม่ทับฐานข้อมูลจริง
สำเนาใน Docker volume บนเครื่องเดียวไม่ป้องกันการสูญเสียทั้งเครื่อง หากข้อมูลสำคัญควรส่งออกสำเนาไปเก็บที่อื่นด้วย
อย่าใช้ `docker compose down -v` กับระบบจริง
การกู้ฐานจริง: หยุด app ก่อน สำรองไฟล์ปัจจุบันไว้ ตรวจสำเนาที่เลือก แล้วจึงคืน tutor.db ใน volume พร้อมจัดการ WAL/SHM ที่หยุดใช้งานแล้วและสิทธิ์ให้ node จากนั้นเริ่ม app และตรวจแชท/รายงาน ห้ามคัดลอกฐานทับขณะ app ทำงาน

## รายงานปัญหา
`docker compose exec app node app/reports-cli.mjs list`
`docker compose exec app node app/reports-cli.mjs show <id>`
`docker compose exec app node app/reports-cli.mjs resolve <id>`
รายงานเก็บแยกจากแชท ไม่มีหน้าแอดมินสาธารณะหรือการตอบผู้รายงานอัตโนมัติ
แชทผูกกับ browser cookie ไม่มีบัญชีและไม่ sync ข้ามอุปกรณ์ การลบแชทลบข้อความและผลลัพธ์งานของแชทนั้น แต่ไม่ลบรายงานที่ส่งไว้แยกต่างหาก

## ตรวจรุ่นก่อนปล่อย
`docker compose build app`
`docker run --rm -v "$PWD:/app" -w /app node:24-alpine node --test app/*.test.mjs`
ชุด evaluation/cases.json มีคำถามครบ 12 บทและกรณีขอบ ผล keyword/เลขหน้าเป็นเพียงสัญญาณ ต้องตรวจเนื้อหากับหลักฐานจริงด้วย
การคอมไพล์ตัวอย่างทำใน container แยก ไม่มีฟีเจอร์รันโค้ดผู้เรียนบนเว็บ
ทดสอบแก้ไขผ่าน fresh-install หรือ staging ก่อนอัปเดต app ตรวจ health และเบราว์เซอร์หลังอัปเดต

## ย้อนรุ่น
จด image ID และ RELEASE_ID ก่อนปล่อย เปลี่ยน APP_IMAGE ใน .env เป็นรุ่นที่ทดสอบไว้ แล้ว `docker compose up -d --no-build app`
schema รุ่นนี้เป็นการเพิ่มตารางและดัชนี ไม่ลบข้อมูลเก่า รุ่นก่อนยังอ่านแชทเดิมได้
