const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const { mongoose } = require('mongoose');

mongoose.connect(process.env.DB, {
  useUnifiedTopology: true
})
  .then((i) => console.log('MongoDBConnect', i.connections[0].name))
  .catch((err) => console.log('Alarma DB not connected', err));


app.use(cors());
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});


let userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
});

let exerciseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now
  }
});

// let logSchema = new mongoose.Schema({
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//   },
//   description: {
//     type: String,
//     required: true,
//   },
//   duration: {
//     type: Number,
//     required: true,
//   },
//   date: {
//     type: Date,
//     default: Date.now
//   }
// });

let User = mongoose.model('User', userSchema);
let Exercise = mongoose.model('Exercises', exerciseSchema);
// let Log = mongoose.model('Logs', exerciseSchema);

app.route('/api/users')
  .get(async (req, res) => {

    try {
      const users = await User.find({});
      res.json(users);
    }
    catch (err) {
      res.status(500).json({ error: err });
    }
  })
  .post(async (req, res) => {
    // console.log(req.body);
    const username = req.body.username;
    // console.log(username);
    try {
      const user = new User({ username });
      // console.log(user);
      await user.save();
      res.json(user);
    }
    catch (err) {
      res.status(500).json({ error: err });
    }
  });

app.route('/api/users/:_id/exercises')
  .post(async (req, res) => {
    const { description, duration, date } = req.body;

    try {
      const userId = req.params._id;
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const exercise = new Exercise({
        userId: user._id,
        description,
        duration: parseInt(duration),
        date: date ? new Date(date) : new Date()
      });
      console.log('user', user);

      await exercise.save();

      res.json({
        _id: user._id,
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString()
      });
    }
    catch (err) {
      res.status(500).json({ error: err });
    }
  });

app.route('/api/users/:_id/logs')
  .get(async (req, res) => {
    const userId = req.params._id;
    const from = req.query.from;
    const to = req.query.to;
    const limit = req.query.limit;

    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const filter = { userId: user._id };

      if (from || to) {
        filter.date = {};
        if (from) filter.date.$gte = new Date(from);
        if (to) filter.date.$lte = new Date(to);
      }

      let query = Exercise.find(filter);

      if (limit) {
        query = query.limit(parseInt(limit));
      }

      const exercises = await query.sort({ date: -1 });

      res.json({
        _id: user._id,
        username: user.username,
        count: exercises.length,
        log: exercises.map(exercise => ({
          description: exercise.description,
          duration: exercise.duration,
          date: exercise.date.toDateString()
        }))
      });
    }
    catch (err) {
      res.status(500).json({ error: err.message });
    }
  });



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
