
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();

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
  email: { type: String, unique: true },
  password: String,
  groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }]
});

const groupSchema = new mongoose.Schema({
  name: String,
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Todo' }]
});

// const todoSchema = new mongoose.Schema({
//   task: String,
//   location: {
//     latitude: Number,
//     longitude: Number
//   },
//   completed: Boolean,
//   created_at: { type: Date, default: Date.now },
//   user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }  // Add reference to User
// });

const todoSchema = new mongoose.Schema({
  task: { type: String, required: true },
  location: {
    latitude: Number,
    longitude: Number
  },
  completed: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  label: String,
  category: String,
  description: String,
  isLowPriority: { type: Boolean, default: true },
  selectedDate: String,
  startTime: String,
  endTime: String,
  selectedImageIndex: Number
});


const User = mongoose.model('User', userSchema);
const Group = mongoose.model('Group', groupSchema);
const Todo = mongoose.model('Todo', todoSchema);

let todosCollection;

async function run() {
  try {
    await client.connect();
    const database = client.db("todoapp");
    todosCollection = database.collection("todos");
    console.log("Connected to MongoDB!");

    // Authentication middleware
    const authenticateToken = (req, res, next) => {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (token == null) return res.sendStatus(401);

      jwt.verify(token, 'SECRET_KEY', (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
      });
    };

    // User registration endpoint
    app.post('/register', async (req, res) => {
      try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword });
        await user.save();
        res.status(201).json(user);
      } catch (error) {
        res.status(500).json({ message: 'Error creating user', error });
      }
    });

    // User login endpoint
    app.post('/login', async (req, res) => {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (user == null) return res.status(400).json({ message: 'Cannot find user' });

      try {
        if (await bcrypt.compare(password, user.password)) {
          const accessToken = jwt.sign({ id: user._id, email: user.email }, 'SECRET_KEY');
          res.json({ accessToken });
        } else {
          res.status(400).json({ message: 'Incorrect password' });
        }
      } catch (error) {
        res.status(500).json({ message: 'Error logging in', error });
      }
    });

      // app.get('/user', authenticateToken, async (req, res) => {
      //   try {
      //     const user = await User.findOne({ email: req.user.email }, 'name email'); // Only select name and email fields
      //     if (!user) {
      //       return res.status(404).json({ message: 'User not found' });
      //     }
      //     res.status(200).json(user);
      //   } catch (error) {
      //     res.status(500).json({ message: 'Error retrieving user', error });
      //   }
      // });

        app.get('/user', authenticateToken, async (req, res) => {
          const userId = req.query.id;
          
          try {
            let user;
            if (userId) {
              // Find the user by the given user ID
              user = await User.findById(userId, 'name email');
            } else {
              // Find the user by the authenticated user's email
              user = await User.findOne({ email: req.user.email }, 'name email');
            }

            if (!user) {
              return res.status(404).json({ message: 'User not found' });
            }
            
            res.status(200).json(user);
          } catch (error) {
            res.status(500).json({ message: 'Error retrieving user', error });
          }
        });
        app.get('/getalluser', authenticateToken, async (req, res) => {
          try {
            const users = await User.find({}, 'name email'); // Retrieve all users with only 'name' and 'email' fields
            
            if (!users || users.length === 0) {
              return res.status(404).json({ message: 'No users found' });
            }
            
            res.status(200).json(users);
          } catch (error) {
            res.status(500).json({ message: 'Error retrieving users', error });
          }
        });


    // // Add a new todo
    // app.post('/todos', authenticateToken, async (req, res) => {
    //   const todo = new Todo({
    //     task: req.body.task,
    //     completed: false,
    //     created_at: new Date(),
    //     location: req.body.location || null,
    //     user: req.user.id  // Associate todo with the authenticated user
    //   });
    //   try {
    //     await todo.save();
    //     res.status(201).json(todo);
    //   } catch (err) {
    //     res.status(500).json({ message: err.message });
    //   }
    // });


    app.post('/todos', authenticateToken, async (req, res) => {
  const { task, location, label, category, description, isLowPriority, selectedDate, startTime, endTime, selectedImageIndex } = req.body;
  
  const todo = new Todo({
    task,
    location: location || null,
    user: req.user.id,  // Associate todo with the authenticated user
    label: label || null,
    category: category || null,
    description: description || null,
    isLowPriority: isLowPriority !== undefined ? isLowPriority : true,
    selectedDate: selectedDate || null,
    startTime: startTime || null,
    endTime: endTime || null,
    selectedImageIndex: selectedImageIndex !== undefined ? selectedImageIndex : null
  });

  try {
    const savedTodo = await todo.save();
    res.status(201).json(savedTodo);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



    // // Get all todos for the authenticated user
    // app.get('/todos', authenticateToken, async (req, res) => {
    //   try {
    //     const todos = await Todo.find({ user: req.user.id });
    //     res.json(todos);
    //   } catch (err) {
    //     res.status(500).json({ message: err.message });
    //   }
    // });
    app.get('/todos', authenticateToken, async (req, res) => {
      const todoId = req.query.id;
      
      try {
        if (todoId) {
          // Validate the todoId as a valid ObjectId
          if (!mongoose.Types.ObjectId.isValid(todoId)) {
            console.log('Invalid todo ID:', todoId);
            return res.status(400).json({ message: 'Invalid todo ID' });
          }

          // Find the specific todo by ID
          const todo = await Todo.findById(todoId);
          if (!todo) {
            console.log('Todo not found for ID:', todoId);
            return res.status(404).json({ message: 'Todo not found' });
          }
          res.json(todo);
        } else {
          // Find all todos for the authenticated user
          const todos = await Todo.find({ user: req.user.id });
          res.json(todos);
        }
      } catch (err) {
        console.error('Error retrieving todos:', err);
        res.status(500).json({ message: 'Internal server error' });
      }
    });

    // Update a todo by id
    app.put('/todos/:id', authenticateToken, async (req, res) => {
      const id = req.params.id;
      const updateDoc = {
        $set: {
          task: req.body.task,
          completed: req.body.completed,
          location: req.body.location
        }
      };
      try {
        const result = await Todo.findOneAndUpdate({ _id: id, user: req.user.id }, updateDoc, { new: true });
        if (!result) {
          return res.status(404).json({ message: 'Todo not found' });
        }
        res.json(result);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });


    // Delete a todo by id
    app.delete('/todos/:id', authenticateToken, async (req, res) => {
      const id = req.params.id;
      try {
        const result = await Todo.findOneAndDelete({ _id: id, user: req.user.id });
        if (!result) {
          return res.status(404).json({ message: 'Todo not found' });
        }
        res.status(204).send();
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });


    // Group creation endpoint
    app.post('/groups', authenticateToken, async (req, res) => {
      try {
        const { name, members } = req.body;
        const group = new Group({ name, members });
        await group.save();

        // Add group to each member's groups array
        await User.updateMany({ _id: { $in: members } }, { $push: { groups: group._id } });

        res.status(201).json(group);
      } catch (error) {
        res.status(500).json({ message: 'Error creating group', error });
      }
    });

 

           // Define the GET endpoint to fetch groups for the authenticated user
      app.get('/groups', authenticateToken, async (req, res) => {
        try {
          const userId = req.user.id;
          const groups = await Group.find({ members: userId }).populate('members', 'name email').populate('tasks');

          if (!groups.length) {
            return res.status(404).json({ message: 'No groups found for this user' });
          }

          res.status(200).json(groups);
        } catch (error) {
          res.status(500).json({ message: 'Error fetching groups', error });
        }
      });


    // // Add task to group
    // app.post('/groups/:groupId/tasks', authenticateToken, async (req, res) => {
    //   try {
    //     const { task, location } = req.body;
    //     const groupId = req.params.groupId;
    //     const todo = new Todo({
    //       task,
    //       location,
    //       completed: false,
    //       created_at: new Date(),
    //       user: req.user.id  // Associate todo with the authenticated user
    //     });

    //     await todo.save();

    //     const group = await Group.findById(groupId);
    //     group.tasks.push(todo._id);
    //     await group.save();

    //     res.status(201).json(todo);
    //   } catch (error) {
    //     res.status(500).json({ message: 'Error creating task', error });
    //   }
    // });

app.post('/groups/:groupId/tasks', authenticateToken, async (req, res) => {
  try {
    const {
      task,
      location,
      completed,
      created_at,
      user,
      label,
      category,
      description,
      isLowPriority,
      selectedDate,
      startTime,
      endTime,
      selectedImageIndex
    } = req.body;
    const groupId = req.params.groupId;
    
    const todo = new Todo({
      task,
      location,
      completed,
      created_at,
      user: req.user.id,  // Associate todo with the authenticated user
      label,
      category,
      description,
      isLowPriority,
      selectedDate,
      startTime,
      endTime,
      selectedImageIndex
    });

    await todo.save();

    const group = await Group.findById(groupId);
    group.tasks.push(todo._id);
    await group.save();

    res.status(201).json(todo);
  } catch (error) {
    res.status(500).json({ message: 'Error creating task', error });
  }
});

    // Add a new user to an existing group
    app.post('/groups/:groupId/addUser', authenticateToken, async (req, res) => {
      try {
        const groupId = req.params.groupId;
        const { userId } = req.body;

        // Find the group by ID
        const group = await Group.findById(groupId);
        if (!group) {
          return res.status(404).json({ message: 'Group not found' });
        }

        // Check if the user is already in the group
        if (group.members.includes(userId)) {
          return res.status(400).json({ message: 'User is already a member of this group' });
        }

        // Add the user to the group's members array
        group.members.push(userId);
        await group.save();

        // Add the group to the user's groups array
        await User.findByIdAndUpdate(userId, { $push: { groups: groupId } });

        res.status(200).json(group);
      } catch (error) {
        res.status(500).json({ message: 'Error adding user to group', error });
      }
    });

    // Get tasks for a group
    app.get('/groups/:groupId/tasks', authenticateToken, async (req, res) => {
      try {
        const groupId = req.params.groupId;
        const group = await Group.findById(groupId).populate('tasks');
        res.status(200).json(group.tasks);
      } catch (error) {
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

module.exports = router;

run().catch(console.dir);
