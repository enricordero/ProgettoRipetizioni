import http from 'http';
import fs from 'fs';
import express, { NextFunction, Request, Response } from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import cors, { CorsOptions } from 'cors';
import fileUpload from 'express-fileupload';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import bcrypt, { compare } from 'bcrypt';

/* ********************** HTTP server ********************** */
dotenv.config({ path: ".env" });
const connectionString = process.env.connectionStringAtlas!;
const dbName = process.env.dbName;
const port = process.env.PORT;
let paginaErrore: string;
const app = express();
const server = http.createServer(app);
server.listen(port, () => {
  init();
  console.log(`Server listening on port ${port}`);
});
function init() {
  fs.readFile('./static/error.html', (err, data) => {
    if (!err) {
      paginaErrore = data.toString();
    } else {
      paginaErrore = '<h1>Resource not found</h1>';
    }
  });
}

const tokenExpiresIn = 3600; // 1 ora
const privateKey = fs.readFileSync('./keys/privateKey.pem', 'utf8');
const publicKey = fs.readFileSync('./keys/publicKey.crt', 'utf8');
const jwtKey = fs.readFileSync('./keys/jwtKey', 'utf8');

const cookiesOptions = {
  path: '/',
  maxAge: tokenExpiresIn * 1000,
  httpOnly: true,
  secure: true,
  sameSite: false
};
/* ********************** Middleware ********************** */
// 1. Request log
app.use('/', (req: Request, res: Response, next: NextFunction) => {
  console.log(req.method + ': ' + req.originalUrl);
  next();
});

// 2. Static resources
app.use('/', express.static('./static'));

// 3. Body params
app.use('/', express.json({ limit: '50mb' })); // Parsifica i parametri in formato json
app.use('/', express.urlencoded({ limit: '50mb', extended: true })); // Parsifica i parametri urlencoded
app.use(cookieParser());

// 4. Params log
app.use('/', (req, res, next) => {
  if (Object.keys(req.query).length > 0) {
    console.log('--> GET params: ' + JSON.stringify(req.query));
  }
  if (Object.keys(req.body).length > 0) {
    console.log('--> BODY params: ' + JSON.stringify(req.body));
  }
  next();
});

// 5. CORS
const whitelist = [
  'http://my-crud-server.herokuapp.com ', // porta 80 (default)
  'https://my-crud-server.herokuapp.com ', // porta 443 (default)
  'http://localhost:3000',
  'https://localhost:3001',
  'http://localhost:4200', // server angular
  'https://cordovaapp' // porta 443 (default)
];

const corsOptions: CorsOptions = {
  origin: function (origin, callback) {
    if (!origin)
      // browser direct call
      return callback(null, true);
    if (whitelist.indexOf(origin) === -1) {
      var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    } else return callback(null, true);
  },
  credentials: true
};
app.use('/', cors(corsOptions));

/* ********************** Client routes ********************** */
function createToken(data: any) {
  const now = Math.floor(Date.now() / 1000); // Tempo corrente in secondi
  const payload = {
    iat: now,
    exp: now + tokenExpiresIn,
    _id: data._id,
    username: data.username,
    admin: data.admin || false
  };
  return jwt.sign(payload, jwtKey);
}

// Middleware per verificare il token JWT
function verifyToken(req: any, res: any, next: any) {
  const token = req.cookies.token;
  if (!token) {
    console.error("Token mancante.");
    return res.status(401).send({ err: "Token mancante. Effettua nuovamente il login." });
  }

  jwt.verify(token, jwtKey, (err, payload: any) => {
    if (err) {
      console.error("Errore nella verifica del token:", err.message);
      if (err.name === "TokenExpiredError") {
        console.error("Token scaduto.");
        return res.status(401).send({ err: "Token scaduto. Effettua nuovamente il login." });
      }
      return res.status(401).send({ err: "Token non valido. Effettua nuovamente il login." });
    }

    req["payload"] = payload;
    next();
  });
}

app.post('/api/login', async (req: any, res: any) => {
  const { email, password } = req.body;
  const collectionName = req.body.codice

  if (!email || !password) {
    console.error('Email o password mancanti.');
    return res.status(400).send({ err: 'Username e password sono obbligatori.' });
  }

  try {
    const client = new MongoClient(connectionString);
    await client.connect();
    const collection = client.db(dbName).collection(collectionName);

    const user = await collection.findOne({ email });
    console.log('Utente trovato:', user);

    if (!user) {
      console.error('Utente non trovato.');
      return res.status(401).send({ err: 'Email o password non validi.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.error('Password non valida.');
      return res.status(401).send({ err: 'Email o password non validi.' });
    }

    const token = createToken(user);
    console.log('Token generato:', token);
    console.log('Utente autenticato:', { email: user.email, id: user._id });

    res.cookie('token', token, cookiesOptions);
    res.send({ ris: 'ok', email: user.email, id: user._id });
  } catch (err) {
    console.error('Errore durante il login:', err);
    res.status(500).send({ err: 'Errore interno del server.' });
  }
});

app.post('/api/logout', (req: Request, res: Response) => {
  res.clearCookie('token');
  res.send({ ris: 'Logout effettuato con successo.' });
});

app.get('/api/getUtente',verifyToken, async (req: any, res: any) => {
  let collectionName = "students";
  let id = req.query.id as string;

  if (!id) {
    return res.status(400).json({ error: "Parametro id mancante" });
  }

  const client = new MongoClient(connectionString);
  try {
    await client.connect();
    const collection = client.db(dbName).collection(collectionName);

    const data = await collection.findOne(
      { _id: new ObjectId(id) },
      { projection: { _id: 1, nome: 1, cognome: 1 } }
    );

    if (!data) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: `Errore esecuzione query: ${err}` });
  } finally {
    await client.close();
  }
});


app.patch('/api/aggiornaValutazione', async (req: any, res: any) => {
  const collectionName = "teachers";
  const id = req.body.id;
  const valutazione = Number(req.body.valutazione);

  if (!id || isNaN(valutazione)) {
    return res.status(400).send('Parametri mancanti o non validi');
  }

  const client = new MongoClient(connectionString);
  try {
    await client.connect();
    const collection = client.db(dbName).collection(collectionName);

    const updateResult = await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $inc: {
          sommaValutazioni: valutazione,
          numeroValutazioni: 1
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).send('Professore non trovato');
    }

    const updatedDoc = await collection.findOne({ _id: new ObjectId(id) });

    res.status(200).send(updatedDoc);
  } catch (err) {
    res.status(500).send(`Errore esecuzione query: ${err}`);
  } finally {
    await client.close();
  }
});


app.get('/api/getSpecializzazioni', async (req: Request, res: Response) => {
  let collectionName = "subjects"

  const client = new MongoClient(connectionString);
  await client.connect();
  const collection = client.db(dbName).collection(collectionName);

  const request = collection.find().toArray();
  request.catch((err) => {
    res.status(500).send(`Errore esecuzione query: ${err}`);
  });
  request.then((data) => {
    res.send(data);
  });
  request.finally(() => {
    client.close();
  });
});

app.get('/api/getMaterie', async (req: Request, res: Response) => {
  const collectionName = "subjects";

  const client = new MongoClient(connectionString);
  await client.connect();
  const collection = client.db(dbName).collection(collectionName);

  try {
    const data = await collection.find().toArray();

    const uniqueMaterie = new Set<string>();

    data.forEach((doc) => {
      if (doc.indirizzi) {
        Object.values(doc.indirizzi).forEach((indirizzo: any) => {
          Object.values(indirizzo).forEach((annoMaterie: any) => {
            if (Array.isArray(annoMaterie)) {
              annoMaterie.forEach((materia: string) => uniqueMaterie.add(materia));
            }
          });
        });
      }
    });

    res.send(Array.from(uniqueMaterie).sort()); // Ordina opzionalmente
  } catch (err) {
    res.status(500).send(`Errore esecuzione query: ${err}`);
  } finally {
    await client.close();
  }
});


app.get('/api/getMateriePerIndirizzo', async (req: Request, res: Response) => {
  let collectionName = "subjects"
  let indirizzo: string = req.query.indirizzo as string
  let materie: any = []

  const client = new MongoClient(connectionString);
  await client.connect();
  const collection = client.db(dbName).collection(collectionName);

  const request = collection.find().toArray();
  request.catch((err) => {
    res.status(500).send(`Errore esecuzione query: ${err}`);
  });
  request.then((data) => {
    for (const item in data[0]["indirizzi"]) {
      if (item == indirizzo)
        materie.push(data[0]["indirizzi"][item])
    }
    res.send(materie);
  });
  request.finally(() => {
    client.close();
  });
});

app.get('/api/getBestProfessors', async (req: Request, res: Response) => {
  const collectionName = "teachers";
  const client = new MongoClient(connectionString);
  try {
    await client.connect();
    const collection = client.db(dbName).collection(collectionName);
    const data = await collection.find().toArray();
    const result = data
      .map(prof => ({
        ...prof,
        mediaValutazioni: prof.numeroValutazioni > 0
          ? prof.sommaValutazioni / prof.numeroValutazioni
          : 0
      }))
      .sort((a, b) => b.mediaValutazioni - a.mediaValutazioni)
      .slice(0, 4);
    res.send(result);
  } catch (err) {
    res.status(500).send(`Errore esecuzione query: ${err}`);
  } finally {
    await client.close();
  }
});

app.get('/api/getProfessoriPerMateria', async (req: Request, res: Response) => {
  const collectionName = "teachers";
  const materiaQuery = (req.query.materia as string || "").trim().toLowerCase().replace(/\s+/g, '');
  const client = new MongoClient(connectionString);
  try {
    await client.connect();
    const collection = client.db(dbName).collection(collectionName);
    const data = await collection.find().toArray();
    const filtered = data
      .filter(prof => {
        const materie = prof.materia
          .split(',')
          .map((m: string) => m.trim().toLowerCase().replace(/\s+/g, ''));
        return materie.includes(materiaQuery);
      })
      .map(({ password, ...rest }) => rest)
      .sort((a, b) =>
        b.sommaValutazioni / b.numeroValutazioni -
        a.sommaValutazioni / a.numeroValutazioni
      );
    res.send(filtered);
  } catch (err) {
    res.status(500).send(`Errore esecuzione query: ${err}`);
  } finally {
    await client.close();
  }
});

app.get('/api/getRichieste', async (req: Request, res: Response) => {
  let collectionName = "teacherRequests"

  const client = new MongoClient(connectionString);
  await client.connect();
  const collection = client.db(dbName).collection(collectionName);

  const request = collection.find().toArray();
  request.catch((err) => {
    res.status(500).send(`Errore esecuzione query: ${err}`);
  });
  request.then((data) => {
    res.send(data);
  });
  request.finally(() => {
    client.close();
  });
});

app.post('/api/creaRichiestaProfessore', async (req: Request, res: Response) => {
  const collectionName = "teacherRequests";
  const account = req.body.account;

  if (!account || typeof account !== "object") {
    res.status(400).send("Dati account non validi");
  }

  const client = new MongoClient(connectionString);
  try {
    await client.connect();
    const collection = client.db(dbName).collection(collectionName);

    const result = await collection.insertOne(account);
    res.status(201).send({
      message: "Account registrato con successo",
      insertedId: result.insertedId
    });
  } catch (err) {
    console.error("Errore inserimento account:", err);
    res.status(500).send(`Errore inserimento account: ${err}`);
  } finally {
    await client.close();
  }
});

app.delete('/api/deleteRequest', async (req: Request, res: Response) => {
  const collectionName = "teacherRequests";
  const id = req.body.id;

  const client = new MongoClient(connectionString);
  try {
    await client.connect();
    const collection = client.db(dbName).collection(collectionName);

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      res.status(404).send("Nessun documento trovato con l'id specificato");
    } else {
      res.status(200).send({ message: "Richiesta cancellata con successo" });
    }
  } catch (err) {
    console.error("Errore durante la cancellazione:", err);
    res.status(500).send(`Errore durante la cancellazione: ${err}`);
  } finally {
    await client.close();
  }
});

app.post('/api/creaUtenteProfessore', async (req: Request, res: Response) => {
  const collectionName = "teachers";
  const account = req.body.account;

  const client = new MongoClient(connectionString);
  try {
    await client.connect();
    const collection = client.db(dbName).collection(collectionName);

    const result = await collection.insertOne(account);
    res.status(201).send({
      message: "Account registrato con successo",
      insertedId: result.insertedId
    });
  } catch (err) {
    console.error("Errore inserimento account:", err);
    res.status(500).send(`Errore inserimento account: ${err}`);
  } finally {
    await client.close();
  }
});

app.post('/api/creaUtenteStudente', async (req: Request, res: Response) => {
  const collectionName = "students";
  const account = req.body.account;

  const client = new MongoClient(connectionString);
  try {
    await client.connect();
    const collection = client.db(dbName).collection(collectionName);

    let hashedPassword = await bcrypt.hash(account.password, 10)

    let accountWithHashedPassword = {
      nome: account.nome,
      cognome: account.cognome,
      email: account.email,
      password: hashedPassword
    }

    const result = await collection.insertOne(accountWithHashedPassword);
    res.status(201).send({
      message: "Account registrato con successo",
      insertedId: result.insertedId
    });
  } catch (err) {
    console.error("Errore inserimento account:", err);
    res.status(500).send(`Errore inserimento account: ${err}`);
  } finally {
    await client.close();
  }
});

app.get('/api/me', verifyToken, (req: Request, res: Response) => {
  const payload = (req as any).payload;

  res.send({
    id: payload._id,
    nome: payload.nome,
    cognome: payload.cognome,
    email: payload.email
  });
});

/* ********************** Default Route & Error Handler ********************** */
app.use('/', (req: Request, res: Response) => {
  res.status(404);
  if (!req.originalUrl.startsWith('/api/')) {
    res.send(paginaErrore);
  } else {
    res.send(`Resource not found: ${req.originalUrl}`);
  }
});

app.use((err: any, req: Request, res: Response) => {
  console.log(err.stack);
  res.status(500).send(err.message);
});
