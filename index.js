const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// middleWare

app.use(cors());
app.use(express.json());

// DB-START

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.2kfbqot.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
 serverApi: {
  version: ServerApiVersion.v1,
  strict: true,
  deprecationErrors: true,
 },
});

async function run() {
 try {
  // Connect the client to the server	(optional starting in v4.7)
  //   await client.connect();

  //DB - collections

  const usersCollection = client.db('allUser').collection('users');
  const surveysCollection = client.db('allSurveys').collection('surveys');
  const votersCollection = client.db('allVoters').collection('voters');

  // users

  app.post('/users', async (req, res) => {
   const user = req.body;
   const query = { email: user.email };
   const checkingUser = await usersCollection.findOne(query);
   if (checkingUser) {
    return res.send({ message: 'user already exists', insertedID: null });
   }
   const result = await usersCollection.insertOne(user);
   res.send(result);
  });

  app.get('/users', async (req, res) => {
   const result = await usersCollection.find().toArray();
   res.send(result);
  });

  app.patch('/users/:email', async (req, res) => {
   const email = req.params.email;
   const filter = { email: email };
   const data = req.body;

   const updateDoc = {
    $set: {
     role: data.role,
    },
   };
   const result = await usersCollection.updateOne(filter, updateDoc, { upsert: true });
   res.send(result);
  });

  // survey

  app.post('/surveys', async (req, res) => {
   const data = req.body;
   // Include the current timestamp in the data
   data.date = new Date();
   const result = await surveysCollection.insertOne(data);
   res.send(result);
  });

  app.get('/surveys', async (req, res) => {
   const result = await surveysCollection.find().sort({ date: -1 }).toArray();
   res.send(result);
  });

  app.get('/survey/:id', async (req, res) => {
   const id = req.params.id;
   const query = { _id: new ObjectId(id) };
   const result = await surveysCollection.findOne(query);
   res.send(result);
  });

  app.put('/survey/:id', async (req, res) => {
   const id = req.params.id;
   const filter = { _id: new ObjectId(id) };
   const data = req.body;

   const yesValue = parseInt(data.yes) || 0;
   const noValue = parseInt(data.no) || 0;
   const likeValue = parseInt(data.like) || 0;
   const disLikeValue = parseInt(data.disLike) || 0;

   const updateDoc = {
    $inc: {
     yes: data.vote === 'yes' ? 1 : 0,
     no: data.vote === 'no' ? 1 : 0,
     like: data.surveyFeedBack === 'like' ? 1 : 0,
     disLike: data.surveyFeedBack === 'disLike' ? 1 : 0,
    },
    $set: {
     title: data.title,
     descriptions: data.descriptions,
     category: data.category,
     status: data.status,
     adminFeedback: data.adminFeedback,
    },
   };
   if ((data.commentText && data.commentText.length > 0) || (data.report && data.report.length > 0)) {
    updateDoc.$push = { commentText: data.commentText, report: data.report };
   }
   const result = await surveysCollection.updateOne(filter, updateDoc, { upsert: true });
   res.send(result);
  });

  app.post('/voters', async (req, res) => {
   const data = req.body;
   const result = await votersCollection.insertOne(data);
  });

  app.get('/voters', async (req, res) => {
   const result = await votersCollection.find().toArray();
   res.send(result);
  });

  //   payment
  app.post('/create-payment-intent', async (req, res) => {
   const { price } = req.body;
   const amount = parseInt(price * 100);
   console.log(amount);
   const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: 'usd',
    payment_method_types: ['card'],
   });
   res.send({
    clientSecret: paymentIntent.client_secret,
   });
  });

  // Send a ping to confirm a successful connection
  await client.db('admin').command({ ping: 1 });
  //   they said i must delete the upper line
  //   they said i must delete
  //   they said i must delete
  //   they said i must delete
  //   they said i must delete
  //   they said i must delete
  //   they said i must delete
  //   they said i must delete
  console.log('Pinged your deployment. You successfully connected to MongoDB!');
 } finally {
  // Ensures that the client will close when you finish/error
  //   await client.close();
 }
}
run().catch(console.dir);

// DB-END

app.get('/', (req, res) => {
 res.send('Hello World!');
});

app.listen(port, () => {
 console.log(`Example app listening on port ${port}`);
});
