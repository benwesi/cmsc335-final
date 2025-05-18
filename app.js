const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Atlas connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://gradeuser:henny200@grade-calculator.gh8brry.mongodb.net/gradecalculator?retryWrites=true&w=majority&appName=grade-calculator';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Connected to MongoDB Atlas successfully');
}).catch(err => {
  console.log('❌ MongoDB connection error:', err.message);
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(session({
  secret: 'grade-calculator-secret',
  resave: false,
  saveUninitialized: true
}));

// Set EJS as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/', require('./routes/index'));
app.use('/courses', require('./routes/courses'));
app.use('/assignments', require('./routes/assignments'));

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});