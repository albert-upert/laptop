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

// Inisialisasi Database
// Inisialisasi Database dengan Data Dummy
db.exec(`
  CREATE TABLE IF NOT EXISTS transaksi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT,
    nip TEXT UNIQUE,
    email TEXT UNIQUE,
    otp TEXT,
    model_lama TEXT,
    model_baru TEXT,
    sn_lama TEXT,
    sn_baru TEXT,
    status TEXT DEFAULT 'Pending',
    signature TEXT, 
    tanggal_pengajuan DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Cek apakah data sudah ada, jika belum masukkan data dummy
const checkData = db.prepare("SELECT count(*) as count FROM transaksi").get();
console.log("Jumlah data saat ini di database:", checkData.count);

if (checkData.count === 0) {
    const insert = db.prepare("INSERT INTO transaksi (nama, nip) VALUES (?, ?)");
    insert.run("Meredita Susanty", "19800101");
    insert.run("Budi Santoso", "19850505");
    insert.run("Siti Aminah", "19921212");
    insert.run("nabil", "105223049");
    console.log("Data dummy berhasil dimasukkan ke database.");
}
/*
// Route: Proses Cek NIP
app.post('/cek-karyawan', (req, res) => {
    const { nip } = req.body;
    const data = db.prepare("SELECT * FROM transaksi WHERE nip = ?").get(nip);

    if (data) {
        if (data.status === 'Pending') {
            res.render('input-sn', { user: data });
        } else if (data.status === 'Completed') {
            res.render('signature', { user: data });
        } else if (data.status === 'Signed') {
            // JIKA SUDAH TANDA TANGAN: Tampilkan Preview BAST
            // Kita asumsikan barang standar yang diterima (bisa dikembangkan sesuai DB)
            let items = ["Unit Charger", "Tas Laptop"]; 
            res.render('preview-bast', { 
                user: data, 
                items: items, 
                revisit: true // Penanda bahwa ini adalah akses ulang (bukan baru simpan)
            });
        }
    } else {
        res.send("<h2>NIP Tidak Ditemukan!</h2><a href='/'>Kembali</a>");
    }
});
*/

// Route: Proses Cek NIP (DIPERBAIKI)
app.post('/cek-karyawan', async (req, res) => {
    const { nip } = req.body;
    
    try {
        // Ambil data berdasarkan NIP
        const data = db.prepare("SELECT * FROM transaksi WHERE nip = ?").get(nip);

        if (data) {

            //const emailTujuan = `${data.nip}@student.universitaspertamina.ac.id`;
            const emailTujuan = `${data.nip}@universitaspertamina.ac.id`;
            // ALUR 1: JIKA STATUS MASIH PENDING (Proses OTP Mulai di Sini)
            if (data.status === 'Pending') {
                
                // 1. Generate 6 digit OTP acak
                const otpBaru = Math.floor(100000 + Math.random() * 900000).toString();

                // 2. Simpan OTP ke database agar bisa divalidasi nanti
                db.prepare("UPDATE transaksi SET otp = ?, email = ? WHERE nip = ?").run(otpBaru, emailTujuan, nip);

                // 3. Susun Email
                const mailOptions = {
                    from: '"ICT Universitas" <pertamapertamax@gmail.com>',
                    to: emailTujuan,
                    subject: 'Kode Verifikasi Distribusi Aset',
                    html: `
                        <div style="font-family: sans-serif; max-width: 500px; border: 1px solid #eee; padding: 20px;">
                            <h2 style="color: #e62129;">Verifikasi Identitas</h2>
                            <p>Halo <b>${data.nama}</b>,</p>
                            <p>Gunakan kode OTP di bawah ini untuk melanjutkan verifikasi perangkat lama Anda:</p>
                            <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #333;">
                                ${otpBaru}
                            </div>
                            <p style="font-size: 12px; color: #888; margin-top: 20px;">
                                Kode ini rahasia. Jangan berikan kepada siapa pun, termasuk staf ICT.
                            </p>
                        </div>
                    `
                };

                // 4. Kirim Email & Pindah ke Halaman OTP
                await transporter.sendMail(mailOptions);
                
                // PENTING: Render halaman verifikasi-otp, bukan input-sn
                return res.render('verifikasi-otp', { nip: nip });

            } 
            
            // ALUR 2: JIKA SUDAH INPUT SN TAPI BELUM APPROVE
            else if (data.status === 'Verified_by_User') {
                return res.send(`
                    <div style="text-align:center; margin-top:50px; font-family:sans-serif; padding: 20px;">
                        <h2 style="color:#e62129;">Data SN Tercatat!</h2>
                        <p>Serial Number laptop lama Anda (<b>${data.sn_lama}</b>) sudah kami terima.</p>
                        <p>Saat ini data sedang diverifikasi oleh Tim ICT. silakan ke <b>Loket ICT</b> untuk mengambil laptop baru.</p>
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
            // JIKA NIP TIDAK ADA DI DB
            return res.send("<h2>NIP Tidak Ditemukan!</h2><a href='/'>Kembali</a>");
        }

    } catch (error) {
        console.error("Error pada cek-karyawan:", error);
        res.status(500).send("Terjadi kesalahan pada sistem. Silakan coba lagi.");
    }
});

// Tambahkan middleware ini di bagian atas app.js agar server bisa baca JSON
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

// Route: Simpan SN Lama (Update status menjadi 'Verified_by_User')
app.post('/simpan-sn-lama/:id', (req, res) => {
    const { model_lama, sn_lama, setuju_hak_milik } = req.body;
    const { id } = req.params;

    if (!setuju_hak_milik) {
        return res.send("Anda harus menyetujui syarat pengalihan hak milik.");
    }

    // UPDATE Database: Mengupdate model_lama dan sn_lama berdasarkan input user
    db.prepare("UPDATE transaksi SET model_lama = ?, sn_lama = ?, status = 'Verified_by_User' WHERE id = ?")
      .run(model_lama, sn_lama, id); //
      
    // Ganti res.send lama dengan template yang didesain ulang
    res.send(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
            <style>
                .text-h3 { font-family: 'Poppins'; font-size: 36px; font-weight: 700; line-height: 46px; } /* */
                .text-body-medium { font-family: 'Poppins'; font-size: 16px; font-weight: 400; line-height: 24px; } /* */
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
                        Serial Number <strong class="text-[#262626] font-bold">${sn_lama}</strong> telah berhasil direkam ke dalam sistem.
                    </p>
                    <p class="text-body-medium text-[#595959]">
                        Langkah selanjutnya, silakan datang ke <span class="font-bold text-primary">Loket ICT</span> untuk proses serah terima fisik laptop baru Anda.
                    </p>
                </div>

                <a href="/" class="inline-flex h-10 px-6 items-center justify-center rounded-lg bg-[#e62129] text-white text-sm font-bold transition-all hover:bg-[#ef6c70] active:bg-[#a51217] shadow-md shadow-red-100 uppercase w-full">
                    Kembali ke Beranda
                </a>
            </div>
        </body>
        </html>
    `);
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
    res.send("<h2>Data Terkirim!</h2><p>Silakan ke loket ICT untuk verifikasi fisik laptop.</p><a href='/'>Kembali</a>");
});

// Route: Dashboard Admin ICT
/*app.get('/admin', (req, res) => {
    const rows = db.prepare("SELECT * FROM transaksi WHERE status = 'Pending'").all();
    res.render('admin', { transactions: rows });
});*/
// Route: Dashboard Admin ICT
app.get('/admin', (req, res) => {
    // Ubah kueri ini agar mengambil status yang sudah diinput karyawan
    const rows = db.prepare("SELECT * FROM transaksi WHERE status = 'Verified_by_User'").all();
    res.render('admin', { transactions: rows });
});
/*
// Proses: Approval & Input Serial Number oleh Admin
app.post('/approve/:id', (req, res) => {
    const { sn_lama, sn_baru, model_baru } = req.body;
    const { id } = req.params;
    const stmt = db.prepare("UPDATE transaksi SET sn_lama = ?, sn_baru = ?, status = 'Completed' WHERE id = ?");
    stmt.run(sn_lama, sn_baru, model_baru, id);
    res.redirect('/admin');
});
*/

app.post('/approve/:id', (req, res) => {
    const { sn_lama, sn_baru, model_baru } = req.body;
    const { id } = req.params;

    // 1. Ambil data lengkap karyawan dari database
    const data = db.prepare("SELECT * FROM transaksi WHERE id = ?").get(id);

    if (!data) return res.status(404).send("Data tidak ditemukan");

    // 2. Update Database (Update SN dan status)
    db.prepare("UPDATE transaksi SET sn_lama = ?, sn_baru = ?, model_baru = ?, status = 'Completed' WHERE id = ?")
      .run(sn_lama, sn_baru, model_baru, id);

    // 3. Konfigurasi Nama File dan Path (Format: NIP.pdf)
    const namaFile = `${data.nip}.pdf`;
    const pathLengkap = path.join(folderArsip, namaFile);

    // 4. Generate PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // OTOMATIS SIMPAN KE FOLDER (Tanpa dialog simpan di browser)
    const writeStream = fs.createWriteStream(pathLengkap);
    doc.pipe(writeStream);

    // --- HALAMAN 1: PENYERAHAN LAPTOP LAMA ---
    doc.roundedRect(50, 50, 500, 80, 10).fill('#fff1f2');
    doc.fillColor('#e62129').fontSize(22).font('Helvetica-Bold').text('KONFIRMASI DATA ASET', 70, 75);
    doc.fillColor('#8c8c8c').fontSize(10).font('Helvetica').text('PENGALIHAN HAK MILIK PERANGKAT LAMA', 70, 105);

    doc.moveDown(5);
    // Detail Pegawai (Nama, NIP, Model)
    doc.fillColor('#262626').fontSize(11).font('Helvetica-Bold').text('IDENTITAS PEGAWAI', 50, doc.y);
    doc.moveDown();
    doc.fontSize(10).font('Helvetica').fillColor('#8c8c8c').text(`Nama Lengkap : `, { continued: true }).fillColor('#262626').text(data.nama);
    doc.text(`NIP           : `, { continued: true }).text(data.nip);
    doc.text(`Model Laptop  : `, { continued: true }).fillColor('#e62129').text(data.model_lama);
    doc.moveDown();

    // Box SN Lama
    doc.fillColor('#262626').font('Helvetica-Bold').text('Serial Number Terverifikasi:');
    doc.roundedRect(50, doc.y + 5, 500, 30, 5).strokeColor('#d9d9d9').stroke();
    doc.text(sn_lama, 65, doc.y + 15);
    doc.moveDown(3);

    // PERNYATAAN TERCENTANG OTOMATIS
    const boxY = doc.y;
    doc.roundedRect(50, boxY, 500, 60, 8).fill('#fafbee');
    doc.roundedRect(50, boxY, 500, 60, 8).strokeColor('#c2d43d').stroke();
    
    // Checkbox Hijau & Centang
    doc.roundedRect(65, boxY + 20, 18, 18, 4).fill('#c2d43d'); 
    doc.fillColor('#ffffff').fontSize(12).text('✓', 69, boxY + 23); // Centang putih
    
    doc.fillColor('#5b6416').fontSize(9).font('Helvetica-BoldOblique')
       .text('Saya menyetujui pengalihan aset ini menjadi milik pribadi dan membebaskan Universitas dari segala biaya pemeliharaan di masa mendatang.', 95, boxY + 18, { width: 440 });

    doc.moveDown(5);

    // AREA TANDA TANGAN (Kiri: Manager, Kanan: Karyawan)
    const sigY = doc.y;
    
    // Kolom Kiri: Manager ICT
    doc.fillColor('#8c8c8c').fontSize(9).font('Helvetica-Bold').text('MANAGER ICT,', 50, sigY, { width: 250, align: 'center' });
    try {
        // Mengambil file tanda tangan manager statis
        doc.image('signature_manager.png', 100, sigY + 15, { width: 100 });
    } catch (e) { doc.text('(Tanda Tangan Manager)', 100, sigY + 40); }
    doc.fillColor('#262626').text('__________________________', 50, sigY + 80, { width: 250, align: 'center' });
    doc.text('Head of ICT Division', 50, sigY + 95, { width: 250, align: 'center' });

    // Kolom Kanan: Karyawan (Tanda Tangan Digital dari DB)
    doc.fillColor('#8c8c8c').text('KARYAWAN / PENERIMA,', 300, sigY, { width: 250, align: 'center' });
    if (data.signature) {
        try {
            const base64Data = data.signature.replace(/^data:image\/png;base64,/, "");
            doc.image(Buffer.from(base64Data, 'base64'), 350, sigY + 15, { width: 100 });
        } catch (e) { doc.text('(Tanda Tangan Digital)', 350, sigY + 40); }
    }
    doc.fillColor('#262626').text(`( ${data.nama} )`, 300, sigY + 80, { width: 250, align: 'center' });
    doc.fontSize(8).text(`NIP: ${data.nip}`, 300, sigY + 95, { width: 250, align: 'center' });

    // --- HALAMAN 2: PENERIMAAN LAPTOP BARU (Sesuai Desain Modern) ---
    doc.addPage();
    
    // Header Branding
    doc.fillColor('#e62129').fontSize(20).text('ICT UNIVERSITAS', { align: 'center' });
    doc.fillColor('#8c8c8c').fontSize(8).text('BERITA ACARA SERAH TERIMA INVENTARIS', { align: 'center', tracking: 2 });
    doc.moveDown(0.5);
    doc.strokeColor('#e62129').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1.5);

    // Informasi Penerima
    doc.fillColor('#262626').fontSize(12).font('Helvetica-Bold').text('Informasi Penerima');
    doc.fontSize(9).font('Helvetica').moveDown(0.5);
    doc.text(`NAMA LENGKAP : ${data.nama}`);
    doc.text(`NIP          : ${data.nip}`);
    doc.text(`TANGGAL      : ${new Date().toLocaleDateString('id-ID')}`);
    doc.moveDown(2);

    // Tabel Detail Perangkat
    doc.fillColor('#262626').fontSize(12).font('Helvetica-Bold').text('Detail Perangkat');
    doc.rect(50, doc.y + 5, 500, 25).fill('#f5f5f5');
    doc.fillColor('#8c8c8c').fontSize(8).text('STATUS ASET', 65, doc.y + 15);
    doc.text('SERIAL NUMBER', 450, doc.y + 15);
    
    doc.moveDown(2.5);
    doc.fillColor('#e62129').font('Helvetica-Bold').text('LAPTOP BARU', 65, doc.y);
    doc.fillColor('#262626').text(sn_baru, 450, doc.y);
    
    doc.moveDown(1);
    doc.fillColor('#8c8c8c').font('Helvetica-Oblique').text('Laptop Lama (Return)', 65, doc.y);
    doc.text(sn_lama, 450, doc.y);
    doc.moveDown(3);

    // Kotak Pernyataan
    doc.roundedRect(50, doc.y, 500, 50, 4).fillColor('#fafbee').fill();
    doc.fillColor('#224488').fontSize(9).text('Saya menyatakan telah menerima perangkat dalam kondisi baik dan bertanggung jawab penuh atas aset ini.', 65, doc.y + 15, { align: 'center', width: 470 });
    doc.moveDown(5);

    // Tanda Tangan (Ambil dari Database jika sudah ada)
    if (data.signature) {
        try {
            const base64Data = data.signature.replace(/^data:image\/png;base64,/, "");
            doc.image(Buffer.from(base64Data, 'base64'), 400, doc.y, { width: 100 });
        } catch (e) { doc.text('(Tanda Tangan Digital)', 400, doc.y); }
    }
    
    doc.moveDown(4);
    doc.fillColor('#262626').fontSize(10).text(`( ${data.nama} )`, 400, doc.y, { align: 'center' });

    doc.end();

      // 5. Kirim respon setelah file selesai ditulis
    writeStream.on('finish', () => {
        console.log(`Dokumen BAST berhasil disimpan: ${pathLengkap}`);
        // Jika ingin otomatis download setelah approve, aktifkan baris di bawah:
        // res.download(pathLengkap); 
        res.redirect('/admin');
    });
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

// Update Route Approve
app.post('/approve/:id', async (req, res) => {
    const { sn_lama, sn_baru } = req.body;
    const { id } = req.params;

    const data = db.prepare("SELECT * FROM transaksi WHERE id = ?").get(id);

    // 1. Update Database
    db.prepare("UPDATE transaksi SET sn_lama = ?, sn_baru = ?, status = 'Completed' WHERE id = ?")
      .run(sn_lama, sn_baru, id);

    // 2. Generate PDF secara lokal sementara untuk dilampirkan ke email
    const doc = new PDFDocument();
    const pdfPath = `./temp_bast_${data.nip}.pdf`;
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    // (Isi konten PDF sama seperti sebelumnya)
    doc.fontSize(16).text('BERITA ACARA SERAH TERIMA LAPTOP', { align: 'center' });
    doc.moveDown().fontSize(12).text(`Nama: ${data.nama} | NIP: ${data.nip}`);
    doc.text(`SN Lama: ${sn_lama} | SN Baru: ${sn_baru}`);
    doc.end();

    // 3. Setelah PDF selesai dibuat, kirim Email
    stream.on('finish', () => {
        const mailOptions = {
            from: '"ICT Universitas" <admin.ict@universitas.ac.id>',
            to: `${data.nip}@universitas.ac.id`, // Mengasumsikan format email kampus
            subject: 'Berita Acara Serah Terima Laptop - ' + data.nama,
            text: `Halo ${data.nama},\n\nProses serah terima laptop Anda telah selesai. Terlampir salinan digital BAST untuk arsip Anda.\n\nSalam,\nDivisi ICT`,
            attachments: [{ filename: `BAST_${data.nip}.pdf`, path: pdfPath }]
        };

        transporter.sendMail(mailOptions, (error, info) => {
            // Hapus file sementara setelah terkirim
            fs.unlinkSync(pdfPath);
            
            if (error) {
                console.log(error);
                res.send("Approval berhasil, tapi email gagal terkirim.");
            } else {
                res.redirect('/admin');
            }
        });
    });
});


// Proses: Approval & Generate PDF BAST
app.post('/approve/:id', (req, res) => {
    const { sn_lama, sn_baru } = req.body;
    const { id } = req.params;

    // 1. Ambil data transaksi dari DB untuk isi PDF
    const data = db.prepare("SELECT * FROM transaksi WHERE id = ?").get(id);

    // 2. Update Database
    const stmt = db.prepare("UPDATE transaksi SET sn_lama = ?, sn_baru = ?, status = 'Completed' WHERE id = ?");
    stmt.run(sn_lama, sn_baru, id);

    // 3. Generate PDF
    const doc = new PDFDocument({ margin: 50 });
    let filename = `BAST_${data.nip}.pdf`;

    // Header untuk download langsung
    res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
    res.setHeader('Content-type', 'application/pdf');

    doc.pipe(res);

    // Konten PDF
    doc.fontSize(16).text('BERITA ACARA SERAH TERIMA (BAST) LAPTOP', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Nomor Transaksi: ${id}/ICT/${new Date().getFullYear()}`);
    doc.text('------------------------------------------------------------');
    doc.moveDown();

    doc.text(`Pada hari ini, ${new Date().toLocaleDateString('id-ID')}, telah dilakukan serah terima perangkat laptop antara Universitas dan Karyawan:`);
    doc.moveDown(0.5);
    doc.text(`Nama Karyawan : ${data.nama}`);
    doc.text(`NIP           : ${data.nip}`);
    doc.moveDown();

    doc.text('1. PENYERAHAN HAK MILIK (LAPTOP LAMA)', { underline: true });
    doc.text(`Model: ${data.model_lama}`);
    doc.text(`Serial Number (SN): ${sn_lama}`);
    doc.text('Status: Dialihkan menjadi hak milik pribadi karyawan.');
    doc.moveDown();

    doc.text('2. PENERIMAAN FASILITAS BARU (LAPTOP BARU)', { underline: true });
    doc.text(`Serial Number (SN): ${sn_baru}`);
    doc.text('Status: Aset Aktif Universitas (Fasilitas Kerja).');
    doc.moveDown(2);

    // Tanda Tangan
    doc.text('Pihak Universitas (ICT),          Penerima (Karyawan),', { columns: 2 });
    doc.moveDown(3);
    doc.text('(____________________)          (____________________)', { columns: 2 });

    doc.end();
});

// Route: Laporan untuk Manager
// Route: Laporan untuk Manager (DIPERBAIKI)
// Route: Laporan Utama Manager
app.get('/manager-report', (req, res) => {
    try {
        // Mengambil data yang sudah di-approve Admin (Completed) 
        // DAN yang sudah ditandatangani karyawan (Signed)
        const rows = db.prepare(`
            SELECT *, datetime(tanggal_pengajuan, 'localtime') as waktu_lokal 
            FROM transaksi 
            WHERE status IN ('Completed', 'Signed') 
            ORDER BY tanggal_pengajuan DESC
        `).all();
        
        // Menghitung ringkasan statistik
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
        console.error("DEBUG ERROR:", error); // Lihat detailnya di terminal/cmd
        res.status(500).send("Error Detail: " + error.message); 
}
});

// TAHAP 1: Cek NIP Karyawan
app.post('/cek-karyawan', (req, res) => {
    const { nip } = req.body;
    const data = db.prepare("SELECT * FROM transaksi WHERE nip = ?").get(nip);

    if (data) {
        // Jika data ditemukan, arahkan ke halaman input SN
        res.render('input-sn', { user: data });
    } else {
        // Jika NIP tidak ada di database
        res.send("<h2>NIP Tidak Ditemukan!</h2><p>Silakan hubungi bagian ICT untuk pendaftaran data aset.</p><a href='/'>Kembali</a>");
    }
});

// TAHAP 2: Simpan SN Lama dari Karyawan
app.post('/simpan-sn-lama/:id', (req, res) => {
    const { sn_lama } = req.body;
    const { id } = req.params;
    
    db.prepare("UPDATE transaksi SET sn_lama = ?, status = 'Verified_by_User' WHERE id = ?")
      .run(sn_lama, id);
      
    res.send("<h2>Berhasil!</h2><p>Serial Number telah tersimpan. Silakan ke loket ICT untuk mengambil laptop baru.</p>");
});

app.post('/simpan-sn-lama/:id', (req, res) => {
    const { sn_lama, setuju_hak_milik } = req.body;
    const { id } = req.params;

    // Jika checkbox tidak dicentang, kirim peringatan
    if (!setuju_hak_milik) {
        return res.send("Anda harus menyetujui pengalihan hak milik.");
    }

    db.prepare("UPDATE transaksi SET sn_lama = ?, status = 'Verified_by_User' WHERE id = ?")
      .run(sn_lama, id);

    res.send(`<h2>Berhasil!</h2><p>Persetujuan hak milik telah direkam. Silakan ke loket ICT.</p>`);
});

// Route: Halaman Tanda Tangan untuk Karyawan
app.get('/signature/:nip', (req, res) => {
    const data = db.prepare("SELECT * FROM transaksi WHERE nip = ? AND status = 'Completed'").get(req.params.nip);
    if (!data) return res.send("Data belum di-approve oleh Admin atau NIP salah.");
    res.render('signature', { user: data });
});

// Route: Simpan Tanda Tangan & Selesaikan Proses
app.post('/save-signature/:id', async (req, res) => {
    const { signature_data, item_charger, item_tas, item_mouse } = req.body;
    const { id } = req.params;

    // 1. Update Database
    db.prepare("UPDATE transaksi SET signature = ?, status = 'Signed' WHERE id = ?").run(signature_data, id);
    const data = db.prepare("SELECT * FROM transaksi WHERE id = ?").get(id);

    // 2. Kirim data ke halaman Preview
    // Kita kirimkan array kelengkapan agar rapi di preview
    let items = [];
    if (item_charger) items.push("Charger");
    if (item_tas) items.push("Tas Laptop");
    if (item_mouse) items.push("Mouse");

    res.render('preview-bast', { user: data, items: items });
});

// Pastikan rute ini ada di app.js Anda
app.get('/preview-bast/:nip', (req, res) => {
    const data = db.prepare("SELECT * FROM transaksi WHERE nip = ? AND status = 'Signed'").get(req.params.nip);
    if (!data) return res.send("Dokumen BAST belum tersedia atau belum ditandatangani.");
    
    // Tentukan item kelengkapan (bisa disesuaikan dengan database Anda)
    let items = ["Unit Charger", "Tas Laptop"]; 
    res.render('preview-bast', { user: data, items: items, revisit: true });
});