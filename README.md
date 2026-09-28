# C Companion

เว็บติวภาษา C ภาษาไทยจากหนังสือที่แนบ พร้อม Hermes Agent ใน Docker ชุดเดียวกัน

## เริ่มใช้งานในภาพเดียว

![อินโฟกราฟิกแสดงวิธีโคลน ติดตั้ง เปิดเว็บ และลำดับการตอบคำถามของ C Companion](docs/images/c-companion-quick-start.png)

**รุ่น 1.1.1:** ชุดติดตั้งสำหรับใช้งานบนเครื่องของตนเอง โหมดสว่างใช้หน้าตาเดิมของ 1.0.0 และโหมดมืดเป็นพื้นดำตัดสีอำพัน ดูหลักฐานการตรวจและขอบเขตรุ่นใน [docs/RELEASE-GATE-TH.md](docs/RELEASE-GATE-TH.md)

Repository นี้เป็นชุดติดตั้งอิสระสำหรับผู้รับ ไม่มีขั้นตอน deploy ไปยัง VPS ของผู้สร้าง ผู้รับต้องใช้บัญชี AI ของตนเอง ดูขั้นตอนตรวจรุ่นและการย้อนรุ่นใน [docs/RELEASE-PROCESS-TH.md](docs/RELEASE-PROCESS-TH.md)

โค้ดเผยแพร่ภายใต้ [MIT License](LICENSE) โดย Mongkol Jadsakul ส่วนหนังสือ PDF และข้อความดัชนีใน `book/` เผยแพร่เพื่ออ่านและศึกษาตามการอนุญาตของเจ้าของลิขสิทธิ์ และไม่อยู่ภายใต้ MIT ดู [book/NOTICE.md](book/NOTICE.md)

## เริ่มใช้บนเครื่องอื่น

ต้องติดตั้งและเปิด Docker Desktop หรือ Docker Engine + Compose ก่อน ต้องมีอินเทอร์เน็ตและบัญชีผู้ให้บริการ AI ของผู้ติดตั้งเอง

1. แตกไฟล์ชุดแจกลงในโฟลเดอร์ใหม่
2. macOS: เปิด `Start.command` (หรือ `bash start.sh`), Windows: เปิด `Start.bat`, Linux: รัน `bash start.sh`
3. เลือกผู้ให้บริการ AI เข้าสู่ระบบหรือกรอก API key และเลือกโมเดลในหน้าตั้งค่าของ Hermes ที่เปิดขึ้น
4. เมื่อการทดสอบเชื่อมต่อผ่าน ระบบจะเปิด `http://localhost:8091` ให้ใช้งาน

ครั้งแรก Docker จะดาวน์โหลด Hermes และสร้างเว็บ ใช้เวลาตามความเร็วอินเทอร์เน็ต ครั้งถัดไปเปิดได้ด้วยไฟล์เดิม ไม่ต้องล็อกอินซ้ำหรือสร้างอิมเมจซ้ำ หากต้องการเปลี่ยนโมเดล ให้รัน `bash start.sh --choose-model` หรือบน Windows `Start.bat -ChooseModel` หากแก้โค้ดในชุดเดิมโดยไม่เปลี่ยนหมายเลขรุ่น ให้ใช้ `bash start.sh --rebuild` หรือ `Start.bat -Rebuild`

หากโคลนไว้แล้วและต้องการรับการแก้ไขล่าสุด บน Windows ให้เปิด PowerShell ในโฟลเดอร์โปรเจกต์แล้วรัน `git pull --ff-only` ตามด้วย `.\Start.bat -Rebuild` เพื่อสร้างเว็บจากโค้ดใหม่โดยเก็บประวัติใน Docker volume ไว้

ปุ่มรูปดวงจันทร์หรือดวงอาทิตย์มุมขวาบนใช้สลับโหมดสว่างและโหมดมืด เว็บจะใช้ธีมตามเครื่องในครั้งแรก และจำธีมที่เลือกไว้ในเบราว์เซอร์

หากเลือกบัญชี ChatGPT/Codex แล้วระบบแจ้งว่าปิดการลงชื่อเข้าใช้ด้วยรหัสอุปกรณ์ ให้เปิดการตั้งค่านั้นในบัญชี ChatGPT ที่ต้องการใช้ก่อน หรือเลือกผู้ให้บริการแบบ API key แทน การเปิดรหัสอุปกรณ์เป็นการเปลี่ยนค่าความปลอดภัยของบัญชีและใช้กับแอปอื่นที่รองรับวิธีเดียวกันด้วย

Hermes, หน้าเว็บ, หนังสือ และประวัติอยู่ในชุดติดตั้งของผู้รับ ไม่มีการเชื่อมต่อกับ VPS ของผู้สร้าง ค่าเริ่มต้นเปิดเว็บเฉพาะเครื่องนั้น เฉพาะคำถามกับข้อความหนังสือที่จำเป็นจะถูกส่งจาก Hermes ไปยังผู้ให้บริการ AI ที่ผู้รับเลือก ผู้ให้บริการอาจคิดค่าใช้จ่ายตามบัญชีของผู้รับ

ประวัติ รายงาน และสำเนาฐานข้อมูลอยู่ใน Docker volume ของเครื่องผู้ติดตั้ง ห้ามใช้ `docker compose down -v` ถ้าต้องการเก็บข้อมูล ดูรายละเอียดใน `docs/INDEPENDENT-SETUP-TH.md` และ `docs/OPERATIONS-TH.md`

## หนังสือและขอบเขต
113 หน้า PDF: หน้าหนังสือ 1–107 ตรงกับหน้า PDF 6–112 ใช้ 12 บท ไม่ใช้หน้าปก สารบัญ หรือบรรณานุกรมเป็นหลักฐานคำตอบ
เก็บข้อความที่ดึงออกแล้วใน book/index.json และ PDF ต้นฉบับใน book/book.pdf
ถ้าหนังสือ PDF ภายในเว็บแสดงพื้นที่ว่างหรือสีดำ ให้ใช้ปุ่ม **เปิด PDF ในแท็บใหม่** ที่อยู่ด้านล่างหน้าต่างหนังสือ
การค้นหลักเป็น lexical retrieval พร้อมคำศัพท์ไทย–อังกฤษ สำหรับโจทย์เขียนโปรแกรมเพิ่มขั้นให้ Hermes แปลโจทย์เป็นแนวคิดจากรายการในหลักสูตร แล้วค้นหน้าหนังสือของแนวคิดเหล่านั้น ไม่จำเป็นต้องมีโจทย์ตรงตัวในหนังสือ ขั้นนี้เรียก AI เพิ่มหนึ่งครั้งต่อข้อความในบทสนทนาโจทย์ประยุกต์ อาจใช้เวลาหรือโควตาผู้ให้บริการเพิ่มขึ้น ยังไม่ใช่ vector embedding search
ตรวจได้ว่าเลขหน้าอ้างอิงอยู่ในบริบทที่ส่งให้โมเดล แต่ไม่รับประกันความถูกต้องของทุกข้อความ
หากเปลี่ยนหนังสือต้องสร้างดัชนีและ chapter mapping ใหม่ ไม่ใช่แค่แทน PDF
คำตอบและแบบฝึกหัดที่สร้างเพิ่มจะระบุแยกจากต้นฉบับ ไม่มีการรันโค้ดของผู้เรียน

## การแยกผู้ใช้และข้อจำกัดการใช้งาน
ไม่มีระบบบัญชี ประวัติผูกกับ cookie สุ่มเฉพาะ browser; ล้าง cookie แล้วจะเข้าประวัติเดิมไม่ได้
เครื่องหรือ browser ที่ใช้ร่วมกันเห็นประวัติเดียวกัน ข้อมูลไม่ได้ sync ข้ามอุปกรณ์
เว็บไม่จำกัดจำนวนคำถามรายชั่วโมง รายวัน หรือจำนวนข้อความต่อบทสนทนา ประมวลผลพร้อมกัน 2 คำขอและมีคิวรอ พร้อมปุ่มยกเลิก ตามรายละเอียดใน docs/OPERATIONS-TH.md
ส่งบริบทล่าสุด 8 ข้อความให้ AI เพื่อควบคุมขนาดคำขอ ประวัติทั้งหมดคงอยู่ในฐานข้อมูล ข้อจำกัดของผู้ให้บริการ AI เป็นไปตามการตั้งค่าและบัญชีฝั่ง Hermes
ตัวติดตั้งปิดเครื่องมือและความจำของ Hermes สำหรับ API ติวเตอร์ หากเปิดให้ผู้ใช้จำนวนมากต้องประเมินการแยกบัญชีและสิทธิ์เพิ่มเติม
ผู้ให้บริการ AI และสิทธิ์ API ตั้งที่ Hermes ค่าใช้จ่ายเป็นไปตามผู้ให้บริการ ไม่รวมอยู่ในตัวเว็บ
ประวัติถูกเก็บใน SQLite พร้อม WAL; ปัจจุบันไม่มีระบบลบบัญชีอัตโนมัติ ผู้เรียนลบบทสนทนาได้ในเมนู

## ดูแลและตรวจสอบ
`docker compose ps`
`docker compose logs --tail=50 app`
`curl -f http://localhost:8091/api/health`
`docker compose restart app`
การหยุดเฉพาะโปรเจกต์: `docker compose down` (ไม่ใส่ -v)
สร้าง snapshot ฐานข้อมูลอย่างสอดคล้อง: หยุด app ชั่วคราวก่อนสำรอง volume หรือใช้ SQLite backup API
กู้คืน: คืน volume ที่สำรอง แล้ว start app ด้วย image ที่ตรงกับ schema
Source ใช้ Node 24, React, TypeScript, Vite; ฐานข้อมูล SQLite ของ Node และ Node HTTP server; Hermes รันแยกใน Docker
ทดสอบ retrieval/citation: `docker run --rm -v "$PWD:/app" -w /app node:24-alpine node --test app/retrieval.test.mjs app/task-planner.test.mjs`
Dockerfile และ Hermes ใช้ image digest ที่ระบุชัด; ตรวจผลที่ทดสอบจริงใน docs/OPERATIONS-TH.md
เก็บ package-lock.json เพื่อให้ build ซ้ำได้

## คำถามภาพรวมและข้อสังเกตในหนังสือ
คำถามมีอะไรบ้าง/ชนิดข้อมูลจะขยายหน้าต่อเนื่องภายในบท เพื่อรวมตารางที่อยู่หน้าถัดไป โดยจำกัดบริบทไม่เกิน 8 หน้า คำตอบต้องแยกชนิดข้อมูลออกจากชื่อตัวแปรและรวบรวมรายการจากหลักฐาน
ตารางหน้า 15 มีค่าขนาดชนิดข้อมูลที่ไม่ควรใช้เป็นค่าตายตัวทุกระบบ การตอบจึงมีหมายเหตุบรรณาธิการแยกจากต้นฉบับ ตรวจจาก WG14 C11 N1570 sections 5.2.4.2.1, 6.2.5 และ 6.5.3.4: https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf
ทดสอบโค้ด: `npm test`, `npx tsc --noEmit`, `npm run evaluate`, `npm run build` และ `npm run test:e2e` (ต้องติดตั้ง Chromium ของ Playwright ด้วย `npx playwright install chromium`) โดย browser tests ใช้ AI จำลอง ไม่ใช้เครดิตจริง

## Reference panel
Use the Sources button in the top bar to collapse or reopen the panel. The selected page and reading position are retained per conversation while the app remains open. Page buttons switch between sources for the selected answer; citations below an answer open its own source group.
Each new answer with sources automatically opens the panel at its first cited page on desktop and mobile, even if the previous panel was closed. Users can close it with its button or Escape, and on mobile also with the backdrop or a rightward swipe on its header. Manually reopening retains the selected page and scroll position. Answers without sources do not fabricate references. Reloading the app resets panel preferences.

## Topic spelling and problem reports
Retrieval recognizes common Thai and English topic spelling variants in app/query-normalization.mjs (including pointer, function, array, loop and variable aliases). Thai tone marks are folded only for matching known topic aliases. Original questions and code remain unchanged. This does not guarantee correction of arbitrary misspellings.
Users can report an individual answer or a general website problem. Reports are stored in SQLite in the same persistent Docker data volume. Optional attachments contain only the selected answer, its preceding question and citations, checked against the current browser session on the server. They are snapshots retained separately when the original chat is deleted. Reports are not sent to Hermes or an external notification service. There is no automatic reply to the reporter.
Authenticated VPS operators inspect reports with these commands (add the deployment-specific Compose override when applicable):
- `docker compose exec app node app/reports-cli.mjs list`
- `docker compose exec app node app/reports-cli.mjs show <report-id>`
- `docker compose exec app node app/reports-cli.mjs resolve <report-id>`
The list shows the latest 100 reports. No public report listing or public admin endpoint is provided. Treat report details as private, untrusted user input. A repeated submission with the same request key in one browser session returns the existing report ID.
Verification: 51 backend tests; prior live misspelled pointer question through Hermes; desktop and 320px mobile report submission, failed-submit retry, optional attachment, cross-session access rejection, and persisted snapshot checks. Test reports were removed after verification.

## Operations and readiness
See docs/OPERATIONS-TH.md for backups, restoration drills, queue behavior, local monitoring and rollback. Version 1.1.1 includes Hermes, app, backup and monitor in the default Compose file.
Editorial correctness notes additionally reference WG14 N1570 sections 5.1.2.2.1 and 7.21.6.2: scanf conversion-count checks do not validate representability; argv[0] access requires argc > 0.
