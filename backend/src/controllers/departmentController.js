const prisma = require('../config/db');

// @desc    Get all Departments
// @route   GET /api/departments
// @access  Private (SuperAdmin, CTO, Developer)
const getDepartments = async (req, res, next) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(departments);
  } catch (error) {
    next(error);
  }
};

module.exports = { getDepartments };
