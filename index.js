//const nodemailer = require('nodemailer'); // Tambahkan di atas
//const fs = require('fs');
//const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const Database = require('better-sqlite3');
const path = require('path'); // Cukup satu saja di sini
const fs = require('fs');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');

const app = express();

// Tentukan nama folder arsip
const folderArsip = path.join(__dirname, 'arsip_bast');

// Buat folder jika belum ada
if (!fs.existsSync(folderArsip)) {
    fs.mkdirSync(folderArsip);
}


// Middleware ini wajib ada agar Node.js bisa membaca data dari form
app.use(express.urlencoded({ extended: true })); 
app.use(express.json());
const db = new Database('database.db');
const XLSX = require("xlsx");

const wb = XLSX.readFile("output.xlsx");
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);

// Inisialisasi Database
// Inisialisasi Database dengan Data Dummy
db.exec(`
  CREATE TABLE IF NOT EXISTS transaksi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_is_admin BOOLEAN DEFAULT 0,
    nama TEXT,
    nip TEXT UNIQUE,
    email TEXT UNIQUE,
    otp TEXT,
    charger_is_exist BOOLEAN DEFAULT 0,
    bag_is_exist BOOLEAN DEFAULT 0,
    model_lama TEXT,
    model_baru TEXT,
    sn_lama TEXT,
    sn_baru TEXT,
    status TEXT DEFAULT 'Pending',
    signature TEXT,
    ml_is_handed_over BOOLEAN DEFAULT 0,
    no_surat_lama TEXT,
    no_surat_baru TEXT,
    no_lama INTEGER UNIQUE,
    no_baru INTEGER UNIQUE,
    tanggal_pengajuan DATETIME DEFAULT CURRENT_TIMESTAMP,
    tanggal_serah DATETIME,
    tanggal_terima DATETIME
  )
`);

const checkData = db.prepare("SELECT count(*) as count FROM transaksi").get();
console.log("Jumlah data saat ini di database:", checkData.count);

if (checkData.count === 0) {

    const insert = db.prepare(`
    INSERT INTO transaksi 
    (nama, nip, email, role_is_admin, sn_lama, model_lama, no_lama, no_baru)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    data.forEach(row => {
        insert.run(
            row.nama,
            row.nik,
            row.email,
            row.role_is_admin ?? 0,
            row.serial_lama || "",
            row.model_lama || "",
            row.no_lama,
            row.no_baru
        );
    });

    console.log("Import selesai");
}

// Route
app.post('/cek-karyawan', async (req, res) => {
    const { nip } = req.body;
    
    try {
        // Ambil data berdasarkan NIP atau ID
        const data = db.prepare("SELECT * FROM transaksi WHERE nip = ?").get(nip);

        if (data) {

            // ALUR KHUSUS ADMIN
            if (data.role_is_admin === 1) {
                // Arahkan ke halaman input password. 
                // (Anda harus membuat file views/admin-login.ejs setelah ini)
                return res.render('admin-login', { admin: data });
            }

            // ALUR DOSEN
            const emailTujuan = data.email;
            
            // ALUR 1: JIKA STATUS MASIH PENDING (Proses OTP)
            if (data.status === 'Pending') {
                
                const otpBaru = Math.floor(100000 + Math.random() * 900000).toString();
                db.prepare("UPDATE transaksi SET otp = ?, email = ? WHERE nip = ?").run(otpBaru, emailTujuan, nip);

                const mailOptions = {
                        from: '"ALVIN - TIK Universitas" <pertamapertamax@gmail.com>',
                        to: emailTujuan,
                        subject: `[ALVIN] Kode Verifikasi OTP - ${otpBaru}`,
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; border: 1px solid #eeeeee; border-radius: 10px; overflow: hidden;">
                                <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-bottom: 3px solid #e62129;">
                                    <h1 style="margin: 0; color: #262626; font-size: 22px;">ALVIN</h1>
                                    <p style="margin: 0; color: #595959; font-size: 10px; letter-spacing: 1px; text-transform: uppercase;">
                                        Asset & Laptop Verification Inventory Network
                                    </p>
                                </div>

                                <div style="padding: 30px; color: #333333;">
                                    <h2 style="color: #e62129; margin-top: 0; font-size: 18px;">Verifikasi Identitas</h2>
                                    <p>Halo <b>${data.nama}</b>,</p>
                                    <p>Terima kasih telah menggunakan layanan <b>ALVIN</b>. Gunakan kode OTP di bawah ini untuk melanjutkan verifikasi perangkat lama Anda:</p>
                                    
                                    <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #e62129; border-radius: 8px; margin: 20px 0;">
                                        ${otpBaru}
                                    </div>
                                    
                                    <p style="font-size: 12px; color: #8c8c8c;">
                                        <b>PENTING:</b> Kode ini bersifat rahasia dan hanya berlaku untuk sesi ini. Jangan berikan kode ini kepada siapa pun, termasuk staf TIK Universitas Pertamina.
                                    </p>

                                    <div style="margin-top: 30px; border-top: 1px solid #eeeeee; padding-top: 20px; font-size: 13px;">
                                        <p style="margin: 0;">Terima Kasih,</p>
                                        <p style="margin: 0; font-weight: bold;">Fungsi TIK</p>
                                        <p style="margin: 0;">Universitas Pertamina</p>
                                    </div>
                                </div>

                                <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 11px; color: #8c8c8c;">
                                    <p style="margin: 0;">
                                        <a href="https://alvin.universitaspertamina.ac.id" style="color: #e62129; text-decoration: none; font-weight: bold;">ALVIN</a> 
                                        | Asset Laptop Verification & Inventory
                                    </p>
                                </div>
                            </div>
                        `
                    };

                    await transporter.sendMail(mailOptions);
                    return res.render('verifikasi-otp', { nip: nip });

            } 
            
            // ALUR 2: JIKA SUDAH INPUT SN TAPI BELUM APPROVE
            else if (data.status === 'Verified_by_User') {
                return res.send(`
                    <div style="text-align:center; margin-top:50px; font-family:sans-serif; padding: 20px;">
                        <h2 style="color:#e62129;">Data SN Tercatat!</h2>
                        <p>Serial Number laptop lama Anda (<b>${data.sn_lama}</b>) sudah kami terima.</p>
                        <p>Saat ini data sedang diverifikasi oleh Tim TIK. silakan ke <b>Loket TIK</b> untuk mengambil laptop baru.</p>
                        <br>
                        <a href="/" style="text-decoration:none; color:white; padding:10px 20px; border-radius:5px; background:#e62129;">Kembali</a>
                    </div>
                `);
            } 
            
            // ALUR 3: JIKA SUDAH DISERAHKAN (PROSES TTD)
            else if (data.status === 'Completed') {
                return res.render('signature', { user: data });
            } 
            
            // ALUR 4: JIKA SUDAH SELESAI SEMUA
            else if (data.status === 'Signed') {
                let items = ["Unit Charger", "Tas Laptop"]; 
                return res.render('preview-bast', { 
                    user: data, 
                    items: items, 
                    revisit: true 
                });
            }

        } else {
            // JIKA NIP / ID TIDAK DITEMUKAN (Tampilan Diperbaiki)
            return res.send(`
                <!DOCTYPE html>
                <html lang="id">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <script src="https://cdn.tailwindcss.com"></script>
                    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
                </head>
                <body class="bg-[#fafafa] font-['Poppins'] min-h-screen flex items-center justify-center p-6 text-[#262626]">
                    <div class="max-w-md w-full bg-white border border-[#d9d9d9] rounded-2xl shadow-sm p-8 text-center">
                        <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                            <svg class="h-8 w-8 text-[#e62129]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 class="text-2xl font-bold text-[#e62129] mb-3">Data Tidak Ditemukan</h2>
                        <p class="text-[15px] text-[#595959] mb-8 leading-relaxed">
                            NIP atau ID <strong class="text-[#262626]">${nip}</strong> tidak terdaftar di dalam sistem inventaris kami. Silakan periksa kembali ketikan Anda atau hubungi bagian TIK.
                        </p>
                        <a href="/" class="inline-flex h-12 w-full items-center justify-center rounded-lg bg-[#262626] text-white text-sm font-bold transition-all hover:bg-black shadow-md uppercase tracking-wide">
                            Kembali ke Halaman Utama
                        </a>
                    </div>
                </body>
                </html>
            `);
        }

    } catch (error) {
        console.error("Error pada cek-karyawan:", error);
        res.status(500).send("Terjadi kesalahan pada sistem. Silakan coba lagi.");
    }
});

app.use(express.json());
//verif otp
app.post('/verifikasi-otp', (req, res) => {
    const { nip, otp_input } = req.body;
    const data = db.prepare("SELECT * FROM transaksi WHERE nip = ?").get(nip);

    if (data && data.otp === otp_input.trim()) {
        // Kirim sinyal sukses ke Frontend
        res.json({ success: true });
    } else {
        // Kirim sinyal gagal ke Frontend
        res.json({ success: false, message: "OTP Salah" });
    }
});
//verifikasi gunakan ajax
app.get('/input-sn-page/:nip', (req, res) => {
    const data = db.prepare("SELECT * FROM transaksi WHERE nip = ?").get(req.params.nip);
    if (data) {
        res.render('input-sn', { user: data });
    } else {
        res.redirect('/');
    }
});

// Route: Verifikasi Password Admin
app.post('/verifikasi-admin', (req, res) => {
    const { nip, password } = req.body;

    // Ambil data admin dari database berdasarkan NIP bawaan form
    const adminData = db.prepare("SELECT * FROM transaksi WHERE nip = ? AND role_is_admin = 1").get(nip);

    if (adminData) {
        // Cek password (Contoh sederhana: password disamakan "admin123" untuk semua admin sementara waktu)
        // Di sistem skala besar, password harus di-hash dan disimpan di database.
        if (password === "admin123") {
            // Password Benar -> Masuk ke dashboard admin
            res.redirect('/admin');
        } else {
            // Password Salah -> Kembalikan ke halaman login beserta pesan error
            res.render('admin-login', { admin: adminData, error: "Kata sandi yang Anda masukkan salah." });
        }
    } else {
        res.redirect('/');
    }
});

// Route: Simpan SN Lama (Update status menjadi 'Verified_by_User')
app.post('/simpan-sn-lama/:id', (req, res) => {
    const { setuju_hak_milik } = req.body;
    const { id } = req.params;

    if (!setuju_hak_milik) {
        return res.send("Anda harus menyetujui syarat pengalihan hak milik.");
    }

    try {
        const dataUser = db.prepare("SELECT sn_lama FROM transaksi WHERE id = ?").get(id);

        if (!dataUser) {
            return res.status(404).send("Data transaksi tidak ditemukan.");
        }

        db.prepare("UPDATE transaksi SET status = 'Verified_by_User' WHERE id = ?").run(id); 
        
        res.send(`
            <!DOCTYPE html>
            <html lang="id">
            <head>
                <meta charset="UTF-8">
                <script src="https://cdn.tailwindcss.com"></script>
                <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
                <style>
                    .text-h3 { font-family: 'Poppins'; font-size: 36px; font-weight: 700; line-height: 46px; } 
                    .text-body-medium { font-family: 'Poppins'; font-size: 16px; font-weight: 400; line-height: 24px; } 
                </style>
            </head>
            <body class="bg-[#fafafa] font-sans min-h-screen flex items-center justify-center p-6">
                <div class="max-w-md w-full bg-white border border-[#d9d9d9] rounded-xl shadow-sm p-10 text-center">
                    <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                        <svg class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <h1 class="text-h3 text-green-600 mb-4">Konfirmasi Berhasil!</h1>
                    
                    <div class="space-y-4 mb-8">
                        <p class="text-body-medium text-[#595959]">
                            Data perangkat dengan Serial Number <strong class="text-[#262626] font-bold">${dataUser.sn_lama || '-'}</strong> telah berhasil diverifikasi dalam sistem.
                        </p>
                        <p class="text-body-medium text-[#595959]">
                            Langkah selanjutnya, silakan datang ke <span class="font-bold text-[#e62129]">Loket TIK</span> untuk proses serah terima fisik laptop baru Anda.
                        </p>
                    </div>

                    <a href="/" class="inline-flex h-10 px-6 items-center justify-center rounded-lg bg-[#e62129] text-white text-sm font-bold transition-all hover:bg-[#ef6c70] active:bg-[#a51217] shadow-md shadow-red-100 uppercase w-full">
                        Kembali ke Beranda
                    </a>
                </div>
            </body>
            </html>
        `);
    } catch (error) {
        console.error("Error konfirmasi user:", error);
        res.status(500).send("Terjadi kesalahan sistem saat mencoba memverifikasi data.");
    }
});
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Route: Halaman Karyawan
app.get('/', (req, res) => {
    res.render('karyawan');
});

// Proses: Simpan Pengajuan Karyawan
app.post('/submit-karyawan', (req, res) => {
    const { nama, nip, model_lama } = req.body;
    const stmt = db.prepare("INSERT INTO transaksi (nama, nip, model_lama) VALUES (?, ?, ?)");
    stmt.run(nama, nip, model_lama);
    res.send("<h2>Data Terkirim!</h2><p>Silakan ke loket TIK untuk verifikasi fisik laptop.</p><a href='/'>Kembali</a>");
});

// Route: Dashboard Admin TIK
app.get('/admin', (req, res) => {
    // Ubah kueri ini agar mengambil status yang sudah diinput karyawan
    const rows = db.prepare("SELECT * FROM transaksi WHERE status = 'Verified_by_User'").all();
    res.render('admin', { transactions: rows });
});

// Route: Konfirmasi Laptop Lama Telah Diserahkan
app.post('/admin/konfirmasi-lama/:id', async (req, res) => { 
    const { id } = req.params;

    try {
        const dataUser = db.prepare("SELECT * FROM transaksi WHERE id = ?").get(id);

        if (!dataUser) {
            return res.status(404).send("Data transaksi tidak ditemukan.");
        }

        db.prepare(`
            UPDATE transaksi 
            SET ml_is_handed_over = 1, 
                tanggal_serah = CURRENT_TIMESTAMP 
            WHERE id = ?
        `).run(id);

        if (dataUser.email) {
            const mailOptions = {
                from: '"ALVIN - TIK Universitas" <pertamapertamax@gmail.com>',
                to: dataUser.email,
                subject: `[ALVIN] Konfirmasi Penerimaan Perangkat - ${dataUser.nama}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eeeeee; border-radius: 10px; overflow: hidden;">
                        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 3px solid #e62129;">
                            <h1 style="margin: 0; color: #262626; font-size: 24px;">ALVIN</h1>
                            <p style="margin: 0; color: #595959; font-size: 11px; letter-spacing: 1px; text-transform: uppercase;">
                                Asset & Laptop Verification Inventory Network
                            </p>
                        </div>

                        <div style="padding: 30px; line-height: 1.6; color: #333333;">
                            <h2 style="color: #e62129; margin-top: 0;">Konfirmasi Laptop Diterima</h2>
                            
                            <p>Halo <b>${dataUser.nama}</b>,</p>
                            
                            <p>Melalui website <b>ALVIN</b>, tim TIK mengonfirmasi bahwa perangkat lama Anda telah <b>berhasil diserahkan dan diverifikasi</b> secara fisik dengan rincian sebagai berikut:</p>
                            
                            <div style="background-color: #f9f9f9; border-left: 4px solid #e62129; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                <p style="margin: 0;"><b>Model Perangkat:</b> ${dataUser.model_lama || '-'}</p>
                                <p style="margin: 5px 0 0 0;"><b>Serial Number:</b> ${dataUser.sn_lama || '-'}</p>
                            </div> 
                            
                            <p>Terima kasih. Silakan simpan email ini sebagai referensi bukti penyerahan fisik perangkat lama Anda.</p>
                            
                            <div style="margin-top: 30px; border-top: 1px solid #eeeeee; padding-top: 20px;">
                                <p style="margin: 0;">Terima Kasih,</p>
                                <p style="margin: 0; font-weight: bold;">Fungsi Teknologi Informasi dan Komunikasi</p>
                                <p style="margin: 0;">Universitas Pertamina</p>
                            </div>
                        </div>

                        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 11px; color: #8c8c8c;">
                                    <p style="margin: 0;">
                                        <a href="https://alvin.universitaspertamina.ac.id" style="color: #e62129; text-decoration: none; font-weight: bold;">ALVIN</a> 
                                        | Asset Laptop Verification & Inventory
                                    </p>
                                </div>
                    </div>
                `
            };
            await transporter.sendMail(mailOptions);
            console.log(`Email konfirmasi berhasil dikirim ke: ${dataUser.email}`);
        } else {
            console.log(`Peringatan: User ${dataUser.nama} tidak memiliki alamat email. Notifikasi dilewati.`);
        }

        res.redirect('/admin'); 

    } catch (error) {
        console.error("Gagal mengonfirmasi laptop lama atau mengirim email:", error);
        res.status(500).send("Terjadi kesalahan sistem saat memproses data.");
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Sistem berjalan di http://localhost:${PORT}`);
});

// Konfigurasi Transporter Email (Contoh menggunakan Gmail/SMTP Kampus)
const transporter = nodemailer.createTransport({
    service: 'gmail', // Atau sesuaikan dengan SMTP universitas
    auth: {
        user: 'pertamapertamax68@gmail.com', // Email pengirim
        pass: 'fsmtaziqqiknibdl'       // Password aplikasi
    }
});

app.post('/approve/:id', (req, res) => {
    const { id } = req.params;
    const { model_baru, sn_lama, sn_baru } = req.body;

    try {
        const stmt = db.prepare(`
            UPDATE transaksi 
            SET sn_lama = ?,
                model_baru = ?,
                sn_baru = ?,
                status = 'Completed',
                tanggal_terima = CURRENT_TIMESTAMP
            WHERE id = ?
        `);
        
        stmt.run(sn_lama, model_baru, sn_baru, id);

        res.redirect('/admin');

    } catch (error) {
        console.error("Gagal melakukan Approve final:", error);
        res.status(500).send("Terjadi kesalahan sistem saat menyelesaikan transaksi.");
    }
});

const getRomanMonth = (monthIndex) => {
    const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    return roman[monthIndex];
};

const getIndoDateString = (dateObj) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${days[dateObj.getDay()]}, ${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
};

// Route utama
app.post('/save-signature/:id', async (req, res) => {
    const { signature_data, item_charger, item_tas, item_mouse, no_lama, no_baru } = req.body;
    const { id } = req.params;

    const isChargerExist = item_charger ? 1 : 0;
    const isBagExist = item_tas ? 1 : 0;

    try {

        const dataNomor = db.prepare(
  "SELECT no_baru, no_lama FROM transaksi WHERE id = ?"
).get(id);
        if (!dataNomor) {
            return res.status(404).json({ message: "Data tidak ditemukan" });
        }

        const sqbaru = dataNomor.no_baru;
        const seqlama = dataNomor.no_lama;

        const today = new Date();
        
        const noSuratBaru = `Nomor : ${sqbaru}/UPER-WRS.3.2/BA/TI.01/${getRomanMonth(today.getMonth())}/${today.getFullYear()}`;
        const noSuratLama = `Nomor : ${seqlama}/UPER-WRS.3.2/BA/TI.01/${getRomanMonth(today.getMonth())}/${today.getFullYear()}`;

        db.prepare(`
            UPDATE transaksi 
            SET signature = ?, status = 'Signed', charger_is_exist = ?, bag_is_exist = ?,
                no_surat_baru = ?, no_surat_lama = ?
            WHERE id = ?
        `).run(signature_data, isChargerExist, isBagExist, noSuratBaru, noSuratLama, id);

        const data = db.prepare("SELECT * FROM transaksi WHERE id = ?").get(id);  
        if (!data) throw new Error(`Data dengan ID ${id} tidak ditemukan di database.`);

        const arsipDir = path.join(__dirname, 'arsip_bast');
        if (!fs.existsSync(arsipDir)) {
            fs.mkdirSync(arsipDir);
        }

        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const filename = `BAST_${data.nip}_${Date.now()}.pdf`; 
        const filePath = path.join(arsipDir, filename);

        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        const bgPath = path.join(__dirname, 'assets', 'template', 'image', 'bg','bg.jpg'); 
        
        if (fs.existsSync(bgPath)) {
            doc.image(bgPath, 0, 0, {
                width: doc.page.width,
                height: doc.page.height
            });
            
            // agar teks pertama tidak menabrak batas atas kertas
            doc.x = 50; 
            doc.y = 100; 
        }

        doc.font('Times-Bold').fontSize(12).text('BERITA ACARA SERAH TERIMA BARANG', { align: 'center', underline: true }); 
        doc.font('Times-Roman').fontSize(11).text(data.no_surat_baru, { align: 'center' });
        doc.moveDown(2);

        const openingText = `Merujuk pada Peraturan Rektor Universitas Pertamina nomor 0021/UP-R/PER/XII/2019 tentang Standarisasi Sarana Teknologi Informasi di Lingkungan Universitas Pertamina, maka pada hari ${getIndoDateString(today)} bertempat di Universitas Pertamina telah dilakukan penyerahan dan penerimaan barang sebagai fasilitas jabatan antara,`; // 
        doc.text(openingText, { align: 'justify', lineGap: 3 });
        doc.moveDown(1.5);

        let startY = doc.y;

        doc.text('Nama', 50, startY);      
        doc.text(': Meredita Susanty', 130, startY);

        startY += 15;
        doc.text('Jabatan', 50, startY);   
        doc.text(': Manajer Teknologi Informasi dan Komunikasi', 130, startY);

        startY += 15;
        doc.text('NIP', 50, startY);       
        doc.text(': 116020', 130, startY);

        doc.x = 50; 
        doc.y = startY + 20; 

        doc.text('Selaku penanggungjawab Fungsi Teknologi Informasi dan Komunikasi yang selanjutnya disebut PIHAK PERTAMA, dan', { align: 'justify' }); 
        doc.moveDown(1.5);

        startY = doc.y;

        doc.text('Nama', 50, startY);      
        doc.text(`: ${data.nama}`, 130, startY);

        startY += 15;
        doc.text('Jabatan', 50, startY);   
        doc.text(': Tenaga Pendidik', 130, startY);

        startY += 15;
        doc.text('NIP', 50, startY);       
        doc.text(`: ${data.nip}`, 130, startY);

        startY += 15;
        doc.text('Email', 50, startY);     
        doc.text(`: ${data.email}`, 130, startY);

        doc.x = 50;
        doc.y = startY + 20;

        doc.text('yang selanjutnya disebut PIHAK KEDUA.', { align: 'justify' });
        doc.moveDown(1.5);

        doc.text('Dengan ini, PIHAK PERTAMA menyerahkan barang kepada PIHAK KEDUA dan PIHAK KEDUA menyatakan telah menerima barang tersebut dari PIHAK PERTAMA berupa :', { align: 'justify', lineGap: 3 }); // 
        doc.moveDown(1);

        const tableTop = doc.y;
        doc.font('Times-Bold');
        doc.text('No.', 50, tableTop); 
        doc.text('Nama Barang', 90, tableTop); 
        doc.text('Serial Number', 280, tableTop); 
        doc.text('Jumlah Barang', 430, tableTop); 

        doc.moveTo(50, tableTop + 15).lineTo(530, tableTop + 15).stroke();

        doc.font('Times-Roman');
        
        const modelName = data.model_baru;
        const modelWidth = 180;
        const modelHeight = doc.heightOfString(modelName, { width: modelWidth });

        doc.text('1', 50, tableTop + 25); 
        
        doc.text(modelName, 90, tableTop + 25, { width: modelWidth, align: 'left' }); 
        
        doc.text(data.sn_baru, 280, tableTop + 25); 
        doc.text('1 Unit', 430, tableTop + 25); 
        
        doc.x = 50; 
        doc.y = tableTop + 25 + modelHeight + 10;
        doc.moveDown(1);

        doc.text('Jika terjadi kerusakan karena human error seperti kelalaian pengguna, instalasi software illegal dan lain sebagainya maka segala biaya yang timbul akan menjadi tanggung jawab PIHAK KEDUA', { align: 'justify', lineGap: 3 }); // 
        doc.moveDown(1.5);

        doc.text('Demikianlah berita acara serah terima barang ini dibuat dan telah disetujui oleh kedua belah pihak.', { align: 'justify' }); 
        doc.moveDown(2.5);

        const ttdPihakPertamaPath = path.join(__dirname, 'assets', 'template', 'image', 'ttd','ttdBuMeredita.png');

        const sigTop = doc.y + 20;
        doc.font('Times-Roman').fontSize(11);
        
        doc.text('PIHAK PERTAMA', 90, sigTop, { align: 'center', width: 150 }); 
        doc.text('PIHAK KEDUA', 350, sigTop, { align: 'center', width: 150 });

        if (fs.existsSync(ttdPihakPertamaPath)) {
            doc.image(ttdPihakPertamaPath, 90, sigTop + 15, { fit: [150, 65], align: 'center' });
        } else {
            doc.moveDown(4);
        }

        if (signature_data) {
            const base64Data = signature_data.replace(/^data:image\/png;base64,/, "");
            const signatureImage = Buffer.from(base64Data, 'base64');

            doc.image(signatureImage, 350, sigTop + 15, { fit: [150, 65], align: 'center' });
        }

        doc.font('Times-Bold');
        doc.text('Meredita Susanty', 90, sigTop + 85, { align: 'center', width: 150, underline: true });
        doc.text(data.nama, 350, sigTop + 85, { align: 'center', width: 150, underline: true });

        doc.font('Times-Roman');
        doc.text('NIP. 116020', 90, sigTop + 100, { align: 'center', width: 150 });
        doc.text(`NIP. ${data.nip}`, 350, sigTop + 100, { align: 'center', width: 150 });

        doc.addPage();

        if (fs.existsSync(bgPath)) {
            doc.image(bgPath, 0, 0, {
                width: doc.page.width,
                height: doc.page.height
            });
            
            doc.x = 50; 
            doc.y = 100; 
        }

        doc.font('Times-Bold').fontSize(12).text('BERITA ACARA SERAH TERIMA BARANG', { align: 'center', underline: true });
        doc.font('Times-Roman').fontSize(11).text(data.no_surat_lama, { align: 'center' });
        doc.moveDown(2);

        const namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][today.getDay()];
        const tanggal = today.getDate();
        const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][today.getMonth()];
        const tahun = today.getFullYear();

        const openingText2 = `Kami yang bertandatangan dibawah ini, Pada hari ini ${namaHari}, Tanggal ${tanggal} Bulan ${namaBulan} Tahun ${tahun},`;
        doc.text(openingText2, { align: 'justify' });
        doc.moveDown(1);

        let startY2 = doc.y;

        doc.text('Nama', 50, startY2);       
        doc.text(': Meredita Susanty', 130, startY2);

        startY2 += 15;
        doc.text('NIP', 50, startY2);        
        doc.text(': 119030', 130, startY2);

        startY2 += 15;
        doc.text('Jabatan', 50, startY2);    
        doc.text(': Manager Teknologi Komunikasi dan Informasi Universitas Pertamina', 130, startY2);

        doc.x = 50;
        doc.y = startY2 + 20;

        doc.text('Bertindak untuk dan atas nama Fungsi Teknologi Komunikasi dan Informasi Universitas Pertamina yang selanjutnya disebut PIHAK PERTAMA.', { align: 'justify' }); 
        doc.moveDown(1);

        startY2 = doc.y;

        doc.text('Nama', 50, startY2);       
        doc.text(`: ${data.nama}`, 130, startY2);

        startY2 += 15;
        doc.text('NIP', 50, startY2);        
        doc.text(`: ${data.nip}`, 130, startY2);

        startY2 += 15;
        doc.text('Jabatan', 50, startY2);    
        doc.text(': Tenaga Pendidik', 130, startY2);

        doc.x = 50;
        doc.y = startY2 + 20;

        doc.text('Selanjutnya disebut PIHAK KEDUA.', { align: 'justify' });
        doc.moveDown(1);

        doc.text('Dengan ini, PIHAK PERTAMA menyerahkan barang kepada PIHAK KEDUA dan PIHAK KEDUA menyatakan telah menerima barang tersebut dari PIHAK PERTAMA berupa :', { align: 'justify', lineGap: 3 }); 
        doc.moveDown(1);

        const tableTop2 = doc.y;
        doc.font('Times-Bold');
        doc.text('No', 50, tableTop2); 
        doc.text('Nama', 90, tableTop2); 
        doc.text('Jumlah', 430, tableTop2);

        doc.moveTo(50, tableTop2 + 15).lineTo(530, tableTop2 + 15).stroke();

        doc.font('Times-Roman');

        const teksLama = `${data.model_lama} (SN: ${data.sn_lama})`;
        const lebarKolomNama = 320;
        
        const tinggiTeksLama = doc.heightOfString(teksLama, { width: lebarKolomNama });

        doc.text('1', 50, tableTop2 + 25); 
        
        doc.text(teksLama, 90, tableTop2 + 25, { 
            width: lebarKolomNama, 
            align: 'left' 
        }); 
        
        doc.text('1 Unit', 430, tableTop2 + 25); 

        doc.x = 50;
        doc.y = tableTop2 + 25 + tinggiTeksLama + 15;
        doc.moveDown(1);

        doc.text('Sejak penandatangan berita acara ini, maka barang tersebut menjadi milik pengguna sehingga pemeliharaan dan perbaikan kerusakan terhadap barang tersebut menjadi tanggung jawab PIHAK KEDUA.', { align: 'justify', lineGap: 3 });
        doc.moveDown(1);

        doc.text('Demikianlah berita acara serah terima barang ini dibuat oleh kedua belah pihak dan telah disetujui oleh kedua belah pihak.', { align: 'justify' });
        doc.moveDown(2);


        const sigTop2 = doc.y;
        doc.text('Yang Menyerahkan,', 90, sigTop2, { align: 'center', width: 150 });
        doc.text('Yang Menerima,', 350, sigTop2, { align: 'center', width: 150 }); 
        
        doc.text('PIHAK PERTAMA', 90, sigTop2 + 15, { align: 'center', width: 150 }); 
        doc.text('PIHAK KEDUA', 350, sigTop2 + 15, { align: 'center', width: 150 }); 

        const ttdPihakPertama2Path = path.join(__dirname, 'assets', 'template', 'image', 'ttd', 'ttdBuMeredita.png'); 

        if (fs.existsSync(ttdPihakPertama2Path)) {
            doc.image(ttdPihakPertama2Path, 90, sigTop2 + 30, { fit: [150, 65], align: 'center' });
        } else {
            doc.moveDown(4);
        }

        if (signature_data) {
            const base64Data = signature_data.replace(/^data:image\/png;base64,/, "");
            const signatureImage = Buffer.from(base64Data, 'base64');
            doc.image(signatureImage, 350, sigTop2 + 30, { fit: [150, 65], align: 'center' });
        }

        doc.font('Times-Bold');
        doc.text('Meredita Susanty', 90, sigTop2 + 100, { align: 'center', width: 150, underline: true });
        doc.font('Times-Roman');
        doc.text('NIP. 116020', 90, sigTop2 + 115, { align: 'center', width: 150 });

        doc.font('Times-Bold');
        doc.text(`${data.nama}`, 350, sigTop2 + 100, { align: 'center', width: 150, underline: true }); 
        doc.font('Times-Roman');
        doc.text(`NIP. ${data.nip}`, 350, sigTop2 + 115, { align: 'center', width: 150 });

        doc.end();

        writeStream.on('finish', async () => {
            const mailOptions = {
                from: '"ALVIN - TIK Universitas" <pertamapertamax@gmail.com>',
                to: data.email, 
                subject: `[ALVIN] Dokumen BAST - ${data.nama}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eeeeee; border-radius: 10px; overflow: hidden;">
                        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 3px solid #e62129;">
                            <h1 style="margin: 0; color: #262626; font-size: 24px;">ALVIN</h1>
                            <p style="margin: 0; color: #595959; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">
                                Asset & Laptop Verification Inventory Network
                            </p>
                        </div>

                        <div style="padding: 30px; line-height: 1.6; color: #333333;">
                            <h2 style="color: #e62129; margin-top: 0;">Serah Terima Berhasil!</h2>
                            
                            <p>Halo <b>${data.nama}</b>,</p>
                            
                            <p>Terima kasih telah menggunakan website <b>ALVIN</b> untuk proses administrasi perangkat Anda. 
                            Terlampir salinan Berita Acara Serah Terima (BAST) digital yang telah Anda tandatangani secara sah melalui sistem kami.</p>
                            
                            <p>Silakan simpan dokumen ini sebagai bukti resmi penyerahan aset.</p>
                            
                            <div style="margin-top: 30px; border-top: 1px solid #eeeeee; padding-top: 20px;">
                                <p style="margin: 0;">Terima Kasih,</p>
                                <p style="margin: 0; font-weight: bold;">Fungsi Teknologi Informasi dan Komunikasi</p>
                                <p style="margin: 0;">Universitas Pertamina</p>
                            </div>
                        </div>

                        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 11px; color: #8c8c8c;">
                                    <p style="margin: 0;">
                                        <a href="https://alvin.universitaspertamina.ac.id" style="color: #e62129; text-decoration: none; font-weight: bold;">ALVIN</a> 
                                        | Asset Laptop Verification & Inventory
                                    </p>
                                </div>
                    </div>
                `,
                attachments: [
                    {
                        filename: `BAST_${data.nip}.pdf`,
                        path: filePath 
                    }
                ]
            };

            try {
                await transporter.sendMail(mailOptions);
            } catch (emailErr) {
                console.error("Gagal mengirim email BAST:", emailErr);
            }
        });

        let items = [];
        if (isChargerExist) items.push("Unit Charger Lama");
        if (isBagExist) items.push("Tas Laptop Lama");
        if (item_mouse) items.push("Mouse");

        res.render('preview-bast', { 
            user: data, 
            items: items,
            revisit: false 
        });

    } catch (error) {
        console.error("Gagal memproses BAST:", error);
        res.status(500).send("Terjadi ralat ketika memproses dokumen.");

    }
});

app.get('/manager-report', (req, res) => {
    try {

        const rows = db.prepare(`
            SELECT *, datetime(tanggal_pengajuan, 'localtime') as waktu_lokal 
            FROM transaksi 
            WHERE status IN ('Completed', 'Signed') 
            ORDER BY tanggal_pengajuan DESC
        `).all();

        const totalDistribusi = rows.length;
        const totalSelesaiTTD = rows.filter(r => r.status === 'Signed').length;
        const totalPendingTTD = totalDistribusi - totalSelesaiTTD;

        res.render('report', { 
            transactions: rows, 
            total: totalDistribusi,
            selesai: totalSelesaiTTD,
            pending: totalPendingTTD
        });
    } catch (error) {
        console.error("DEBUG ERROR:", error);
        res.status(500).send("Error Detail: " + error.message); 
}
});


app.get('/preview-bast/:nip', (req, res) => {
    const data = db.prepare("SELECT * FROM transaksi WHERE nip = ? AND status = 'Signed'").get(req.params.nip);
    if (!data) return res.send("Dokumen BAST belum tersedia atau belum ditandatangani.");

    let items = ["Unit Charger", "Tas Laptop"]; 
    res.render('preview-bast', { user: data, items: items, revisit: true });
});

app.get('/signature/:nip', (req, res) => {
    const data = db.prepare("SELECT * FROM transaksi WHERE nip = ? AND status = 'Completed'").get(req.params.nip);
    if (!data) return res.send("Data belum di-approve oleh Admin atau NIP salah.");
    res.render('signature', { user: data });
});

app.get('/download-pdf/:nip', (req, res) => {
    const { nip } = req.params;
    
    try {
        const data = db.prepare("SELECT * FROM transaksi WHERE nip = ?").get(nip);

        if (!data || data.status !== 'Signed') {
            return res.status(404).send("<h2>Dokumen belum ditandatangani atau tidak ditemukan.</h2><a href='/manager-report'>Kembali</a>");
        }

        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ size: 'A4', margin: 50 });

        res.setHeader('Content-disposition', `attachment; filename=BAST_${data.nip}.pdf`);
        res.setHeader('Content-type', 'application/pdf');

        doc.pipe(res);

        const transactionDate = data.tanggal_terima ? new Date(data.tanggal_terima) : new Date();

        const bgPath = path.join(__dirname, 'assets', 'template', 'image', 'bg','bg.jpg'); 
        
        if (fs.existsSync(bgPath)) {
            doc.image(bgPath, 0, 0, { width: doc.page.width, height: doc.page.height });
            doc.x = 50; doc.y = 100; 
        }

        doc.font('Times-Bold').fontSize(12).text('BERITA ACARA SERAH TERIMA BARANG', { align: 'center', underline: true }); 
        doc.font('Times-Roman').fontSize(11).text(data.no_surat_baru, { align: 'center' }); 
        doc.moveDown(2);

        const openingText = `Merujuk pada Peraturan Rektor Universitas Pertamina nomor 0021/UP-R/PER/XII/2019 tentang Standarisasi Sarana Teknologi Informasi di Lingkungan Universitas Pertamina, maka pada hari ${getIndoDateString(transactionDate)} bertempat di Universitas Pertamina telah dilakukan penyerahan dan penerimaan barang sebagai fasilitas jabatan antara,`; 
        doc.text(openingText, { align: 'justify', lineGap: 3 });
        doc.moveDown(1.5);

        let startY = doc.y;
        doc.text('Nama', 50, startY);      
        doc.text(': Meredita Susanty', 130, startY);
        startY += 15;
        doc.text('Jabatan', 50, startY);   
        doc.text(': Manajer Teknologi Informasi dan Komunikasi', 130, startY);
        startY += 15;
        doc.text('NIP', 50, startY);       
        doc.text(': 116020', 130, startY);

        doc.x = 50; doc.y = startY + 20; 
        doc.text('Selaku penanggungjawab Fungsi Teknologi Informasi dan Komunikasi yang selanjutnya disebut PIHAK PERTAMA, dan', { align: 'justify' }); 
        doc.moveDown(1.5);

        startY = doc.y;
        doc.text('Nama', 50, startY);      
        doc.text(`: ${data.nama}`, 130, startY);
        startY += 15;
        doc.text('Jabatan', 50, startY);   
        doc.text(': Tenaga Pendidik', 130, startY);
        startY += 15;
        doc.text('NIP', 50, startY);       
        doc.text(`: ${data.nip}`, 130, startY);
        startY += 15;
        doc.text('Email', 50, startY);     
        doc.text(`: ${data.email}`, 130, startY);

        doc.x = 50; doc.y = startY + 20;
        doc.text('yang selanjutnya disebut PIHAK KEDUA.', { align: 'justify' });
        doc.moveDown(1.5);

        doc.text('Dengan ini, PIHAK PERTAMA menyerahkan barang kepada PIHAK KEDUA dan PIHAK KEDUA menyatakan telah menerima barang tersebut dari PIHAK PERTAMA berupa :', { align: 'justify', lineGap: 3 }); 
        doc.moveDown(1);

        const tableTop = doc.y;
        doc.font('Times-Bold');
        doc.text('No.', 50, tableTop); 
        doc.text('Nama Barang', 90, tableTop); 
        doc.text('Serial Number', 280, tableTop); 
        doc.text('Jumlah Barang', 430, tableTop); 

        doc.moveTo(50, tableTop + 15).lineTo(530, tableTop + 15).stroke();
        
        doc.font('Times-Roman');
        
        const modelName = data.model_baru;
        const modelWidth = 180;
        const modelHeight = doc.heightOfString(modelName, { width: modelWidth });

        doc.text('1', 50, tableTop + 25); 
        
        doc.text(modelName, 90, tableTop + 25, { width: modelWidth, align: 'left' }); 
        
        doc.text(data.sn_baru, 280, tableTop + 25); 
        doc.text('1 Unit', 430, tableTop + 25); 
        
        doc.x = 50; 
        doc.y = tableTop + 25 + modelHeight + 10;

        doc.text('Jika terjadi kerusakan karena human error seperti kelalaian pengguna, instalasi software illegal dan lain sebagainya maka segala biaya yang timbul akan menjadi tanggung jawab PIHAK KEDUA', { align: 'justify', lineGap: 3 }); 
        doc.moveDown(1.5);

        doc.text('Demikianlah berita acara serah terima barang ini dibuat dan telah disetujui oleh kedua belah pihak.', { align: 'justify' }); 
        doc.moveDown(2.5);

        const ttdPihakPertamaPath = path.join(__dirname, 'assets', 'template', 'image', 'ttd','ttdBuMeredita.png');
        const sigTop = doc.y + 20;
        doc.font('Times-Roman').fontSize(11);
        
        doc.text('PIHAK PERTAMA', 90, sigTop, { align: 'center', width: 150 }); 
        doc.text('PIHAK KEDUA', 350, sigTop, { align: 'center', width: 150 });

        if (fs.existsSync(ttdPihakPertamaPath)) {
            doc.image(ttdPihakPertamaPath, 90, sigTop + 15, { fit: [150, 65], align: 'center' });
        } else {
            doc.moveDown(4);
        }

        if (data.signature) {
            const base64Data = data.signature.replace(/^data:image\/png;base64,/, "");
            const signatureImage = Buffer.from(base64Data, 'base64');
            doc.image(signatureImage, 350, sigTop + 15, { fit: [150, 65], align: 'center' });
        }

        doc.font('Times-Bold');
        doc.text('Meredita Susanty', 90, sigTop + 85, { align: 'center', width: 150, underline: true });
        doc.text(data.nama, 350, sigTop + 85, { align: 'center', width: 150, underline: true });

        doc.font('Times-Roman');
        doc.text('NIP. 116020', 90, sigTop + 100, { align: 'center', width: 150 });
        doc.text(`NIP. ${data.nip}`, 350, sigTop + 100, { align: 'center', width: 150 });

        doc.addPage();

        if (fs.existsSync(bgPath)) {
            doc.image(bgPath, 0, 0, { width: doc.page.width, height: doc.page.height });
            doc.x = 50; doc.y = 100; 
        }

        doc.font('Times-Bold').fontSize(12).text('BERITA ACARA SERAH TERIMA BARANG', { align: 'center', underline: true });
        doc.font('Times-Roman').fontSize(11).text(data.no_surat_lama, { align: 'center' }); 
        doc.moveDown(2);

        const namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][transactionDate.getDay()];
        const tanggal = transactionDate.getDate();
        const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][transactionDate.getMonth()];
        const tahun = transactionDate.getFullYear();

        const openingText2 = `Kami yang bertandatangan dibawah ini, Pada hari ini ${namaHari}, Tanggal ${tanggal} Bulan ${namaBulan} Tahun ${tahun},`;
        doc.text(openingText2, { align: 'justify' });
        doc.moveDown(1);

        let startY2 = doc.y;
        doc.text('Nama', 50, startY2);       
        doc.text(': Meredita Susanty', 130, startY2);
        startY2 += 15;
        doc.text('NIP', 50, startY2);        
        doc.text(': 116020', 130, startY2);
        startY2 += 15;
        doc.text('Jabatan', 50, startY2);    
        doc.text(': Manager Teknologi Komunikasi dan Informasi', 130, startY2);

        doc.x = 50; doc.y = startY2 + 20;
        doc.text('Bertindak untuk dan atas nama Fungsi Teknologi Komunikasi dan Informasi Universitas Pertamina yang selanjutnya disebut PIHAK PERTAMA.', { align: 'justify' }); 
        doc.moveDown(1);

        startY2 = doc.y;
        doc.text('Nama', 50, startY2);       
        doc.text(`: ${data.nama}`, 130, startY2);
        startY2 += 15;
        doc.text('NIP', 50, startY2);        
        doc.text(`: ${data.nip}`, 130, startY2);
        startY2 += 15;
        doc.text('Jabatan', 50, startY2);    
        doc.text(': Tenaga Pendidik', 130, startY2);

        doc.x = 50; doc.y = startY2 + 20;
        doc.text('Selanjutnya disebut PIHAK KEDUA.', { align: 'justify' });
        doc.moveDown(1);

        doc.text('Dengan ini, PIHAK PERTAMA menyerahkan barang kepada PIHAK KEDUA dan PIHAK KEDUA menyatakan telah menerima barang tersebut dari PIHAK PERTAMA berupa :', { align: 'justify', lineGap: 3 }); 
        doc.moveDown(1);

        
        const tableTop2 = doc.y;
        doc.font('Times-Bold');
        doc.text('No', 50, tableTop2); 
        doc.text('Nama', 90, tableTop2); 
        doc.text('Jumlah', 430, tableTop2);

        doc.moveTo(50, tableTop2 + 15).lineTo(530, tableTop2 + 15).stroke();

        doc.font('Times-Roman');

        const teksLama = `${data.model_lama} (SN: ${data.sn_lama})`;
        const lebarKolomNama = 320;
        
        const tinggiTeksLama = doc.heightOfString(teksLama, { width: lebarKolomNama });

        doc.text('1', 50, tableTop2 + 25); 
        
        doc.text(teksLama, 90, tableTop2 + 25, { 
            width: lebarKolomNama, 
            align: 'left' 
        }); 
        
        doc.text('1 Unit', 430, tableTop2 + 25); 

        doc.x = 50;
        doc.y = tableTop2 + 25 + tinggiTeksLama + 15;
        doc.moveDown(1);

        doc.text('Sejak penandatangan berita acara ini, maka barang tersebut menjadi milik pengguna sehingga pemeliharaan dan perbaikan kerusakan terhadap barang tersebut menjadi tanggung jawab PIHAK KEDUA.', { align: 'justify', lineGap: 3 });
        doc.moveDown(1);

        doc.text('Demikianlah berita acara serah terima barang ini dibuat oleh kedua belah pihak dan telah disetujui oleh kedua belah pihak.', { align: 'justify' });
        doc.moveDown(2);

        const sigTop2 = doc.y;
        doc.text('Yang Menyerahkan,', 90, sigTop2, { align: 'center', width: 150 });
        doc.text('Yang Menerima,', 350, sigTop2, { align: 'center', width: 150 }); 
        
        doc.text('PIHAK PERTAMA', 90, sigTop2 + 15, { align: 'center', width: 150 }); 
        doc.text('PIHAK KEDUA', 350, sigTop2 + 15, { align: 'center', width: 150 }); 

        const ttdPihakPertama2Path = path.join(__dirname, 'assets', 'template', 'image', 'ttd', 'ttdBuMeredita.png'); 

        if (fs.existsSync(ttdPihakPertama2Path)) {
            doc.image(ttdPihakPertama2Path, 90, sigTop2 + 30, { fit: [150, 65], align: 'center' });
        } else {
            doc.moveDown(4);
        }

        if (data.signature) {
            const base64Data = data.signature.replace(/^data:image\/png;base64,/, "");
            const signatureImage = Buffer.from(base64Data, 'base64');
            doc.image(signatureImage, 350, sigTop2 + 30, { fit: [150, 65], align: 'center' });
        }

        doc.font('Times-Bold');
        doc.text('Meredita Susanty', 90, sigTop2 + 100, { align: 'center', width: 150, underline: true });
        doc.font('Times-Roman');
        doc.text('NIP. 116020', 90, sigTop2 + 115, { align: 'center', width: 150 });

        doc.font('Times-Bold');
        doc.text(`${data.nama}`, 350, sigTop2 + 100, { align: 'center', width: 150, underline: true }); 
        doc.font('Times-Roman');
        doc.text(`NIP. ${data.nip}`, 350, sigTop2 + 115, { align: 'center', width: 150 });

        doc.end();

    } catch (error) {
        console.error("Error saat generate PDF untuk Admin:", error);
        res.status(500).send("Terjadi kesalahan sistem saat mencoba membuat PDF BAST.");
    }
});

app.get('/download-laporan-pdf', (req, res) => {
    try {

        const transactions = db.prepare("SELECT * FROM transaksi WHERE role_is_admin = 0 ORDER BY tanggal_terima DESC").all();


        const selesai = transactions.filter(t => t.status === 'Signed').length;

        const pending = transactions.filter(t => t.status !== 'Signed').length;

        const totalAntrean = transactions.length;

        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40 });

        res.setHeader('Content-disposition', `attachment; filename=Laporan_Distribusi_Laptop_${Date.now()}.pdf`);
        res.setHeader('Content-type', 'application/pdf');

        doc.pipe(res);

        doc.font('Helvetica-Bold').fontSize(16).text('LAPORAN REKAPITULASI DISTRIBUSI LAPTOP', { align: 'center' });
        doc.font('Helvetica').fontSize(11).fillColor('#595959').text('Divisi Teknologi Informasi dan Komunikasi (TIK) Universitas', { align: 'center' });
        
        doc.moveDown(1.5);

        doc.font('Helvetica-Bold').fontSize(10).fillColor('#262626');
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#262626');
        doc.text(`Total Selesai Terdistribusi (BAST): ${selesai} Unit`, { align: 'center' });

        doc.font('Helvetica').fontSize(9).fillColor('#595959');
        doc.text(`Dalam Proses (Pending): ${pending} Unit   |   Total Data Pegawai: ${totalAntrean} Unit`, { align: 'center' });
        doc.moveDown(2);

        let tableTop = doc.y;
        
        const drawTableHeader = (yPos) => {
            doc.font('Helvetica-Bold').fontSize(9).fillColor('#8c8c8c');
            doc.text('NO', 40, yPos);
            doc.text('PEGAWAI', 70, yPos);
            doc.text('WAKTU TRANSAKSI', 210, yPos);
            doc.text('PERANGKAT LAMA', 320, yPos);
            doc.text('KELENGKAPAN', 480, yPos);
            doc.text('PERANGKAT BARU', 580, yPos);
            doc.text('STATUS', 720, yPos);
            
            // Garis bawah header
            doc.moveTo(40, yPos + 15).lineTo(800, yPos + 15).lineWidth(1).strokeColor('#e62129').stroke();
        };

        drawTableHeader(tableTop);
        let y = tableTop + 25;

        transactions.forEach((row, i) => {
            
            doc.font('Helvetica-Bold').fontSize(9);
            const namaHeight = doc.heightOfString(row.nama || '-', { width: 130 });
            const lamaHeight = doc.heightOfString(row.model_lama || '-', { width: 150 });
            const baruHeight = doc.heightOfString(row.model_baru || '-', { width: 130 });

            const maxTextHeight = Math.max(namaHeight, lamaHeight, baruHeight);

            const rowHeight = maxTextHeight + 27; 

            if (y + rowHeight > 520) {
                doc.addPage({ size: 'A4', layout: 'landscape', margin: 40 });
                y = 40;
                drawTableHeader(y);
                y += 25;
            }

            doc.font('Helvetica').fontSize(9).fillColor('#262626');
            doc.text((i + 1).toString(), 40, y);

            doc.font('Helvetica-Bold').text(row.nama || '-', 70, y, { width: 130 });
            doc.font('Helvetica').fontSize(8).fillColor('#595959').text(`NIP: ${row.nip}`, 70, y + namaHeight + 2);

            doc.fontSize(9).fillColor('#262626');
            let dateStr = row.tanggal_terima ? new Date(row.tanggal_terima).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-';
            doc.text(dateStr, 210, y, { width: 100 });

            doc.font('Helvetica-Bold').text(row.model_lama || '-', 320, y, { width: 150 });
            doc.font('Helvetica').fontSize(8).fillColor('#595959').text(`SN: ${row.sn_lama || '-'}`, 320, y + lamaHeight + 2);

            doc.fontSize(9).fillColor('#262626');
            let charger = row.charger_is_exist === 1 ? 'Ada' : 'Tidak';
            let tas = row.bag_is_exist === 1 ? 'Ada' : 'Tidak';
            doc.text(`Charger: ${charger}`, 480, y);
            doc.text(`Tas: ${tas}`, 480, y + 12);

            doc.font('Helvetica-Bold').text(row.model_baru || '-', 580, y, { width: 130 });
            doc.font('Helvetica').fontSize(8).fillColor('#0d6efd').text(`SN: ${row.sn_baru || '-'}`, 580, y + baruHeight + 2);

            doc.fontSize(9).fillColor('#262626');
            let statusText = row.status === 'Signed' ? 'Selesai (TTD)' : (row.status === 'Completed' ? 'Tunggu TTD' : row.status);
            doc.text(statusText, 720, y, { width: 80 });

            y += rowHeight - 10; 
            doc.moveTo(40, y).lineTo(800, y).lineWidth(0.5).strokeColor('#e0e0e0').stroke();

            y += 10;
        });

        doc.moveDown(3);
        let finalY = doc.y;
        
        if(finalY > 450) { 
            doc.addPage({ size: 'A4', layout: 'landscape', margin: 40 }); 
            finalY = 50; 
        }

        doc.font('Helvetica').fontSize(10).fillColor('#262626');
        doc.text('Mengetahui,', 600, finalY, { align: 'center', width: 150 });
        doc.font('Helvetica-Bold').text('Manager TIK Division', 600, finalY + 15, { align: 'center', width: 150 });

        const fs = require('fs');
        const path = require('path');
        const ttdManajerPath = path.join(__dirname, 'assets', 'template', 'image', 'ttd', 'ttdBuMeredita.png');
        
        if (fs.existsSync(ttdManajerPath)) {
            doc.image(ttdManajerPath, 615, finalY + 25, { width: 120 });
        } else {
            doc.moveTo(600, finalY + 75).lineTo(750, finalY + 75).strokeColor('#262626').stroke();
        }

        doc.font('Helvetica-Bold').text('Meredita Susanty', 600, finalY + 80, { align: 'center', width: 150, underline: true });

        doc.end();

    } catch (error) {
        console.error("Gagal membuat PDF Laporan:", error);
        res.status(500).send("Terjadi kesalahan sistem saat generate PDF Laporan.");
    }
});