import http from 'http';
import fs from 'fs';
import express, { NextFunction, Request, Response } from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import cors, { CorsOptions } from 'cors';
import multer from 'multer';

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
app.get('/api/getUsers', async (req: Request, res: Response) => {
  let collectionName = "users"

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
  let collectionName = "subjects"
  let indirizzo: string = req.query.indirizzo as string
  let anno: string = req.query.anno as string;
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
      if(item == indirizzo)
        materie.push(data[0]["indirizzi"][item][anno])
    }
    res.send(materie);
  });
  request.finally(() => {
    client.close();
  });
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
      if(item == indirizzo)
        materie.push(data[0]["indirizzi"][item])
    }
    res.send(materie);
  });
  request.finally(() => {
    client.close();
  });
});

app.get('/api/getBestProfessors', async (req: Request, res: Response) => {
  const collectionName = "users";
  const client = new MongoClient(connectionString);

  try {
    await client.connect();
    const collection = client.db(dbName).collection(collectionName);

    const data = await collection.find().toArray();

    // Raccogliamo tutti i teachers in un unico array
    let allTeachers: any[] = [];
    data.forEach(user => {
      if (Array.isArray(user.teachers)) {
        allTeachers = allTeachers.concat(user.teachers);
      }
    });

    // Calcolo media voti ed eliminazione dei non validi
    const teachersWithMedia = allTeachers
      .filter(t => typeof t.sommaValutazioni === 'number' && typeof t.numeroValutazioni === 'number' && t.numeroValutazioni > 0)
      .map(t => ({
        ...t,
        mediaVoti: t.sommaValutazioni / t.numeroValutazioni
      }));

    // Ordina per media voti decrescente e prendi i migliori 4
    const topTeachers = teachersWithMedia
      .sort((a, b) => b.mediaVoti - a.mediaVoti)
      .slice(0, 4);

    // Costruzione della risposta
    const response = topTeachers.map(teacher => ({
      nome: teacher.nome,
      cognome: teacher.cognome,
      citta: teacher.citta,
      email: teacher.email,
      materia: teacher.materia,
      sommaValutazioni: teacher.sommaValutazioni,
      numeroValutazioni: teacher.numeroValutazioni
    }));

    res.send(response);
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
