/**
 * Helper to serialize Mentor remarks & student individual marks (0 to 10)
 */
const serializeMentorRemarks = (remarks, studentMarks) => {
  const cleanText = (remarks || '').replace(/---STUDENT_MARKS---[\s\S]*$/, '').trim();
  if (!studentMarks || typeof studentMarks !== 'object' || Object.keys(studentMarks).length === 0) {
    return cleanText;
  }
  return `${cleanText}\n---STUDENT_MARKS---\n${JSON.stringify(studentMarks)}`;
};

/**
 * Helper to parse MentorGrade record to extract clean remarks and student individual marks
 */
const parseMentorGradeRecord = (mentorGrade) => {
  if (!mentorGrade) return null;
  let cleanRemarks = mentorGrade.remarks || '';
  let studentMarks = {};

  if (mentorGrade.remarks && mentorGrade.remarks.includes('---STUDENT_MARKS---')) {
    const parts = mentorGrade.remarks.split('---STUDENT_MARKS---');
    cleanRemarks = parts[0].trim();
    try {
      studentMarks = JSON.parse(parts[1].trim());
    } catch (e) {
      studentMarks = {};
    }
  }

  // Calculate average of marks in studentMarks if any
  const marksValues = Object.values(studentMarks)
    .map(Number)
    .filter(v => !isNaN(v));
  const averageMarks = marksValues.length > 0
    ? parseFloat((marksValues.reduce((a, b) => a + b, 0) / marksValues.length).toFixed(2))
    : null;

  return {
    ...mentorGrade,
    cleanRemarks,
    remarks: cleanRemarks, // default remarks to clean text
    rawRemarks: mentorGrade.remarks,
    studentMarks,
    averageMarks
  };
};

/**
 * Helper to parse all mentorGrades in a submissions array or team object
 */
const attachParsedMentorGrades = (teamsOrSubmissions) => {
  if (!teamsOrSubmissions) return teamsOrSubmissions;

  if (Array.isArray(teamsOrSubmissions)) {
    return teamsOrSubmissions.map(item => {
      if (item.submissions) {
        return {
          ...item,
          submissions: item.submissions.map(sub => ({
            ...sub,
            mentorGrades: (sub.mentorGrades || []).map(parseMentorGradeRecord)
          }))
        };
      } else if (item.mentorGrades) {
        return {
          ...item,
          mentorGrades: item.mentorGrades.map(parseMentorGradeRecord)
        };
      }
      return item;
    });
  } else if (typeof teamsOrSubmissions === 'object') {
    if (teamsOrSubmissions.submissions) {
      return {
        ...teamsOrSubmissions,
        submissions: teamsOrSubmissions.submissions.map(sub => ({
          ...sub,
          mentorGrades: (sub.mentorGrades || []).map(parseMentorGradeRecord)
        }))
      };
    } else if (teamsOrSubmissions.mentorGrades) {
      return {
        ...teamsOrSubmissions,
        mentorGrades: teamsOrSubmissions.mentorGrades.map(parseMentorGradeRecord)
      };
    }
  }
  return teamsOrSubmissions;
};

module.exports = {
  serializeMentorRemarks,
  parseMentorGradeRecord,
  attachParsedMentorGrades
};
