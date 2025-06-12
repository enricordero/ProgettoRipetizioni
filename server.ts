import http from 'http';
import fs from 'fs';
import express, { NextFunction, Request, Response } from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import cors, { CorsOptions } from 'cors';
import nodeMailer from 'nodemailer';

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
