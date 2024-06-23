// const express = require('express');
// const bodyParser = require('body-parser');
// const mongoose = require('mongoose');
// const cors = require('cors');

// const app = express();
// const port = 3000;

// app.use(bodyParser.json());
// app.use(cors());

// const uri = "mongodb+srv://saisreesatya:saisreesatya@todo.nugairl.mongodb.net/todoapp?retryWrites=true&w=majority";

// mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// const db = mongoose.connection;
// db.on('error', console.error.bind(console, 'connection error:'));
// db.once('open', function() {
//   console.log("Connected to MongoDB via Mongoose!");

//   // User schema
//   const userSchema = new mongoose.Schema({
//     name: String,
//     email: String,
//     password: String,
//     groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }]
//   });

//   const User = mongoose.model('User', userSchema);

//   // Group schema
//   const groupSchema = new mongoose.Schema({
//     name: String,
//     members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
//     tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Todo' }]
//   });

//   const Group = mongoose.model('Group', groupSchema);

//   // Todo schema
//   const todoSchema = new mongoose.Schema({
//     task: String,
//     completed: Boolean,
//     created_at: { type: Date, default: Date.now },
//     location: String
//   });

//   const Todo = mongoose.model('Todo', todoSchema);

//   // User creation endpoint
//   app.post('/users', async (req, res) => {
//     try {
//       const { name, email, password } = req.body;
//       const user = new User({ name, email, password });
//       await user.save();
//       res.status(201).json(user);
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: 'Error creating user', error });
//     }
//   });

//   // Group creation endpoint
//   app.post('/groups', async (req, res) => {
//     try {
//       const { name, members } = req.body;
//       const group = new Group({ name, members });
//       await group.save();

//       // Add group to each member's groups array
//       await User.updateMany({ _id: { $in: members } }, { $push: { groups: group._id } });

//       res.status(201).json(group);
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: 'Error creating group', error });
//     }
//   });

//   // Add task to group
//   app.post('/groups/:groupId/tasks', async (req, res) => {
//     try {
//       const { task, location } = req.body;
//       const groupId = req.params.groupId;
//       const todo = new Todo({
//         task,
//         location,
//         completed: false
//       });
//       await todo.save();

//       const group = await Group.findById(groupId);
//       group.tasks.push(todo._id);
//       await group.save();

//       res.status(201).json(todo);
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: 'Error creating task', error });
//     }
//   });

//   // Get tasks for a group
//   app.get('/groups/:groupId/tasks', async (req, res) => {
//     try {
//       const groupId = req.params.groupId;
//       const group = await Group.findById(groupId).populate('tasks');
//       res.status(200).json(group.tasks);
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: 'Error fetching tasks', error });
//     }
//   });

//   app.listen(port, () => {
//     console.log(`Server is running on http://localhost:${port}`);
//   });
// });
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(cors());

const mongoUri = "mongodb+srv://saisreesatya:saisreesatya@todo.nugairl.mongodb.net/?retryWrites=true&w=majority&appName=todo";
const client = new MongoClient(mongoUri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("Connected to MongoDB via Mongoose!");
});

// Define Mongoose schemas and models
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }]
});

const groupSchema = new mongoose.Schema({
  name: String,
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Todo' }]
});

const User = mongoose.model('User', userSchema);
const Group = mongoose.model('Group', groupSchema);

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

    // User creation endpoint
    app.post('/users', async (req, res) => {
      try {
        const { name, email, password } = req.body;
        const user = new User({ name, email, password });
        await user.save();
        res.status(201).json(user);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating user', error });
      }
    });
 
    // Group creation endpoint
    app.post('/groups', async (req, res) => {
      try {
        const { name, members } = req.body;
        const group = new Group({ name, members });
        await group.save();

        // Add group to each member's groups array
        await User.updateMany({ _id: { $in: members } }, { $push: { groups: group._id } });

        res.status(201).json(group);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating group', error });
      }
    });

    // Add task to group
    app.post('/groups/:groupId/tasks', async (req, res) => {
      try {
        const { task, location } = req.body;
        const groupId = req.params.groupId;
        const todo = {
          task,
          location,
          completed: false,
          created_at: new Date()
        };

        const todoResult = await todosCollection.insertOne(todo);
        const newTodo = await todosCollection.findOne({ _id: todoResult.insertedId });

        const group = await Group.findById(groupId);
        group.tasks.push(newTodo._id);
        await group.save();

        res.status(201).json(newTodo);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating task', error });
      }
    });

    // Get tasks for a group
    app.get('/groups/:groupId/tasks', async (req, res) => {
      try {
        const groupId = req.params.groupId;
        const group = await Group.findById(groupId).populate('tasks');
        res.status(200).json(group.tasks);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching tasks', error });
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
