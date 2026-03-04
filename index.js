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
    tanggal_pengajuan DATETIME DEFAULT CURRENT_TIMESTAMP,
    tanggal_serah DATETIME,
    tanggal_terima DATETIME
  )
`);

const checkData = db.prepare("SELECT count(*) as count FROM transaksi").get();
console.log("Jumlah data saat ini di database:", checkData.count);

if (checkData.count === 0) {
    const insert = db.prepare("INSERT INTO transaksi (nama, nip, email, role_is_admin) VALUES (?, ?, ?, ?)");
    insert.run("admin", "admin123", "TIK@universitaspertamina.ac.id", "1");
    insert.run("nabil", "123", "albert.ltp@universitaspertamina.ac.id", "0");
    
    insert.run("Dr. Eng. Paramita Jaya Ratri, S.Si, M.Si", "116009", "paramita.jr@universitaspertamina.ac.id", "0");
    insert.run("Meredita Susanty, M.Sc", "116020", "meredita.susanty@universitaspertamina.ac.id", "0");
    insert.run("Epo Prasetya Kusumah, S.T, M.Sc", "116021", "epo.pk@universitaspertamina.ac.id", "0");
    insert.run("Dicky Ahmad Zaky, M.T", "116026", "dicky.az@universitaspertamina.ac.id", "0");
    insert.run("Sari Widyanti, M.En.", "116027", "sari.widyanti@universitaspertamina.ac.id", "0");
    insert.run("Muhammad Husni Mubarak Lubis, S.T, MS", "116028", "muhammad.hml@universitaspertamina.ac.id", "0");
    insert.run("Waskito Pranowo, M.T", "116030", "waskito.pranowo@universitaspertamina.ac.id", "0");
    insert.run("Iktri Madrinovella, M.Si", "116031", "iktri.madrinovella@universitaspertamina.ac.id", "0");
    insert.run("Ludovika Jannoke, M.Sc", "116032", "ludovika.jannoke@universitaspertamina.ac.id", "0");
    insert.run("Ajeng Purna Putri Oktaviani, M.T.", "116033", "ajeng.ppo@universitaspertamina.ac.id", "0");
    insert.run("Raka Sudira Wardana, M.T.", "116035", "raka.sw@universitaspertamina.ac.id", "0");
    insert.run("Weny Astuti, M.T.", "116036", "weny.astuti@universitaspertamina.ac.id", "0");
    insert.run("Dr. Arianta, S.T, M.T", "116038", "arianta@universitaspertamina.ac.id", "0");
    insert.run("Dr. Eng. Ari Rahman, S.T., M.Eng", "116043", "ari.rahman@universitaspertamina.ac.id", "0");
    insert.run("Nurulbaiti Listyendah Zahra, M.T", "116048", "nurulbaiti.lz@universitaspertamina.ac.id", "0");
    insert.run("Muhammad Akbar Barrinaya, M.T", "116050", "barrinaya@universitaspertamina.ac.id", "0");
    insert.run("Yudi Rahmawan, S.T, M.Sc, Ph.D", "116052", "yudi.rahmawan@universitaspertamina.ac.id", "0");
    insert.run("Khusnun Widiyati, S.T., M.Eng., Ph.D", "116053", "khusnun.widiyati@universitaspertamina.ac.id", "0");
    insert.run("Teguh Aryo Nugroho, M.T", "116054", "teguh.an@universitaspertamina.ac.id", "0");
    insert.run("Herminarto Nugroho, S.T., M.Sc", "116056", "herminarto.nugroho@universitaspertamina.ac.id", "0");
    insert.run("Dr.Eng. Wahyu Kunto Wibowo, S.T., M.Eng", "116059", "wahyu.kw@universitaspertamina.ac.id", "0");
    insert.run("Harummi Sekar Amarilies, S.T, MBA", "116065", "harummi.sa@universitaspertamina.ac.id", "0");
    insert.run("Alifiana Permata Sari, M.Sc", "116066", "alifiana.ps@universitaspertamina.ac.id", "0");
    insert.run("Ayu Dahliyanti, S.T, M.Eng", "116067", "ayu.dahliyanti@universitaspertamina.ac.id", "0");
    insert.run("Ika Dyah Widharyanti, S.T, MS", "116068", "ika.widharyanti@universitaspertamina.ac.id", "0");
    insert.run("Rico Ricardo, S.E., M.Ec", "116072", "rico.ricardo@universitaspertamina.ac.id", "0");
    insert.run("Achmad Kautsar, M.Si.", "116073", "achmad.kautsar@universitaspertamina.ac.id", "0");
    insert.run("Nursechafia, S.E., M.Ec.", "116076", "nursechafia@universitaspertamina.ac.id", "0");
    insert.run("Andika Pambudi, S.P., M.Si", "116077", "andika.pambudi@universitaspertamina.ac.id", "0");
    insert.run("Rezqi Ananda Basid , S.E, MBA", "116080", "rezqi.ab@universitaspertamina.ac.id", "0");
    insert.run("Atiqa Khaneef Harahap, S.Ikom, M.Si", "116082", "atiqa.kh@universitaspertamina.ac.id", "0");
    insert.run("Ita Musfirowati Hanika, S.A.P, M.I.Kom", "116083", "ita.mh@universitaspertamina.ac.id", "0");
    insert.run("Muhammad Nur Ahadi, M.I.Kom", "116084", "muhammad.na@universitaspertamina.ac.id", "0");
    insert.run("Dr. Farah Mulyasari, S.T., M.Sc", "116087", "farah.mulyasari@universitaspertamina.ac.id", "0");
    insert.run("Frieska Haridha, M.A.", "116090", "frieska.haridha@universitaspertamina.ac.id", "0");
    insert.run("Dr. Iqbal Ramadhan, M.IP.", "116091", "iqbal.ramadhan@universitaspertamina.ac.id", "0");
    insert.run("Silvia Dian Anggraeni, S.Sos, M.A", "116092", "silvia.da@universitaspertamina.ac.id", "0");
    insert.run("Wahyu Agung Pramudito, Ph. D", "116093", "wahyu.agung@universitaspertamina.ac.id", "0");
    insert.run("Dr. Suhari Pranyoto, S.E., Ak., M.M", "116095", "suhari.pranyoto@universitaspertamina.ac.id", "0");
    insert.run("Dr. Suharti, S.Pd., M.Si.", "116098", "suharti.s@universitaspertamina.ac.id", "0");
    insert.run("Agung Nugroho, Ph.D.", "116099", "agung.n@universitaspertamina.ac.id", "0");
    insert.run("Sandy Kurniawan, Ph.D.", "116100", "sandy.ks@universitaspertamina.ac.id", "0");
    insert.run("Dr. Eng. Mega Mutiara Sari, M.Si.", "116102", "mega.ms@universitaspertamina.ac.id", "0");
    insert.run("Evi Siti Sofiyah, Ph.D.", "116103", "es.sofiyah@universitaspertamina.ac.id", "0");
    insert.run("Dr.Eng. Sri Hastuty", "116104", "sri.hastuty@universitaspertamina.ac.id", "0");
    insert.run("Eka Puspitawati, Ph.D.", "116106", "eka.p@universitaspertamina.ac.id", "0");
    insert.run("Dr. Tasmi, S.Si, M.Si", "116109", "tasmi@universitaspertamina.ac.id", "0");
    insert.run("Dr. Astra Agus Pramana DN., S.Si., M.Sc.", "116111", "astraagus.p@universitaspertamina.ac.id", "0");
    insert.run("Dr. Eng. Purwo Kadarno, M.Eng.", "116113", "purwo.kadarno@universitaspertamina.ac.id", "0");
    insert.run("Eduardus Budi Nursanto, Ph.D.", "116116", "eduardus.bn@universitaspertamina.ac.id", "0");
    insert.run("Dr. Ian Montratama", "116117", "ian.montratama@universitaspertamina.ac.id", "0");
    insert.run("Dr. Indra Kusumawardhana, S.Hum, M. Hub. Int", "116123", "indra.kusumawardhana@universitaspertamina.ac.id", "0");
    insert.run("Arif Murti Rozamuri, Ph. D", "116124", "arifmurti.r@universitaspertamina.ac.id", "0");
    insert.run("Dr. Ida Herawati", "116126", "idaherawati@universitaspertamina.ac.id", "0");
    insert.run("Dr. Rusdi Abbas", "116127", "rusdiabbas@universitaspertamina.ac.id", "0");
    insert.run("Iwan Sukarno, Ph. D", "116128", "iwansukarno@universitaspertamina.ac.id", "0");
    insert.run("Nona Merry Merpati Mitan, Ph. D", "116129", "nona.merry@universitaspertamina.ac.id", "0");
    insert.run("Ade Irawan, Ph. D", "116130", "adeirawan@universitaspertamina.ac.id", "0");
    insert.run("Muttaqin Ph. D", "116131", "muttaqin@universitaspertamina.ac.id", "0");
    insert.run("Agus Abdulah, Ph.D", "116132", "agusabdullah@universitaspertamina.ac.id", "0");
    insert.run("Dr. Eng. Resti Samyati Jatiningrum", "116136", "resti.sj@universitaspertamina.ac.id", "0");
    insert.run("Teuku Mahlil, S.T., M.Eng., Ph.D.", "116137", "teukumahlil@universitaspertamina.ac.id", "0");
    insert.run("Ariyanti Sarwono, Ph. D", "116139", "ariyanti.sarwono@universitaspertamina.ac.id", "0");
    insert.run("Dr. Eng. Nova Ulhasanah", "116140", "nova.u@universitaspertamina.ac.id", "0");
    insert.run("E. Byan Wahyu Riyandwita, Ph. D", "116141", "byan.wr@universitaspertamina.ac.id", "0");
    insert.run("Dr. Jati Arie Wibowo, M.T", "116143", "jati.aw@universitaspertamina.ac.id", "0");
    insert.run("Harya Danio, M.T", "116144", "harya.d@universitaspertamina.ac.id", "0");
    insert.run("Nita Indriani Pertiwi, M.T", "116148", "nitaindriani.p@universitaspertamina.ac.id", "0");
    insert.run("Ranny Adriana, M.T", "116149", "ranny.adriana@universitaspertamina.ac.id", "0");
    insert.run("Dr. Elan Nurhadi P, SE, MSM", "116152", "elan.nurhadi@universitaspertamina.ac.id", "0");
    insert.run("Dr. Eng. Muhammad Abdillah", "116153", "m.abdillah@universitaspertamina.ac.id", "0");
    insert.run("Dita Floresyona, Ph. D", "116154", "dita.floresyona@universitaspertamina.ac.id", "0");
    insert.run("Novita Putri Rudiany, MA", "116156", "novita.putri@universitaspertamina.ac.id", "0");
    insert.run("Dr. Mohammad Ichlas El Qudsi, SSi, Msi", "116157", "ichlas.elqudsi@universitaspertamina.ac.id", "0");
    insert.run("Dr. Iwan Setya Budi, M.T", "116158", "iwan.setya@universitaspertamina.ac.id", "0");
    insert.run("Dr. Nila Tanyela", "118001", "nila.tanyela@universitaspertamina.ac.id", "0");
    insert.run("Dr. Evi Sofia, MBA", "118002", "evi.sofia@universitaspertamina.ac.id", "0");
    insert.run("Nurul Fajar Januriyadi, Ph.D", "118004", "nurul.fj@universitaspertamina.ac.id", "0");
    insert.run("Teuku Muhammad Roffi, Ph.D.", "118007", "teuku.roffi@universitaspertamina.ac.id", "0");
    insert.run("Dr. Imam Priyono, B.Sc., M.Sc.", "119001", "imam.priyono@universitaspertamina.ac.id", "0");
    insert.run("Dr. Eng. Tirta Rona Mayangsari, M.Si.", "119004", "tirta.rm@universitaspertamina.ac.id", "0");
    insert.run("Rangga Ganzar Noegraha, Ph.D.", "119005", "rangga.gn@universitaspertamina.ac.id", "0");
    insert.run("Muhammad Arham, Ph. D", "119008", "m.arham@universitaspertamina.ac.id", "0");
    insert.run("Muhammad Fauzi Abdul Rachman, S.I.P., M.T., MA", "119009", "mfarachman@universitaspertamina.ac.id", "0");
    insert.run("Naeli Fitria, MA", "119010", "naeli.fitria@universitaspertamina.ac.id", "0");
    insert.run("Vivi Varlina, M.Si", "119012", "vivi.varlina@universitaspertamina.ac.id", "0");
    insert.run("Fiska Kusumawati, MBA", "119013", "fiska.kusumawati@universitaspertamina.ac.id", "0");
    insert.run("Dr. Hari Nugroho, M.M., M.S.E", "119014", "hari.nugroho@universitaspertamina.ac.id", "0");
    insert.run("Dr. Feriansyah, S.E., M.Si", "119015", "feriansyah@universitaspertamina.ac.id", "0");
    insert.run("Fatimah Dinan Qonitan, S.T., M.T", "119016", "fatimah.dinan@universitaspertamina.ac.id", "0");
    insert.run("Dumex Sutra Pasaribu, S.T., M.Sc", "119017", "dumex.pasaribu@universitaspertamina.ac.id", "0");
    insert.run("Soni Satiawan, B.Sc., M.Sc", "119018", "soni.satiawan@universitaspertamina.ac.id", "0");
    insert.run("Misbahudin, S.T., M.T", "119019", "misbahudin@universitaspertamina.ac.id", "0");
    insert.run("Dian Yesy Fatimah, S.T., M.Eng", "119020", "dian.fatimah@universitaspertamina.ac.id", "0");
    insert.run("Pramudya Rinengga Datu Perdana, S.T., M.Sc", "119021", "pramudya.rinengga@universitaspertamina.ac.id", "0");
    insert.run("Adita Utami, S.T., M.T", "119022", "adita.utami@universitaspertamina.ac.id", "0");
    insert.run("Rinaldi Medali Rachman, S.T., M.Sc", "119025", "rinaldi.rachman@universitaspertamina.ac.id", "0");
    insert.run("Randi Farmana Putra, S.Si., M.Si", "119030", "randi.putra@universitaspertamina.ac.id", "0");
    insert.run("Sylvia Ayu Pradanawati, Ph.D", "119031", "sylvia.pradanawati@universitaspertamina.ac.id", "0");
    insert.run("Dara Ayuda Maharsi, S.T., M.T", "119032", "dara.maharsi@universitaspertamina.ac.id", "0");
    insert.run("Azis Adharis, S.Si., M.Si., Ph.D", "119034", "azis.adharis@universitaspertamina.ac.id", "0");
    insert.run("Intan Oktafiani, S.Kom., M.T", "119035", "intan.oktafiani@universitaspertamina.ac.id", "0");
    insert.run("Adji candra Kurniawan, S.T., M.T., CSCA.", "120004", "adjick@universitaspertamina.ac.id", "0");
    insert.run("Dr. Muhammad Zaki Almuzakki, M.Si, M.Sc.", "116019", "m.z.almuzakki@universitaspertamina.ac.id", "0");
    insert.run("Harya Dwi Nugraha, M.Sc, DIC, Ph.D", "116025", "harya.dn@universitaspertamina.ac.id", "0");
    insert.run("Yelita Anggiane Iskandar, M.T", "116064", "yelita.ai@universitaspertamina.ac.id", "0");
    insert.run("Dr. Eng Arlyn Aristo, S.T., M.T.", "120011", "Arlyn.aristo@universitaspertamina.ac.id", "0");
    insert.run("Dr. A. Rinto Pudyantoro, S.E., MM., AK., CA", "120012", "rinto.pudyantoro@universitaspertamina.ac.id", "0");
    insert.run("Gede Widia Pratama Adhyaksa, Ph.D", "121003", "gede.wpa@universitaspertamina.ac.id", "0");
    insert.run("Fajar Febiani Amanda, Ph.D", "120013", "fajar.fa@universitaspertamina.ac.id", "0");
    insert.run("Dr. Wahyudi Marhaen Pratopo Eko Setyamojo, S.IP., M.Si", "121008", "wahyudi.mpes@universitaspertamina.ac.id", "0");
    insert.run("Dr. Nanda R. Nurdianto", "116147", "nanda.nurdianto@universitaspertamina.ac.id", "0");
    insert.run("Dr. Eng. Yose Fachmi Buys, B.Eng., M.Eng.", "121009", "yose.fachmi@universitaspertamina.ac.id", "0");
    insert.run("Wegik Dwi Prasetyo, S.T, MS", "116070", "wegik.dp@universitaspertamina.ac.id", "0");
    insert.run("Dr. Ir. Dedy Dewanto. ACII., M.M", "122007", "dedy.dewanto@universitaspertamina.ac.id", "0");
    insert.run("Dr. Erwin Susanto, S.Si., M.M ", "122004", "erwin.susanto@universitaspertamina.ac.id", "0");
    insert.run("Dr. Soni Prayogi, S.Pd, M.Si", "122002", "soni.prayogi@universitaspertamina.ac.id", "0");
    insert.run("Dr. Fayza Yulia S.T., M.T", "122005", "fayza.yulia@universitaspertamina.ac.id", "0");
    insert.run("Dr. Arie Sukma Jaya, S.T., M.Eng., IPM", "122006", "arie.sj@universitaspertamina.ac.id", "0");
    insert.run("Dr. Ir. M. Fanshurullah Asa, M.T", "122012", "m.fanshurullahasa@universitaspertamina.ac.id", "0");
    insert.run("Resista Vikaliana, S.Si., MM", "122014", "resista.vikaliana@universitaspertamina.ac.id", "0");
    insert.run("Dr. Adhitya Ryan Ramadhani, S.T, M.Sc", "116049", "adhitya.rr@universitaspertamina.ac.id", "0");
    insert.run("Nonni Soraya Sambudi, M.Sc., Ph.D", "122009", "nonni.ss@universitaspertamina.ac.id", "0");
    insert.run("Dr. Ariana Yunita, M.I.T., MBA", "116015", "ariana.yunita@universitaspertamina.ac.id", "0");
    insert.run("Dra. Christine Sri Marnani, M.A.P.", "122018", "christine.sm@universitaspertamina.ac.id", "0");
    insert.run("I Wayan Koko Suryawan, S.T., M.T., Ph.D", "119033", "i.suryawan@universitaspertamina.ac.id", "0");
    insert.run("Dr. Catia Angli Curie, S.T, M.Sc.", "116071", "catia.ac@universitaspertamina.ac.id", "0");
    insert.run("Dr. Laksmi Dewi, S.T, MS", "116069", "laksmi.dewi@universitaspertamina.ac.id", "0");
    insert.run("Dr. Vani Arliani, S.T, M.T", "116151", "vani.arliani@universitaspertamina.ac.id", "0");
    insert.run("Dr.sc. Tegar Nurwahyu Wijaya, M.Si", "116010", "tegar.nw@universitaspertamina.ac.id", "0");
    insert.run("Elonasari, S.Mat., M.Aktr.", "125001", "elonasari@universitaspertamina.ac.id", "0");
    insert.run("Radisha Fanni Sianti, S.Mat., M.Stat.", "125002", "radisha.fs@universitaspertamina.ac.id", "0");
    insert.run("Syukrio Idaman, S.Si., M.Si.", "125003", "syukrio.idaman@universitaspertamina.ac.id", "0");
    insert.run("Kiki Adi Kurnia, S.Si., M.Sc., Ph.D.", "125004", "kiki.ak@universitaspertamina.ac.id", "0");
    insert.run("Ibnu Susanto, S.T., M.Eng., Ph.D.", "125005", "ibnu.susanto@universitaspertamina.ac.id", "0");
    insert.run("Imam Eko Setiawan, S.Hut., M.E.S., Ph.D.", "125006", "imam.es@universitaspertamina.ac.id", "0");
    insert.run("Adrianto, S.T., M.T.", "125007", "adrianto@universitaspertamina.ac.id", "0");
    insert.run("Rinaldy Dasilfa, S.Si., M.T.", "125008", "rinaldy.dasilfa@universitaspertamina.ac.id", "0");
    insert.run("Ahmad Faisal Dahlan, S.T., M.Eng.", "125009", "ahmad.fd@universitaspertamina.ac.id", "0");
    insert.run("Herry Kartika Gandhi, S.T., M.T.", "125010", "herry.kg@universitaspertamina.ac.id", "0");
    insert.run("Ridwan Rahmanto, S.T., M.T.", "125011", "ridwan.rahmanto@universitaspertamina.ac.id", "0");
    insert.run("Santika Tristi Maryudhaningrum, S.T., M.T.", "125012", "santika.tristi@universitaspertamina.ac.id", "0");
    insert.run("Ni Wayan Suryatini, S.Sos., M.Si.", "125013", "niwayan.s@universitaspertamina.ac.id", "0");
    insert.run("Sri Morisonya Mauludianna, S.E., M.M.", "125014", "Sri.mm@universitaspertamina.ac.id", "0");
    insert.run("Bob Adyari, M.I.L, Ph.D.", "116046", "bob.adyari@universitaspertamina.ac.id", "0");
    insert.run("Meri Ayurini, M.Sc", "116012", "meri.ayurini@universitaspertamina.ac.id", "0");
    insert.run("Wahyuningrum Angesti Lestari, S.T, M.Sc", "116022", "wahyuningrum.al@universitaspertamina.ac.id", "0");
    insert.run("Khabib Khumaini, M.Si", "116013", "khabib.khumaini@universitaspertamina.ac.id", "0");
    insert.run("Fera Dwi Setyani, M.T ", "118003", "feradwisetyani@universitaspertamina.ac.id", "0");
    insert.run("Osaliana Budiarto, S.Si., M.T", "119024", "osaliana.budiarto@universitaspertamina.ac.id", "0");
    insert.run("Angga Ranggana Putra, S.A.B, MBA", "116081", "angga.rp@universitaspertamina.ac.id", "0");
    insert.run("Gati Annisa Hayu, S.T., M.T., M.Sc", "119023", "gati.hayu@universitaspertamina.ac.id", "0");
    insert.run("Ardila Putri, S.IP, MA", "120002", "ardila.putri@universitaspertamina.ac.id", "0");
    insert.run("Nur Layli Rachmawati, S.T, M.T", "116062", "nl.rachmawati@universitaspertamina.ac.id", "0");
    insert.run("Mirna Lusiani, S.T., M.T", "119026", "mirna.lusiani@universitaspertamina.ac.id", "0");
    insert.run("Rika Isnarti, S.IP, MA (IntRel)", "120001", "rika.isnarti@universitaspertamina.ac.id", "0");
    insert.run("Wirman Hidayat, M.T", "116040", "wirman.hidayat@universitaspertamina.ac.id", "0");
    insert.run("Melisa Indriana Putri, S.Ikom, M.I.Kom", "116085", "melisa.ip@universitaspertamina.ac.id", "0");
    insert.run("Gita Kurnia, S.T, M.Sc", "116061", "gita.kurnia@universitaspertamina.ac.id", "0");
    insert.run("Rio Priandri Nugroho, M. Minres", "116155", "rio.priandri@universitaspertamina.ac.id", "0");
    insert.run("Betanti Ridhosari, M.T", "116044", "betanti.ridhosari@universitaspertamina.ac.id", "0");

    console.log("Data berhasil dimasukkan ke database.");
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
                    from: '"TIK Universitas" <pertamapertamax@gmail.com>',
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
                                Kode ini rahasia. Jangan berikan kepada siapa pun, termasuk staf TIK.
                            </p>
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
                        Langkah selanjutnya, silakan datang ke <span class="font-bold text-primary">Loket TIK</span> untuk proses serah terima fisik laptop baru Anda.
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
    res.send("<h2>Data Terkirim!</h2><p>Silakan ke loket TIK untuk verifikasi fisik laptop.</p><a href='/'>Kembali</a>");
});


// Route: Dashboard Admin TIK
app.get('/admin', (req, res) => {
    // Ubah kueri ini agar mengambil status yang sudah diinput karyawan
    const rows = db.prepare("SELECT * FROM transaksi WHERE status = 'Verified_by_User'").all();
    res.render('admin', { transactions: rows });
});

// Route: Konfirmasi Laptop Lama Telah Diserahkan
app.post('/admin/konfirmasi-lama/:id', (req, res) => {
    const { id } = req.params;

    try {
        // Update status ml_is_handed_over dan catat waktu saat ini
        db.prepare(`
            UPDATE transaksi 
            SET ml_is_handed_over = 1, 
                tanggal_serah = CURRENT_TIMESTAMP 
            WHERE id = ?
        `).run(id);

        // Refresh halaman admin agar perubahan status terlihat
        res.redirect('/admin'); 
    } catch (error) {
        console.error("Gagal mengonfirmasi laptop lama:", error);
        res.status(500).send("Terjadi kesalahan sistem saat update data.");
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
    const { signature_data, item_charger, item_tas, item_mouse } = req.body;
    const { id } = req.params;

    const isChargerExist = item_charger ? 1 : 0;
    const isBagExist = item_tas ? 1 : 0;

    console.log()

try {
        const lastRecord = db.prepare(`
            SELECT no_surat_lama FROM transaksi 
            WHERE no_surat_lama IS NOT NULL 
            ORDER BY tanggal_terima DESC LIMIT 1
        `).get();

        let nextBaseNumber;

        if (!lastRecord || !lastRecord.no_surat_lama) {
            nextBaseNumber = 13;
        } else {
            const match = lastRecord.no_surat_lama.match(/Nomor\s*:\s*(\d+)/);
            const lastNumber = match ? parseInt(match[1]) : 12;
            nextBaseNumber = lastNumber + 1; 
        }

        const seqNumber1 = nextBaseNumber;
        const seqNumber2 = seqNumber1 + 1;

        const today = new Date();
        
        const noSuratBaru = `Nomor : ${seqNumber1}/UPER-WRS.3.2/BA/TI.01/${getRomanMonth(today.getMonth())}/${today.getFullYear()}`;
        const noSuratLama = `Nomor : ${seqNumber2}/UPER-WRS.3.2/BA/TI.01/${getRomanMonth(today.getMonth())}/${today.getFullYear()}`;

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
        doc.text('1', 50, tableTop + 25); 
        doc.text(data.model_baru || 'Laptop Baru', 90, tableTop + 25); 
        doc.text(data.sn_baru, 280, tableTop + 25); 
        doc.text('1 Unit', 430, tableTop + 25); 
        
        doc.x = 50;
        doc.y = tableTop + 50;
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
        doc.text(': Randi Farmana Putra', 130, startY2);

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
        doc.text('1', 50, tableTop2 + 25); 
        doc.text(`${data.model_lama} (SN: ${data.sn_lama})`, 90, tableTop2 + 25); 
        doc.text('1 Unit', 430, tableTop2 + 25); 

        doc.x = 50;
        doc.y = tableTop2 + 50;
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
        doc.text('Randi Farmana Putra', 90, sigTop2 + 100, { align: 'center', width: 150, underline: true });
        doc.font('Times-Roman');
        doc.text('NIP. 119030', 90, sigTop2 + 115, { align: 'center', width: 150 });

        doc.font('Times-Bold');
        doc.text(`${data.nama}`, 90, sigTop2 + 100, { align: 'center', width: 150, underline: true }); 
        doc.font('Times-Roman');
        doc.text(`NIP. ${data.nip}`, 90, sigTop2 + 115, { align: 'center', width: 150 });

        doc.end();

        writeStream.on('finish', async () => {
            const mailOptions = {
                from: '"TIK Universitas" <pertamapertamax@gmail.com>',
                to: data.email, 
                subject: 'Dokumen BAST TIK Universitas',
                html: `
                    <div style="font-family: sans-serif; padding: 20px;">
                        <h2 style="color: #e62129;">Serah Terima Berhasil</h2>
                        <p>Halo <b>${data.nama}</b>,</p>
                        <p>Terima kasih. Terlampir salinan Berita Acara Serah Terima (BAST) yang telah anda tandatangani.</p>
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
        doc.text('1', 50, tableTop + 25); 
        doc.text(data.model_baru || 'Laptop Baru', 90, tableTop + 25); 
        doc.text(data.sn_baru, 280, tableTop + 25); 
        doc.text('1 Unit', 430, tableTop + 25); 
        
        doc.x = 50; doc.y = tableTop + 50; doc.moveDown(1);

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
        doc.text('1', 50, tableTop2 + 25); 
        doc.text(`${data.model_lama} (SN: ${data.sn_lama})`, 90, tableTop2 + 25); 
        doc.text('1 Unit', 430, tableTop2 + 25); 

        doc.x = 50; doc.y = tableTop2 + 50; doc.moveDown(1);

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

/*
// TAHAP 1: Cek NIP Karyawan
app.post('/cek-karyawan', (req, res) => {
    const { nip } = req.body;
    const data = db.prepare("SELECT * FROM transaksi WHERE nip = ?").get(nip);

    if (data) {
        // Jika data ditemukan, arahkan ke halaman input SN
        res.render('input-sn', { user: data });
    } else {
        // Jika NIP tidak ada di database
        res.send("<h2>NIP Tidak Ditemukan!</h2><p>Silakan hubungi bagian TIK untuk pendaftaran data aset.</p><a href='/'>Kembali</a>");
    }
});
// TAHAP 2: Simpan SN Lama dari Karyawan
app.post('/simpan-sn-lama/:id', (req, res) => {
    const { sn_lama } = req.body;
    const { id } = req.params;
    
    db.prepare("UPDATE transaksi SET sn_lama = ?, status = 'Verified_by_User' WHERE id = ?")
      .run(sn_lama, id);
      
    res.send("<h2>Berhasil!</h2><p>Serial Number telah tersimpan. Silakan ke loket TIK untuk mengambil laptop baru.</p>");
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

    res.send(`<h2>Berhasil!</h2><p>Persetujuan hak milik telah direkam. Silakan ke loket TIK.</p>`);
});
*/
// Route: Halaman Tanda Tangan untuk Karyawan

/*
app.post('/save-signature/:id', (req, res) => {
    // Ambil input dari form
    const { signature_data, item_charger, item_tas } = req.body;
    const { id } = req.params;

    // Konversi nilai checkbox ke Boolean SQLite (1 = True, 0 = False)
    // Jika checkbox tidak dicentang, nilainya undefined
    const isChargerExist = item_charger === 'true' ? 1 : 0;
    const isBagExist = item_tas === 'true' ? 1 : 0;

    try {
        // 1. Update Database secara komprehensif
        db.prepare(`
            UPDATE transaksi 
            SET signature = ?, 
                status = 'Signed',
                charger_is_exist = ?,
                bag_is_exist = ?
            WHERE id = ?
        `).run(signature_data, isChargerExist, isBagExist, id);

        // 2. Ambil data terbaru untuk dikirim ke halaman Preview
        const data = db.prepare("SELECT * FROM transaksi WHERE id = ?").get(id);

        // 3. Susun array kelengkapan untuk tampilan Preview BAST (Opsional, sesuai kode lama Anda)
        let items = [];
        if (isChargerExist === 1) items.push("Unit Charger Lama");
        if (isBagExist === 1) items.push("Tas Laptop Lama");

        res.render('preview-bast', { 
            user: data, 
            items: items,
            revisit: false // Jika ini adalah kali pertama user melihat BAST
        });

    } catch (error) {
        console.error("Gagal menyimpan tanda tangan:", error);
        res.status(500).send("Terjadi kesalahan saat menyimpan dokumen serah terima.");
    }
});
*/
/*
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
*/
// Pastikan rute ini ada di app.js Anda

// Route: Dashboard Admin TIK
/*app.get('/admin', (req, res) => {
    const rows = db.prepare("SELECT * FROM transaksi WHERE status = 'Pending'").all();
    res.render('admin', { transactions: rows });
});*/

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
/*
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
    
    // Kolom Kiri: Manager TIK
    doc.fillColor('#8c8c8c').fontSize(9).font('Helvetica-Bold').text('MANAGER TIK,', 50, sigY, { width: 250, align: 'center' });
    try {
        // Mengambil file tanda tangan manager statis
        doc.image('signature_manager.png', 100, sigY + 15, { width: 100 });
    } catch (e) { doc.text('(Tanda Tangan Manager)', 100, sigY + 40); }
    doc.fillColor('#262626').text('__________________________', 50, sigY + 80, { width: 250, align: 'center' });
    doc.text('Head of TIK Division', 50, sigY + 95, { width: 250, align: 'center' });

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
    doc.fillColor('#e62129').fontSize(20).text('TIK UNIVERSITAS', { align: 'center' });
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
*/ 

/*
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
            from: '"TIK Universitas" <admin.TIK@universitas.ac.id>',
            to: `${data.nip}@universitas.ac.id`, // Mengasumsikan format email kampus
            subject: 'Berita Acara Serah Terima Laptop - ' + data.nama,
            text: `Halo ${data.nama},\n\nProses serah terima laptop Anda telah selesai. Terlampir salinan digital BAST untuk arsip Anda.\n\nSalam,\nDivisi TIK`,
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
*/
/*
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
    doc.fontSize(12).text(`Nomor Transaksi: ${id}/TIK/${new Date().getFullYear()}`);
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
    doc.text('Pihak Universitas (TIK),          Penerima (Karyawan),', { columns: 2 });
    doc.moveDown(3);
    doc.text('(____________________)          (____________________)', { columns: 2 });
``````````````````````````````````````````````````
    doc.end();
});
*/