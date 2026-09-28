export const chapters = [
[1,'เริ่มต้นกับภาษา C','ภาษาโปรแกรมและผังงาน',1,9,'language flowchart compilation algorithm'],
[2,'พื้นฐานการเขียนโปรแกรม','ตัวแปร ชนิดข้อมูล และตัวดำเนินการ',10,22,'variable type int float char operator expression include constant'],
[3,'รับค่าและแสดงผล','สื่อสารกับโปรแกรมด้วย printf และ scanf',23,31,'printf scanf input output format getchar putchar'],
[4,'ตัดสินใจด้วยเงื่อนไข','if, else และ switch',32,42,'if else switch case condition selection'],
[5,'ทำซ้ำด้วยลูป','for, while และ do-while',43,49,'for while do loop iteration increment'],
[6,'เก็บข้อมูลด้วยอาร์เรย์','จัดการข้อมูลหลายค่าด้วย array',50,55,'array index element'],
[7,'พอยน์เตอร์และสตริง','เข้าใจตำแหน่งหน่วยความจำและข้อความ',56,66,'pointer address string const indirection'],
[8,'รวมข้อมูลด้วย struct','สร้างชนิดข้อมูลและใช้ typedef',67,74,'struct structure typedef member'],
[9,'แบ่งงานด้วยฟังก์ชัน','พารามิเตอร์ การคืนค่า และการส่งข้อมูล',75,84,'function parameter return argument value reference'],
[10,'อาร์กิวเมนต์คำสั่ง','รับข้อมูลเมื่อเรียกโปรแกรม',85,90,'argc argv command argument'],
[11,'อ่านและเขียนไฟล์','จัดเก็บข้อมูลด้วย file stream',91,103,'file stream fopen fclose fgets fputs fread fwrite fseek'],
[12,'จัดระเบียบโปรเจกต์','ทำงานกับหลายไฟล์ในโปรแกรม',104,107,'project file header include']
].map(([id,title,subtitle,start,end,keywords])=>({id,title,subtitle,start,end,keywords}));
