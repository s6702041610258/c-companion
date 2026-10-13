# Midnight library — Landing 1.13

คำขอล่าสุดเปลี่ยนทิศทางจากเขียวอ่อนเป็นธีม Kage ดำอมครามและแดง โดยคงมังกรเขียวและหนังสือ C ของโปรเจกต์

Palette: midnight #090d14, panel #141821, vermilion #e0231c, ivory #f1e7db, muted #b8b0ad. ใช้ Noto Sans Thai สำหรับคำอธิบายและ Arial ตัวหนาขนาดใหญ่สำหรับชื่อ

ฉากเดสก์ท็อปใช้พื้นที่ 3 viewport และ CSS sticky แทน scroll hijacking ส่วนมือถือยังเลื่อนหน้าได้ตามปกติ กล้อง CatmullRom มี 4 จุดบนเส้นทางและจุดมองต่างกัน จึงเห็น parallax ของหน้ากระดาษจริง แอนิเมชันอ่านค่า scroll ผ่าน GSAP scrub ไม่มี render loop ถาวร ไม่เพิ่ม dependencies

เกณฑ์ตรวจ: ชื่อไม่ล้นจอ 320–1440, ทางเข้าแชทพร้อมทันที, ข้ามฉากได้, ปิด motion แล้วคืน flow ปกติ, ไม่โฟกัสลิงก์ที่จางหาย, demo keyboard/CSP/fallback เดิมครบ และไม่มีการเปลี่ยน source ห้องแชท
