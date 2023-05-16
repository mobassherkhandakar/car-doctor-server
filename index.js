const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;

//!Midelware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ccknyay.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyJWT = (req, res, next) =>{
  // console.log('verifyJwt has hitting');
  // console.log(req.headers.authorization);
  const authorization = req.headers.authorization
  if(!authorization){
    return res.status(401).send({error: true, message: 'unauthorized accsess'})
  }
  const token = authorization.split(' ')[1]
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET ,(error, decoded)=>{
    if(error){
      return res.status(403).send({error: true, message: 'unauthorized access'})
    }
    req.decoded = decoded
    next()
  })
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const serviseCallection = client.db("carDoctor").collection("services");
    const bookingCallection = client.db("carDoctor").collection("booking");

    app.get("/services", async (req, res) => {
      const cursor = serviseCallection.find();
      const rusult = await cursor.toArray();
      res.send(rusult);
    });

    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = {
        // Include only the `title` and `imdb` fields in each returned document
        projection: { service_id: 1, price: 1, title: 1, _id: 1, img: 1 },
      };
      const result = await serviseCallection.findOne(query, options);
      res.send(result);
    });

    app.post("/booking", async (req, res) => {
      const booking = req.body;
      const result = await bookingCallection.insertOne(booking);
      res.send(result); 
    });

    //! jwt
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '10h',
      });
      res.send({token})
    });

    app.get("/booking", verifyJWT, async (req, res) => {
      const decoded = req.decoded;
      if(decoded.email !== req.query?.email){
        return res.status(401).send({error: 1, message: 'unauthorized access'})
      }
      // console.log(decoded);
      // console.log(req.headers.authorization, 'heello');
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await bookingCallection.find(query).toArray();
      res.send(result);
    });

    app.delete("/booking/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCallection.deleteOne(query);
      res.send(result);
    });

    app.patch("/booking/:id", async (req, res) => {
      const id = req.params.id;
      const bookingUpdate = req.body;
      console.log(bookingUpdate);
      const updateDoc = {
        $set: {
          stetus: bookingUpdate.stetus,
        },
      };
      const filter = { _id: new ObjectId(id) };
      const result = await bookingCallection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Car doctor portel servise is runnig.........");
});

app.listen(port, () => {
  console.log(`Car doctor server is running on ${port}`);
});
