const express    = require('express');
const router     = express.Router();
const axios      = require('axios');
const User       = require('../models/User');
const Course     = require('../models/Course');
const Assignment = require('../models/Assignment');

router.get('/', async (req, res) => {
  let quote = {
    content: 'Success is the sum of small efforts repeated day in and day out.',
    author:  'Robert Collier'
  };

  try {
    const [apiQuote] = (await axios.get('https://zenquotes.io/api/random')).data;
    quote = { content: apiQuote.q, author: apiQuote.a };
  } catch (error) {
    console.error('zenquotes:', error.response?.status, error.message);
  }

  res.render('index', { quote, user: req.session.user });
});

router.post('/login', async (req, res) => {
  const { name, email } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ name, email });
      await user.save();
    }
    req.session.user = user;
    res.redirect('/dashboard');
  } catch (error) {
    res.status(500).send('Error logging in: ' + error.message);
  }
});

router.get('/dashboard', async (req, res) => {
  if (!req.session.user) return res.redirect('/');
  try {
    const courses = await Course.find({ userId: req.session.user._id });
    const assignments = await Assignment.find({ userId: req.session.user._id }).populate('courseId');
    let totalPoints = 0;
    let totalCredits = 0;
    for (const course of courses) {
      const courseAssignments = assignments.filter(
        a => a.courseId._id.toString() === course._id.toString()
      );
      const courseGrade = calculateCourseGrade(courseAssignments);
      if (courseGrade !== null) {
        totalPoints += gradeToGPA(courseGrade) * course.credits;
        totalCredits += course.credits;
      }
    }
    const overallGPA = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;
    res.render('dashboard', {
      user: req.session.user,
      courses,
      assignments: assignments.slice(0, 5),
      overallGPA
    });
  } catch (error) {
    res.status(500).send('Error loading dashboard: ' + error.message);
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

function calculateCourseGrade(assignments) {
  if (assignments.length === 0) return null;
  let totalWeightedScore = 0;
  let totalWeight = 0;
  for (const assignment of assignments) {
    if (assignment.isCompleted && assignment.grade !== undefined) {
      const percentage = (assignment.grade / assignment.maxGrade) * 100;
      totalWeightedScore += percentage * (assignment.weight / 100);
      totalWeight += assignment.weight / 100;
    }
  }
  return totalWeight > 0 ? totalWeightedScore / totalWeight : null;
}

function gradeToGPA(grade) {
  if (grade >= 97) return 4.0;
  if (grade >= 93) return 3.7;
  if (grade >= 90) return 3.3;
  if (grade >= 87) return 3.0;
  if (grade >= 83) return 2.7;
  if (grade >= 80) return 2.3;
  if (grade >= 77) return 2.0;
  if (grade >= 73) return 1.7;
  if (grade >= 70) return 1.3;
  if (grade >= 67) return 1.0;
  if (grade >= 65) return 0.7;
  return 0.0;
}

module.exports = router;
