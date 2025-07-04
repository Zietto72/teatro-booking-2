require('dotenv').config();
const db = require('./db');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');
const QRCode = require('qrcode');
// Import template data from public folder
const config = require('./config/config.json');
const { showName, showDate, imgIntest, notespdf, emailJsUserId, apiUrl, zonePrices } = config;
const app = express();
const baseUrl = process.env.BASE_URL || 'http://localhost:3000';



// --- Nuovo endpoint: verifica esistenza PDF ---
// Va definito PRIMA di express.static per evitare che static restituisca 404
app.get('/api/pdf-exists/:evento/:filename', (req, res) => {
  const { evento, filename } = req.params;
  const filePath = path.join(__dirname, 'eventi', evento, 'PDF', filename);
  res.json({ exists: fs.existsSync(filePath) });
});

// Middleware
app.use(bodyParser.json({ limit: '10mb' }));

// Rende accessibile il file di configurazione al browser
app.use('/config.json', express.static(path.join(__dirname, 'config/config.json')));

app.use(express.static('public'));
app.use('/eventi', express.static(path.join(__dirname, 'eventi')));



app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static('public'));
app.use('/eventi', express.static(path.join(__dirname, 'eventi')));

app.post('/genera-pdf-e-invia', async (req, res) => {
  try {
    const { evento, prenotatore, email, telefono, spettatori, totale } = req.body;

    if (!evento || !prenotatore || !email || !spettatori) {
      return res.status(400).json({ error: 'Dati mancanti' });
    }

const eventFolder = path.join(__dirname, 'eventi', evento);
const outputDir = path.join(eventFolder, 'PDF');
const dbPath = path.join(eventFolder, 'data', 'booking.sqlite');  // ✅ questa sola volta

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const config = await getEventoConfig(dbPath);                     // ✅ usa dbPath qui
const { showName, showDate, imgIntest, imgEvento } = config;
const imgEventoUrl = `${baseUrl}/eventi/${evento}/${imgEvento}`;
    const sqlite3 = require('sqlite3').verbose();
    const db = new sqlite3.Database(dbPath);

    const bookingCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    const pdfLinks = [];

for (const s of spettatori) {
  const doc = new jsPDF();
  const codice = bookingCode;

// ✅ Inserimento immagine evento
try {
  const imgEventoPath = path.join(eventFolder, imgEvento); // es: 'eventi/2025-07-05_nome/images/spettacolo.png'
  const imgBuffer = fs.readFileSync(imgEventoPath);
  const imgBase64 = `data:image/png;base64,${imgBuffer.toString('base64')}`;
  doc.addImage(imgBase64, 'PNG', 10, 10, 50, 30); // x, y, width, height
} catch (e) {
  console.warn('⚠️ Immagine evento non trovata:', e.message);
}

// ✅ Contenuto testuale
// Font e dimensioni di base
const x = 10;
let y = 50;

// Spettacolo
doc.setFont('helvetica', 'normal');
doc.setFontSize(10);
doc.text('Spettacolo:', x, y);
doc.setFont('helvetica', 'bold');
doc.setFontSize(14);
doc.text(showName, x + 35, y);

// 🔽 Linea separatrice
y += 5;
doc.setDrawColor(150);
doc.setLineWidth(0.2);
doc.line(x, y, 200, y);

// Data
y += 10;
doc.setFont('helvetica', 'normal');
doc.setFontSize(10);
doc.text('Data:', x, y);
doc.setFont('helvetica', 'bold');
doc.setFontSize(14);
doc.text(showDate, x + 35, y);

// 🔽 Linea separatrice
y += 5;
doc.setDrawColor(150);
doc.setLineWidth(0.2);
doc.line(x, y, 200, y);

// Posto
y += 10;
doc.setFont('helvetica', 'normal');
doc.setFontSize(10);
doc.setTextColor(0, 0, 0);  // Etichetta in nero
doc.text('Posto:', x, y);

doc.setFont('helvetica', 'bold');
doc.setFontSize(14);
doc.setTextColor(220, 38, 38); // Rosso acceso (RGB)
doc.text(s.posto, x + 35, y);

// Ripristina colore nero per le righe successive
doc.setTextColor(0, 0, 0);

// 🔽 Linea separatrice
y += 5;
doc.setDrawColor(150);
doc.setLineWidth(0.2);
doc.line(x, y, 200, y);

// Spettatore
y += 10;
doc.setFont('helvetica', 'normal');
doc.setFontSize(10);
doc.text('Spettatore:', x, y);
doc.setFont('helvetica', 'bold');
doc.setFontSize(14);
doc.text(s.nome, x + 35, y);

// 🔽 Linea separatrice
y += 5;
doc.setDrawColor(150);
doc.setLineWidth(0.2);
doc.line(x, y, 200, y);

// Prenotatore
y += 10;
doc.setFont('helvetica', 'normal');
doc.setFontSize(10);
doc.text('Prenotato da:', x, y);
doc.setFont('helvetica', 'bold');
doc.setFontSize(14);
doc.text(`${prenotatore} (${email})`, x + 35, y);

// 🔽 Linea separatrice
y += 5;
doc.setDrawColor(150);
doc.setLineWidth(0.2);
doc.line(x, y, 200, y);

// Prezzo
y += 10;
doc.setFont('helvetica', 'normal');
doc.setFontSize(10);
doc.text('Prezzo:', x, y);
doc.setFont('helvetica', 'bold');
doc.setFontSize(14);
doc.text(`€ ${parseFloat(s.prezzo).toFixed(2)}`, x + 35, y);

// 🔽 Linea separatrice
y += 5;
doc.setDrawColor(150);
doc.setLineWidth(0.2);
doc.line(x, y, 200, y);


// ✅ QR Code con dati completi
try {
  const codice = JSON.stringify({
    codice: bookingCode,
    spettacolo: showName,
    data: showDate,
    posto: s.posto,
    spettatore: s.nome
  });

  const qr = await QRCode.toDataURL(codice);
  doc.addImage(qr, 'PNG', 150, 20, 40, 40);
} catch (e) {
  console.error('QR generation failed:', e.message);
}

      const safeName = s.nome.replace(/\s+/g, '_');
      const nomeFile = `${s.posto}_${safeName}.pdf`;
      const filePath = path.join(outputDir, nomeFile);
      fs.writeFileSync(filePath, Buffer.from(doc.output('arraybuffer')));
      pdfLinks.push(`/eventi/${evento}/PDF/${nomeFile}`);
    }

    db.serialize(() => {
      const stmtP = db.prepare(`
        INSERT INTO prenotazioni (posto, nome, email, telefono, prenotatore, bookingCode)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      spettatori.forEach(s => {
        stmtP.run(
          s.posto,
          s.nome,
          email,
          telefono,
          prenotatore,
          bookingCode
        );
      });
      stmtP.finalize();

      const stmtO = db.prepare(`INSERT OR IGNORE INTO occupiedSeats (posto) VALUES (?)`);
      spettatori.forEach(s => stmtO.run(s.posto));
      stmtO.finalize();
    });

    db.close();

    // --- INVIO EMAIL ---
    const templatePath = path.join(__dirname, 'email.html');
    let template = fs.readFileSync(templatePath, 'utf8');

    const [firstName, ...lastParts] = prenotatore.split(' ');
    const lastName = lastParts.join(' ');

    const pdfLinksHtml = spettatori.map(s => {
      const safeName = s.nome.trim().replace(/\s+/g, ' ');
      const label = `${s.posto} – ${safeName}`;
      const fileName = `${s.posto}_${s.nome.replace(/\s+/g, '_')}.pdf`;
const fileUrl = `${baseUrl}/eventi/${evento}/PDF/${fileName}`;
      return `
        <a href="${fileUrl}" target="_blank" style="
          display: inline-block;
          background-color: #007BFF;
          color: white;
          padding: 10px 16px;
          text-decoration: none;
          border-radius: 6px;
          margin: 5px 0;
          font-family: sans-serif;
          font-size: 14px;
        ">${label}</a>`;
    }).join('<br>\n');

    const htmlEmail = template
      .replace(/{{img_intest}}/g, imgIntest)
      .replace(/{{img_evento}}/g, imgEventoUrl)
      .replace(/{{show_name}}/g, showName)
      .replace(/{{show_date}}/g, showDate)
      .replace(/{{nome}}/g, firstName)
      .replace(/{{cognome}}/g, lastName)
      .replace(/{{email}}/g, email)
      .replace(/{{telefono}}/g, telefono)
      .replace(/{{pdf_links}}/g, pdfLinksHtml)
      .replace(/{{total_amount}}/g, totale.toFixed(2))
      .replace(/{{booking_code}}/g, bookingCode);

    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: 'email-smtp.eu-central-1.amazonaws.com',
      port: 465,
      secure: true,
      auth: {
        user: 'AKIA4WFX5S42LKQTJ367',
        pass: 'BJ0gXwB2brrL/H0KIHC4dzgvl9WTb0NQ+jpjuHGXwV4t'
      }
    });

    const mailOptions = {
      from: '"Teatro La Calzamaglia" <info@lacalzamaglia.it>',
      to: email,
      subject: 'Conferma Prenotazione',
      html: htmlEmail
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Errore invio email:', error);
      } else {
        console.log('✅ Email inviata:', info.messageId);
      }
    });

    return res.json({ success: true, pdfs: pdfLinks });

  } catch (err) {
    console.error('Errore server:', err);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Parametri per resconto.html

// 1) Ritorna tutte le prenotazioni dal database
app.get('/resoconto', (req, res) => {
  db.all(
    `SELECT * FROM prenotazioni ORDER BY id`,
    (err, rows) => {
      if (err) {
        console.error('Errore lettura prenotazioni dal DB:', err);
        return res.status(500).json({ error: err.message });
      }
      // rows è un array di oggetti: 
      //  [{ id:1, posto:'A1', nome:'Mario Rossi', … }, { … }, …]
      res.json(rows);
    }
  );
});

// 2) Ritorna solo i posti occupati
app.get('/occupiedSeats', (req, res) => {
  db.all(
    `SELECT posto FROM occupiedSeats`,
    (err, rows) => {
      if (err) {
        console.error('Errore lettura occupiedSeats dal DB:', err);
        return res.status(500).json({ error: err.message });
      }
      // rows è es. [ { posto: 'A1' }, { posto: 'B3' }, … ]
      // Mappiamo solo il valore della colonna
      const posti = rows.map(r => r.posto);
      res.json(posti);
    }
  );
});

// 2bis) Ritorna solo i posti occupati di un evento specifico
app.get('/eventi/:evento/occupied-seats', (req, res) => {
  const evento = req.params.evento;
  const dbPath = path.join(__dirname, 'eventi', evento, 'data', 'booking.sqlite');

  if (!fs.existsSync(dbPath)) {
    return res.status(404).json({ error: 'Database non trovato per questo evento' });
  }

  const dbEvento = new sqlite3.Database(dbPath);

  dbEvento.all(`SELECT posto FROM occupiedSeats`, (err, rows) => {
    if (err) {
      console.error('Errore lettura occupiedSeats dal DB evento:', err);
      return res.status(500).json({ error: err.message });
    }
    const posti = rows.map(r => r.posto);
    res.json(posti);
  });

  dbEvento.close();
});

// Elimina le prenotazioni tramite resoconto.html
app.post('/elimina-prenotazione', (req, res) => {
  const { posto, nome } = req.body;
  const safeName = nome.replace(/\s+/g, '_');
  const filePath = path.join(__dirname, 'public', 'PDF', `${posto}_${safeName}.pdf`);

  // 1) elimina il PDF
  if (fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); }
    catch (e) { console.error('❌ Errore eliminazione PDF:', e); }
  }

  // 2) elimina la prenotazione dal DB
  db.run(
    `DELETE FROM prenotazioni WHERE posto = ? AND nome = ?`,
    [posto, nome],
    (err1) => {
      if (err1) {
        console.error('❌ Errore cancellazione prenotazione DB:', err1);
        return res.status(500).json({ error: 'Errore DB prenotazioni' });
      }
      // 3) elimina il posto da occupiedSeats
      db.run(
        `DELETE FROM occupiedSeats WHERE posto = ?`,
        [posto],
        (err2) => {
          if (err2) {
            console.error('❌ Errore cancellazione occupiedSeats DB:', err2);
            return res.status(500).json({ error: 'Errore DB occupiedSeats' });
          }
          // Tutto ok
          res.json({ success: true });
        }
      );
    }
  );
});

// Crea evento da dashboard
const multer = require('multer');
const upload = multer({ dest: 'tmp/' });
const fse = require('fs-extra');
const sqlite3 = require('sqlite3').verbose();  // <<--- IMPORTANTE, aggiunto qui!
const eventiDir = path.join(__dirname, 'eventi');
const templateDir = path.join(__dirname, 'template_prenotazione');

function getEventoConfig(dbPath) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    db.all(`SELECT key, value FROM config`, (err, rows) => {
      db.close();
      if (err) return reject(err);
      const config = {};
      rows.forEach(({ key, value }) => {
        config[key] = key === 'zonePrices' ? JSON.parse(value) : value;
      });
      resolve(config);
    });
  });
}

//Gestione eventi in dashboard
app.get('/eventi-list', async (req, res) => {
  const eventiDir = path.join(__dirname, 'eventi');
  if (!fs.existsSync(eventiDir)) return res.json([]);

  const eventi = fs.readdirSync(eventiDir).filter(name => {
    const dir = path.join(eventiDir, name);
    return fs.lstatSync(dir).isDirectory();
  });

  const listaEventi = [];

  for (const nomeCartella of eventi) {
    const dbPath = path.join(eventiDir, nomeCartella, 'data', 'booking.sqlite');
    if (fs.existsSync(dbPath)) {
      try {
        const config = await getEventoConfig(dbPath);
       listaEventi.push({
  nome: config.showName || nomeCartella,
  folderName: nomeCartella,
  data: config.showDate || '',
  ora: config.showTime || '', // 🔴 << AGGIUNGI QUESTA LINEA
  numeroPostiTotali: parseInt(config.numeroPostiTotali || 0),
  imgIntest: config.imgIntest || '',
  imgEvento: config.imgEvento || '',
  zonePrices: config.zonePrices || {}
});
      } catch (e) {
        console.error(`Errore lettura config da DB evento ${nomeCartella}:`, e);
        listaEventi.push({ nome: nomeCartella, folderName: nomeCartella, data: '', numeroPostiTotali: 0 });
      }
    } else {
      listaEventi.push({ nome: nomeCartella, folderName: nomeCartella, data: '', numeroPostiTotali: 0 });
    }
  }

  res.json(listaEventi);
});

// --- Prenotazioni di un evento completo ---
app.get('/eventi/:evento/prenotazioni', (req, res) => {
  const evento = req.params.evento;
  const dbPath = path.join(__dirname, 'eventi', evento, 'data', 'booking.sqlite');

  if (!fs.existsSync(dbPath)) {
    return res.status(404).json({ error: 'Database non trovato' });
  }

  const dbEvento = new sqlite3.Database(dbPath);

  dbEvento.all(`SELECT posto, nome, email, telefono, prenotatore, bookingCode FROM prenotazioni ORDER BY id`, (err, rows) => {
    dbEvento.close();
    if (err) {
      console.error('Errore lettura prenotazioni:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// --- Elenco PDF disponibili per un evento ---
app.get('/eventi/:evento/pdf-list', (req, res) => {
  const evento = req.params.evento;
  const pdfDir = path.join(__dirname, 'eventi', evento, 'PDF');

  if (!fs.existsSync(pdfDir)) {
    return res.json([]); // Nessun PDF trovato
  }

  fs.readdir(pdfDir, (err, files) => {
    if (err) {
      console.error('Errore lettura PDF:', err);
      return res.json([]);
    }
    res.json(files); // Array di nomi file PDF
  });
});

app.get('/eventi/:evento/config', (req, res) => {
  const { evento } = req.params;
  const dbPath = path.join(__dirname, 'eventi', evento, 'data', 'booking.sqlite');

  if (!fs.existsSync(dbPath)) {
    return res.status(404).json({ error: 'Database non trovato per questo evento' });
  }

  const db = new sqlite3.Database(dbPath);

  db.all('SELECT key, value FROM config', (err, rows) => {
    db.close();
    if (err) {
      console.error(`Errore lettura config da DB evento ${evento}:`, err);
      return res.status(500).json({ error: 'Errore lettura config' });
    }

    const config = {};
    rows.forEach(row => {
      config[row.key] = row.key === 'zonePrices' ? JSON.parse(row.value) : row.value;
    });

    res.json(config);
  });
});

// --- Elimina intera cartella evento ---
app.post('/eventi/:evento/elimina', (req, res) => {
  const evento = req.params.evento;
  const eventoPath = path.join(__dirname, 'eventi', evento);

  if (!fs.existsSync(eventoPath)) {
    return res.status(404).json({ error: 'Evento non trovato' });
  }

  try {
    fse.removeSync(eventoPath);  // Elimina tutta la cartella evento
    console.log(`✅ Evento "${evento}" eliminato.`);
    res.json({ success: true });
  } catch (err) {
    console.error('Errore eliminazione evento:', err);
    res.status(500).json({ error: 'Errore eliminazione evento' });
  }
});

// --- Elimina singola prenotazione ---
app.post('/eventi/:evento/elimina-prenotazione', (req, res) => {
  const evento = req.params.evento;
  const { posto, nome } = req.body;  // ATTENZIONE: anche 'nome' adesso

  const dbPath = path.join(__dirname, 'eventi', evento, 'data', 'booking.sqlite');
  const pdfDir = path.join(__dirname, 'eventi', evento, 'PDF');

  if (!fs.existsSync(dbPath)) {
    return res.status(404).json({ success: false, error: 'Database non trovato' });
  }

  const dbEvento = new sqlite3.Database(dbPath);

  dbEvento.serialize(() => {
    dbEvento.run(`DELETE FROM prenotazioni WHERE posto = ? AND nome = ?`, [posto, nome], function (err1) {
      if (err1) {
        console.error('❌ Errore cancellazione prenotazione:', err1);
        dbEvento.close();
        return res.status(500).json({ success: false, error: 'Errore DB prenotazioni' });
      }

      dbEvento.run(`DELETE FROM occupiedSeats WHERE posto = ?`, [posto], function (err2) {
        dbEvento.close();
        if (err2) {
          console.error('❌ Errore cancellazione occupiedSeats:', err2);
          return res.status(500).json({ success: false, error: 'Errore DB occupiedSeats' });
        }

        // --- Elimina il PDF corrispondente ---
        try {
          const files = fs.readdirSync(pdfDir);
          files.forEach(file => {
            if (file.startsWith(`${posto}_`)) {
              fs.unlinkSync(path.join(pdfDir, file));
            }
          });
        } catch (e) {
          console.warn('⚠️ Errore durante eliminazione PDF:', e);
        }

        console.log(`✅ Prenotazione per posto ${posto} eliminata da evento "${evento}".`);
        return res.json({ success: true }); // <<< QUESTA È LA RISPOSTA GIUSTA
      });
    });
  });
});

app.post('/crea-evento', upload.fields([{ name: 'svg' }, { name: 'imgEvento' }]), async (req, res) => {
  try {
    const nome = req.body.nome.trim();
    const data = req.body.data;
    const ora = req.body.ora || '';
    const numeroPostiTotali = req.body.numeroPostiTotali;
    const files = req.files;
    const zonePrices = JSON.parse(req.body.zonePrices || '{}');

    if (!nome || !data || !files['svg']) {
      return res.status(400).json({ success: false, message: "Dati mancanti" });
    }

    const nomeSvg = files['svg'][0].originalname;
    const folder = `${data}_${nome.replace(/\s+/g, '_')}`;
    const dir = path.join(eventiDir, folder);

    if (!fs.existsSync(eventiDir)) fs.mkdirSync(eventiDir);

    // 1. Crea cartella evento
    fs.mkdirSync(dir, { recursive: true });

    // 2. Copia template
    await fse.copy(templateDir, dir);

    // 3. Crea sottocartelle
    const svgDir = path.join(dir, 'svg');
    fs.mkdirSync(svgDir);
    const imagesDir = path.join(dir, 'images');
    fs.mkdirSync(imagesDir);

    // 4. Salva SVG
    fs.renameSync(files['svg'][0].path, path.join(svgDir, nomeSvg));

    // 5. Salva immagine spettacolo (se presente)
    let imgEventoPath = '';
    if (files['imgEvento']) {
      const imgOriginale = files['imgEvento'][0];
      const imgSavePath = path.join(imagesDir, 'spettacolo.png');
      fs.renameSync(imgOriginale.path, imgSavePath);
      imgEventoPath = 'images/spettacolo.png';
    }

    // 6. Config globale
    const globalConfig = require('./config/config.json');

    // 7. Crea cartella PDF
    const pdfPath = path.join(dir, 'PDF');
    if (!fs.existsSync(pdfPath)) fs.mkdirSync(pdfPath);

    // 8. Crea database SQLite
    const dataFolderPath = path.join(dir, 'data');
    if (!fs.existsSync(dataFolderPath)) fs.mkdirSync(dataFolderPath);

    const dbPath = path.join(dataFolderPath, 'booking.sqlite');
    const db = new sqlite3.Database(dbPath);

    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS prenotazioni (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          posto TEXT,
          nome TEXT,
          email TEXT,
          telefono TEXT,
          prenotatore TEXT,
          bookingCode TEXT
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS occupiedSeats (
          posto TEXT PRIMARY KEY
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS config (
          key TEXT PRIMARY KEY,
          value TEXT
        )
      `);

      const insertConfig = db.prepare(`INSERT INTO config (key, value) VALUES (?, ?)`);
      insertConfig.run('showName', nome);
      insertConfig.run('showDate', data);
      insertConfig.run('showTime', ora);
      insertConfig.run('imgIntest', globalConfig.imgIntest);
      insertConfig.run('notespdf', globalConfig.notespdf);
      insertConfig.run('svgFile', nomeSvg);
      insertConfig.run('imgEvento', imgEventoPath);
      insertConfig.run('numeroPostiTotali', numeroPostiTotali.toString());
      insertConfig.run('folderName', folder);
      insertConfig.run('zonePrices', JSON.stringify(zonePrices));
      insertConfig.finalize();

      db.close();
    });

    console.log(`✅ Evento "${folder}" creato correttamente con database dedicato.`);
    res.json({ success: true });

  } catch (err) {
    console.error("❌ Errore creazione evento:", err);
    res.status(500).json({ success: false, message: 'Errore interno server' });
  }
});

    // Verifica QRCODE da app QR CODE READER

app.get('/verifica-codice', (req, res) => {
  const codice = req.query.codice;
  const evento = req.query.evento;

  if (!codice || !evento) return res.status(400).json({ valido: false });

  const dbPath = path.join(__dirname, 'eventi', evento, 'data', 'booking.sqlite');
  const db = new sqlite3.Database(dbPath);

  db.get(`SELECT * FROM prenotazioni WHERE bookingCode = ?`, [codice], (err, row) => {
    if (err || !row) return res.json({ valido: false });
    return res.json({ valido: true, nome: row.nome, posto: row.posto });
  });

  db.close();
});

// --- Verifica QRCODE con dati completi (via POST) ---
app.post('/verifica-codice-qr', (req, res) => {
  try {
    const { codice, spettacolo, data, posto, spettatore } = req.body;

    if (!codice || !data) return res.status(400).json({ valido: false });

    const eventoFolder = `${data}_${spettacolo.replace(/\s+/g, '_')}`;
    const dbPath = path.join(__dirname, 'eventi', eventoFolder, 'data', 'booking.sqlite');

    if (!fs.existsSync(dbPath)) return res.status(404).json({ valido: false });

    const db = new sqlite3.Database(dbPath);

    db.get(`SELECT * FROM prenotazioni WHERE bookingCode = ? AND posto = ? AND nome = ?`,
      [codice, posto, spettatore],
      (err, row) => {
        db.close();
        if (err || !row) return res.json({ valido: false });
        return res.json({ valido: true, nome: row.nome, posto: row.posto });
      });
  } catch (e) {
    console.error('Errore verifica QR:', e);
    return res.status(500).json({ valido: false });
  }
});

// --- Modifica dati dell'evento (nome, data, svg, posti, prezzi)
app.post('/eventi/:evento/modifica', upload.fields([{ name: 'svg' }, { name: 'imgEvento' }]), async (req, res) => {
  try {
    const evento = req.params.evento;
    const dir = path.join(__dirname, 'eventi', evento);
    const dbPath = path.join(dir, 'data', 'booking.sqlite');

    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ success: false, message: 'Evento non trovato' });
    }

    const db = new sqlite3.Database(dbPath);
    const files = req.files;
    const body = req.body;

    const updateConfig = db.prepare(`UPDATE config SET value = ? WHERE key = ?`);

updateConfig.run(body.nome, 'showName');
updateConfig.run(body.data, 'showDate');
updateConfig.run(body.ora, 'showTime'); // ✅ aggiunto per salvare l'ora
updateConfig.run(body.numeroPostiTotali, 'numeroPostiTotali');
updateConfig.run(JSON.stringify(JSON.parse(body.zonePrices || '{}')), 'zonePrices');


    if (files['svg']) {
      const svgPath = path.join(dir, 'svg', files['svg'][0].originalname);
      fs.renameSync(files['svg'][0].path, svgPath);
      updateConfig.run(files['svg'][0].originalname, 'svgFile');
    }

    if (files['imgEvento']) {
      const imgPath = path.join(dir, 'images', 'spettacolo.png');
      fs.renameSync(files['imgEvento'][0].path, imgPath);
      updateConfig.run('images/spettacolo.png', 'imgEvento');
    }

    updateConfig.finalize();
    db.close();

    console.log(`✏️ Evento "${evento}" aggiornato.`);
    res.json({ success: true });

  } catch (err) {
    console.error("❌ Errore modifica evento:", err);
    res.status(500).json({ success: false, message: 'Errore interno server' });
  }
});

// ---- Sostituione immagine dello spettacolo
app.post('/eventi/:evento/modifica-immagine', upload.single('imgEvento'), (req, res) => {
  const evento = req.params.evento;
  const file = req.file;
  if (!file) return res.status(400).json({ success: false, message: 'File mancante' });

  const eventoDir = path.join(__dirname, 'eventi', evento);
  const imagesDir = path.join(eventoDir, 'images');
  const dbPath = path.join(eventoDir, 'data', 'booking.sqlite');

  const imgSavePath = path.join(imagesDir, 'spettacolo.png');

  try {
    // Sovrascrive immagine
    fs.renameSync(file.path, imgSavePath);

    // Aggiorna percorso immagine nel database
    const db = new sqlite3.Database(dbPath);
    db.run(`UPDATE config SET value = ? WHERE key = 'imgEvento'`, ['images/spettacolo.png'], function (err) {
      db.close();
      if (err) {
        console.error('Errore aggiornamento DB:', err);
        return res.status(500).json({ success: false });
      }
      res.json({ success: true });
    });
  } catch (e) {
    console.error('Errore salvataggio immagine:', e);
    res.status(500).json({ success: false });
  }
});

// --- Avvio del server ---
const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server avviato su http://localhost:${PORT}`);
});