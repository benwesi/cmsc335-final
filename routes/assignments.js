const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const Course = require('../models/Course');


function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/');
  }
  next();
}


router.get('/add/:courseId', requireAuth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    res.render('add-assignment', { course, user: req.session.user });
  } catch (error) {
    res.status(500).send('Error loading course: ' + error.message);
  }
});


router.post('/add/:courseId', requireAuth, async (req, res) => {
  try {
    const { name, type, grade, maxGrade, weight, dueDate, isCompleted } = req.body;
    const assignment = new Assignment({
      name,
      type,
      grade: grade ? parseFloat(grade) : undefined,
      maxGrade: parseFloat(maxGrade) || 100,
      weight: parseFloat(weight),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      isCompleted: isCompleted === 'on',
      courseId: req.params.courseId,
      userId: req.session.user._id
    });
    await assignment.save();
    res.redirect(`/courses/${req.params.courseId}`);
  } catch (error) {
    res.status(500).send('Error creating assignment: ' + error.message);
  }
});

router.get('/edit/:id', requireAuth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate('courseId');
    res.render('edit-assignment', { assignment, user: req.session.user });
  } catch (error) {
    res.status(500).send('Error loading assignment: ' + error.message);
  }
});


router.post('/edit/:id', requireAuth, async (req, res) => {
  try {
    const { name, type, grade, maxGrade, weight, dueDate, isCompleted } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    
    assignment.name = name;
    assignment.type = type;
    assignment.grade = grade ? parseFloat(grade) : undefined;
    assignment.maxGrade = parseFloat(maxGrade) || 100;
    assignment.weight = parseFloat(weight);
    assignment.dueDate = dueDate ? new Date(dueDate) : undefined;
    assignment.isCompleted = isCompleted === 'on';
    
    await assignment.save();
    res.redirect(`/courses/${assignment.courseId}`);
  } catch (error) {
    res.status(500).send('Error updating assignment: ' + error.message);
  }
});


router.post('/delete/:id', requireAuth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    const courseId = assignment.courseId;
    await Assignment.findByIdAndDelete(req.params.id);
    res.redirect(`/courses/${courseId}`);
  } catch (error) {
    res.status(500).send('Error deleting assignment: ' + error.message);
  }
});

router.get('/calculator/:courseId', requireAuth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    const assignments = await Assignment.find({ courseId: req.params.courseId });
    res.render('grade-calculator', { course, assignments, user: req.session.user });
  } catch (error) {
    res.status(500).send('Error loading calculator: ' + error.message);
  }
});


router.post('/calculate/:courseId', requireAuth, async (req, res) => {
  try {
    const { targetGrade, futureAssignmentWeight } = req.body;
    const assignments = await Assignment.find({ courseId: req.params.courseId });

    let currentWeightedScore = 0;
    let completedWeight = 0;
    
    for (const assignment of assignments) {
      if (assignment.isCompleted && assignment.grade !== undefined) {
        const percentage = (assignment.grade / assignment.maxGrade) * 100;
        currentWeightedScore += percentage * (assignment.weight / 100);
        completedWeight += assignment.weight / 100;
      }
    }
    
    const target = parseFloat(targetGrade);
    const futureWeight = parseFloat(futureAssignmentWeight) / 100;
    const neededScore = (target - currentWeightedScore) / futureWeight;
    
    res.json({ 
      neededGrade: neededScore.toFixed(1),
      currentGrade: completedWeight > 0 ? (currentWeightedScore / completedWeight).toFixed(1) : 0,
      isAchievable: neededScore <= 100
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;