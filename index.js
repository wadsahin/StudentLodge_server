const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// middlewares
app.use(cors());
app.use(express.json());

app.get("/", (req, res) =>{
    res.send("StudentLodge server is running...");
});


const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.USER_PASS}@cluster0.l0f7v.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const mealsCollection = client.db("StudentLodgeDB").collection('meals');
    const usersCollection = client.db("StudentLodgeDB").collection('users');

    // get apis
    app.get("/meals", async(req, res) =>{
        const result = await mealsCollection.find().toArray();
        res.send(result);
    });

    app.get("/meals/:category", async(req, res) =>{
        const categoryName = req.params.category;
        const query = {category: categoryName}
        const result = await mealsCollection.find(query).toArray();
        res.send(result);
    });

    // single meal api
    app.get("/meal/:id", async(req, res) =>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await mealsCollection.findOne(query);
      res.send(result);
    });

    app.get("/users", async(req, res) =>{
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    // post apis
    app.post("/add-meal", async(req, res) =>{
        const newMeal = req.body;
        const result = await mealsCollection.insertOne(newMeal);
        res.send(result);

    });

    // save users in db
    app.post("/users", async(req, res) =>{
      const newUser = req.body;
      console.log(newUser);
      const result = await usersCollection.insertOne(newUser);
      res.send(result);
    });

    // Put & Patch apis
    app.put("/like-count/:id", async(req, res) =>{
      const id = req.params.id;
      console.log(id)
      const filter = {_id: new ObjectId(id)};
      const options = {upsert: true};
      const updateLikeCount = {
        $inc: {
          like: 1
        }
      };

      const result = await mealsCollection.updateOne(filter, updateLikeCount, options);
      res.send(result);

    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.listen(port, () =>{
    console.log(`StudentLodge server is running on port ${port}`);
})