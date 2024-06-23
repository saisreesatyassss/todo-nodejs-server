// // const express = require('express');
// // const bodyParser = require('body-parser');
// // const app = express();
// // const port = 3000;

// // app.use(bodyParser.json());

// // let todos = [];

// // // Add a new todo
// // app.post('/todos', (req, res) => {
// //   const todo = {
// //     id: todos.length + 1,
// //     task: req.body.task,
// //     completed: false
// //   };
// //   todos.push(todo);
// //   res.status(201).json(todo);
// // });

// // // Get all todos
// // app.get('/todos', (req, res) => {
// //   res.json(todos);
// // });

// // // Update a todo by id
// // app.put('/todos/:id', (req, res) => {
// //   const id = parseInt(req.params.id);
// //   const todo = todos.find(t => t.id === id);
// //   if (!todo) {
// //     return res.status(404).json({ message: 'Todo not found' });
// //   }
// //   todo.task = req.body.task !== undefined ? req.body.task : todo.task;
// //   todo.completed = req.body.completed !== undefined ? req.body.completed : todo.completed;
// //   res.json(todo);
// // });

// // // Delete a todo by id
// // app.delete('/todos/:id', (req, res) => {
// //   const id = parseInt(req.params.id);
// //   const todoIndex = todos.findIndex(t => t.id === id);
// //   if (todoIndex === -1) {
// //     return res.status(404).json({ message: 'Todo not found' });
// //   }
// //   todos.splice(todoIndex, 1);
// //   res.status(204).send();
// // });

// // app.listen(port, () => {
// //   console.log(`Server is running on http://localhost:${port}`);
// // });
// const express = require('express');
// const bodyParser = require('body-parser');
// const app = express();
// const port = 3000;

// app.use(bodyParser.json());

// let todos = [];

// // Add a new todo
// app.post('/todos', (req, res) => {
//   const todo = {
//     id: todos.length + 1,
//     task: req.body.task,
//     completed: false,
//     created_at: new Date(), // add creation date and time
//     location: req.body.location || null // optional location field
//   };
//   todos.push(todo);
//   res.status(201).json(todo);
// });

// // Get all todos
// app.get('/todos', (req, res) => {
//   res.json(todos);
// });

// // Update a todo by id
// app.put('/todos/:id', (req, res) => {
//   const id = parseInt(req.params.id);
//   const todo = todos.find(t => t.id === id);
//   if (!todo) {
//     return res.status(404).json({ message: 'Todo not found' });
//   }
//   todo.task = req.body.task !== undefined ? req.body.task : todo.task;
//   todo.completed = req.body.completed !== undefined ? req.body.completed : todo.completed;
//   todo.location = req.body.location !== undefined ? req.body.location : todo.location;
//   res.json(todo);
// });

// // Delete a todo by id
// app.delete('/todos/:id', (req, res) => {
//   const id = parseInt(req.params.id);
//   const todoIndex = todos.findIndex(t => t.id === id);
//   if (todoIndex === -1) {
//     return res.status(404).json({ message: 'Todo not found' });
//   }
//   todos.splice(todoIndex, 1);
//   res.status(204).send();
// });

// app.listen(port, () => {
//   console.log(`Server is running on http://localhost:${port}`);
// });

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(cors()); // Add this line to enable CORS

const uri = "mongodb+srv://saisreesatya:saisreesatya@todo.nugairl.mongodb.net/?retryWrites=true&w=majority&appName=todo";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let todosCollection;

async function run() {
  try {
    await client.connect();
    const database = client.db("todoapp");
    todosCollection = database.collection("todos");
    console.log("Connected to MongoDB!");

    // Add a new todo
    app.post('/todos', async (req, res) => {
      const todo = {
        task: req.body.task,
        completed: false,
        created_at: new Date(),
        location: req.body.location || null
      };
      try {
        const result = await todosCollection.insertOne(todo);
        const newTodo = await todosCollection.findOne({ _id: result.insertedId });
        res.status(201).json(newTodo);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });

    // Get all todos
    app.get('/todos', async (req, res) => {
      try {
        const todos = await todosCollection.find().toArray();
        res.json(todos);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });

    // Update a todo by id
    app.put('/todos/:id', async (req, res) => {
      const id = new ObjectId(req.params.id);
      const updateDoc = {
        $set: {
          task: req.body.task !== undefined ? req.body.task : undefined,
          completed: req.body.completed !== undefined ? req.body.completed : undefined,
          location: req.body.location !== undefined ? req.body.location : undefined,
        }
      };
      // Remove undefined fields
      Object.keys(updateDoc.$set).forEach(key => updateDoc.$set[key] === undefined && delete updateDoc.$set[key]);
      try {
        const result = await todosCollection.updateOne({ _id: id }, updateDoc);
        if (result.matchedCount === 0) {
          return res.status(404).json({ message: 'Todo not found' });
        }
        const updatedTodo = await todosCollection.findOne({ _id: id });
        res.json(updatedTodo);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });

    // Delete a todo by id
    app.delete('/todos/:id', async (req, res) => {
      const id = new ObjectId(req.params.id);
      try {
        const result = await todosCollection.deleteOne({ _id: id });
        if (result.deletedCount === 0) {
          return res.status(404).json({ message: 'Todo not found' });
        }
        res.status(204).send();
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });




  

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });

  } catch (err) {
    console.error(err);
  }
}

run().catch(console.dir);








