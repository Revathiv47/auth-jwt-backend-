const express = require("express");
const app = express();
const cors = require('cors');
const mongodb = require("mongodb");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoClient = mongodb.MongoClient;
const dotenv = require("dotenv")
dotenv.config();
//const url="mongodb+srv://admin:Riya4798@jwt.osp3y.mongodb.net/jwt?retryWrites=true&w=majority"
const url = process.env.DB;
const PORT = process.env.PORT || 5000;
app.use(cors({
    origin: "*"
}))

app.use(express.json());

function authenticate(req, res, next) {
    try {
    // Check if the token is present
    // if present -> check if it is valid
    if(req.headers.authorization){
        jwt.verify(req.headers.authorization,process.env.JWT_SECRET,function(error,decoded){
            if(error){
                res.status(500).json({
                    message: "Unauthorized"
                })
            }else{
                console.log(decoded)
                req.userid = decoded.id;
            next()
            }
            
        });
      
    }else{
        res.status(401).json({
            message: "No Token Present"
        })
    }
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "Internal Server Error"
        })
    }
    
}

// let tasks = []

app.post("/register", async function (req, res) {
    try {
        // Connect the Database
        let client = await mongoClient.connect(url)

        // Select the DB
        let db = client.db("todo_app");

        // Hash the password
        let salt = bcryptjs.genSaltSync(10);
        let hash = bcryptjs.hashSync(req.body.password, salt)
        req.body.password = hash;

        // Select the Collection and perform the action
        let data = await db.collection("users").insertOne(req.body)

        // Close the Connection
        await client.close();

        res.json({
            message: "User Registered",
            id: data._id
        })
    } catch (error) {

    }
})


app.post("/login", async function (req, res) {
    try {
        // Connect the Database
        let client = await mongoClient.connect(url)

        // Select the DB
        let db = client.db("todo_app");

        // Find the user with email_id
        let user = await db.collection("users").findOne({ username: req.body.username });

        if (user) {
            // Hash the incoming password
            // Compare that password with user's password
            console.log(req.body)
            console.log(user.password)
            let matchPassword = bcryptjs.compareSync(req.body.password, user.password)
            if (matchPassword) {
                // Generate JWT token
                let token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
                res.json({
                    message: true,
                    token
                })
            } else {
                res.status(404).json({
                    message: "Username/Password is incorrect"
                })
            }
            // if both are correct then allow them
        } else {
            res.status(404).json({
                message: "Username/Password is incorrect"
            })
        }





    } catch (error) {
        console.log(error)
    }
})

app.get("/list-all-todo",[authenticate], async function (req, res) {
    try {
        // Connect the Database
        let client = await mongoClient.connect(url)

        // Select the DB
        let db = client.db("todo_app");

        // Select the collection and perform action
        let data = await db.collection("tasks").find({userid : req.userid}).toArray();

        // Close the Connection
        client.close();

        res.json(data)
    } catch (error) {
        res.status(500).json({
            message: "Something went wrong"
        })
    }
})

app.post("/create-task",[authenticate], async function (req, res) {
    try {
        // Connect the Database
        let client = await mongoClient.connect(url)

        // Select the DB
        let db = client.db("todo_app")

        // Select the Collection and perform the action
        req.body.userid = req.userid;
        console.log(req.body)
        let data = await db.collection("tasks").insertOne(req.body)

        // Close the Connection
        await client.close();

        res.json({
            message: "Task Created"
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "Something went wrong"
        })
    }

})

app.put("/update-task/:id",[authenticate], async function (req, res) {
    try {
        // Connect the Database
        let client = await mongoClient.connect(url)

        // Select the DB
        let db = client.db("todo_app")

        // Select the Collection and perform the action
        let data = await db.collection("tasks")
            .findOneAndUpdate({ _id: mongodb.ObjectId(req.params.id) }, { $set: req.body })

        // Close the Connection
        await client.close();

        res.json({
            message: "Task Updated"
        })
    } catch (error) {
        res.status(500).json({
            message: "Something Went Wrong"
        })
    }
})

app.delete("/delete-task/:id",[authenticate], async function (req, res) {
    try {
        // Connect the Database
        let client = await mongoClient.connect(url)

        // Select the DB
        let db = client.db("todo_app")

        // Select the Collection and perform the action
        let data = await db.collection("tasks")
            .findOneAndDelete({ _id: mongodb.ObjectId(req.params.id) })

        // Close the Connection
        await client.close();

        res.json({
            message: "Task Deleted"
        })
    } catch (error) {
        res.status(500).json({
            message: "Something Went Wrong"
        })
    }
})

app.get("/dashboard", [authenticate], async (req, res) => {
    res.json({
        message: "Protected Data"
    })
})

app.listen(PORT, function () {
    console.log(`The app is listening in port ${PORT}`)
})