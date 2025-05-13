const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const app = express();
const port = process.env.PORT || 5000;

// middlewares
app.use(cors());
app.use(express.static("public"));
app.use(express.json());

app.get("/", (req, res) => {
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
    const reviewsCollection = client.db("StudentLodgeDB").collection('reviews');
    const usersCollection = client.db("StudentLodgeDB").collection('users');
    const requestedMealsCollection = client.db("StudentLodgeDB").collection('requestedMeals');
    const upcomingMealsCollection = client.db("StudentLodgeDB").collection('upcomingMeals');

    // ******************************get apis******************************
    app.get("/meals", async (req, res) => {
      const result = await mealsCollection.find().toArray();
      res.send(result);
    });

    app.get("/meals/:category", async (req, res) => {
      const categoryName = req.params.category;
      const query = { category: categoryName }
      const result = await mealsCollection.find(query).toArray();
      res.send(result);
    });

    // single meal api
    app.get("/meal/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await mealsCollection.findOne(query);
      res.send(result);
    });

    // Get all users
    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    // Get single user
    app.get("/user", async (req, res) => {
      const userEmail = req.query?.email;
      const query = { email: userEmail };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    // Get all reviews
    app.get("/reviews", async (req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.send(result);
    });

    // Get reviews based user
    app.get("/reviews", async (req, res) => {
      const email = req.query.email;
      const query = { userEmail: email };
      const result = await reviewsCollection.find(query).toArray();
      res.send(result);
    });

    // Get all requested meal
    app.get("/requested-meals", async (req, res) => {
      const result = await requestedMealsCollection.find().toArray();
      res.send(result);
      // http://localhost:5000/requested-meals
    });

    // Get a single requested meal
    app.get("/requested-meals/:email", async (req, res) => {
      const email = req.params.email;
      console.log({ email })
      const query = { user_email: email };
      const result = await requestedMealsCollection.find(query).toArray();
      res.send(result);
      // http://localhost:5000/requested-meals
    });

    // Get all upcoming meal.
    app.get("/upcoming-meals", async (req, res) => {
      const result = await upcomingMealsCollection.find().toArray();
      res.send(result);
    });


    // **************************************post apis*****************************
    app.post("/add-meal", async (req, res) => {
      const newMeal = req.body;
      const result = await mealsCollection.insertOne(newMeal);
      res.send(result);

    });

    // save users in db
    app.post("/users", async (req, res) => {
      const newUser = req.body;
      // console.log(newUser);
      const result = await usersCollection.insertOne(newUser);
      res.send(result);
    });

    // save reviews in db
    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.send(result);
    });

    // Save requestedMeals in db
    app.post("/requested-meals", async (req, res) => {
      const newRequestedMeal = req.body;
      // console.log(newRequestedMeal);
      const result = await requestedMealsCollection.insertOne(newRequestedMeal);
      res.send(result);
    });

    // Save upcoming meals
    app.post("/upcoming-meals", async (req, res) => {
      const newUpcomingMeal = req.body;
      const result = await upcomingMealsCollection.insertOne(newUpcomingMeal);
      res.send(result);
    });

    // Payment intents
    app.post("/create-payment-intent", async(req, res) => {
      const { price } = req.body;
      console.log("Payable price", price);

      const amount = parseInt(price * 100);
      console.log("Payable amount", amount);

      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ['card'],

      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });

    });

    // ********************************Put & Patch apis*************************************
    // update user role(make admin);
    app.patch("/user-make-admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin"
        }
      };

      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    // update user role(make admin);
    app.patch("/admin-make-user/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "user"
        }
      };

      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.put("/likes-count/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id)
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateLikeCount = {
        $inc: {
          likes: 1
        }
      };

      const result = await mealsCollection.updateOne(filter, updateLikeCount, options);
      res.send(result);

    });

    // update reviews count
    app.put("/reviews-count/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id)
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateLikeCount = {
        $inc: {
          reviews_count: 1
        }
      };

      const result = await mealsCollection.updateOne(filter, updateLikeCount, options);
      res.send(result);

    });

    // Update requested_meal status after clicking serve_btn
    app.patch("/requested-meal/serve/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: "delivered"
        }
      };

      const result = await requestedMealsCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // ****************************Delete apis************************

    // delete a meal
    app.delete("/meal/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await mealsCollection.deleteOne(query);
      res.send(result);
    });

    // delete a review
    app.delete("/review-delete/:id", async (req, res) => {
      const reviewId = req.params.id;
      const query = { _id: new ObjectId(reviewId) };
      const result = await reviewsCollection.deleteOne(query);
      res.send(result);
    });

    // Delete a single requested meal
    app.delete("/requested-meals/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await requestedMealsCollection.deleteOne(query);
      res.send(result);

    });

    // Delete an upcoming meals
    app.delete("/upcoming-meal/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await upcomingMealsCollection.deleteOne(query);
      res.send(result);

    });

    // *********************************The end**************************************


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.listen(port, () => {
  console.log(`StudentLodge server is running on port ${port}`);
})