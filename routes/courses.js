const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');


function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/');
  }
  next();
}


router.get('/', requireAuth, async (req, res) => {
  try {
    const courses = await Course.find({ userId: req.session.user._id });
    res.render('courses', { courses, user: req.session.user });
  } catch (error) {
    res.status(500).send('Error loading courses: ' + error.message);
  }
});


router.get('/add', requireAuth, (req, res) => {
  res.render('add-course', { user: req.session.user });
});


router.post('/add', requireAuth, async (req, res) => {
  try {
    const { name, code, credits, semester, year } = req.body;
    const course = new Course({
      name,
      code,
      credits: parseInt(credits),
      semester,
      year: parseInt(year),
      userId: req.session.user._id
    });
    await course.save();
    res.redirect('/courses');
  } catch (error) {
    res.status(500).send('Error creating course: ' + error.message);
  }
});


router.get('/:id', requireAuth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    const assignments = await Assignment.find({ courseId: req.params.id });
    
    let totalWeightedScore = 0;
    let totalWeight = 0;
    let completedAssignments = 0;
    
    for (const assignment of assignments) {
      if (assignment.isCompleted && assignment.grade !== undefined) {
        const percentage = (assignment.grade / assignment.maxGrade) * 100;
        totalWeightedScore += percentage * (assignment.weight / 100);
        totalWeight += assignment.weight / 100;
        completedAssignments++;
      }
    }
    
    const currentGrade = totalWeight > 0 ? (totalWeightedScore / totalWeight).toFixed(1) : null;
    const remainingWeight = 100 - (assignments.reduce((sum, a) => sum + (a.isCompleted ? a.weight : 0), 0));
    
    res.render('course-detail', { 
      course, 
      assignments, 
      currentGrade,
      remainingWeight,
      user: req.session.user 
    });
  } catch (error) {
    res.status(500).send('Error loading course: ' + error.message);
  }
});

router.post('/:id/delete', requireAuth, async (req, res) => {
  try {
    await Assignment.deleteMany({ courseId: req.params.id });
    await Course.findByIdAndDelete(req.params.id);
    res.redirect('/courses');
  } catch (error) {
    res.status(500).send('Error deleting course: ' + error.message);
  }
});

module.exports = router;