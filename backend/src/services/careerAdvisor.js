export const analyzeCV = (cvText) => {
  // Extract key information from CV text
  const analysis = {
    skills: extractSkills(cvText),
    experience: extractExperience(cvText),
    education: extractEducation(cvText),
    currentRole: detectCurrentRole(cvText),
    seniority: detectSeniority(cvText)
  };

  return analysis;
};

const extractSkills = (text) => {
  const commonSkills = [
    'JavaScript', 'Python', 'Java', 'C++', 'React', 'Angular', 'Vue',
    'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot',
    'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes',
    'Git', 'CI/CD', 'Agile', 'Scrum',
    'Machine Learning', 'Data Science', 'AI', 'Deep Learning',
    'HTML', 'CSS', 'TypeScript', 'GraphQL', 'REST API'
  ];

  const foundSkills = [];
  const textLower = text.toLowerCase();
  
  commonSkills.forEach(skill => {
    if (textLower.includes(skill.toLowerCase())) {
      foundSkills.push(skill);
    }
  });

  return foundSkills;
};

const extractExperience = (text) => {
  const yearPattern = /\b(20\d{2}|19\d{2})\b/g;
  const years = text.match(yearPattern) || [];
  
  // Simple heuristic: count unique years mentioned
  const uniqueYears = [...new Set(years)];
  
  // Look for experience keywords
  const experienceKeywords = ['years', 'year of experience', 'yrs', 'experience'];
  let experienceYearMatch = null;
  
  for (const keyword of experienceKeywords) {
    const pattern = new RegExp(`(\\d+\\.?\\d*)\\s*${keyword}`, 'i');
    const match = text.match(pattern);
    if (match) {
      experienceYearMatch = parseFloat(match[1]);
      break;
    }
  }

  return {
    yearsFromDates: uniqueYears.length > 1 ? 
      Math.max(...uniqueYears.map(y => parseInt(y))) - Math.min(...uniqueYears.map(y => parseInt(y))) : 0,
    explicitYears: experienceYearMatch,
    estimatedYears: experienceYearMatch || (uniqueYears.length > 1 ? 
      Math.max(...uniqueYears.map(y => parseInt(y))) - Math.min(...uniqueYears.map(y => parseInt(y))) : 0)
  };
};

const extractEducation = (text) => {
  const educationKeywords = [
    'Bachelor', 'Master', 'PhD', 'Doctorate', 'MBA',
    'B.S.', 'M.S.', 'B.A.', 'M.A.', 'B.Sc', 'M.Sc',
    'University', 'College', 'Institute'
  ];

  const degreePatterns = [
    /(?:Bachelor|B\.?S\.?|B\.?A\.?) (?:of )?(?:Science|Arts|Engineering)/gi,
    /(?:Master|M\.?S\.?|M\.?A\.?) (?:of )?(?:Science|Arts|Business Administration)/gi,
    /(?:PhD|Ph\.?D\.?|Doctorate)/gi,
    /(?:MBA|M\.?B\.?A\.?)/gi
  ];

  const degrees = [];
  degreePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      degrees.push(...matches);
    }
  });

  const hasEducation = educationKeywords.some(keyword => 
    text.toLowerCase().includes(keyword.toLowerCase())
  );

  return {
    degrees: [...new Set(degrees)],
    hasEducation: hasEducation
  };
};

const detectCurrentRole = (text) => {
  const roleKeywords = [
    'Software Engineer', 'Developer', 'Programmer',
    'Data Scientist', 'Data Analyst', 'Machine Learning Engineer',
    'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
    'DevOps Engineer', 'Cloud Engineer', 'Site Reliability Engineer',
    'Product Manager', 'Project Manager', 'Scrum Master',
    'UX Designer', 'UI Designer', 'Designer',
    'Architect', 'Tech Lead', 'Engineering Manager',
    'Consultant', 'Analyst', 'Researcher'
  ];

  for (const role of roleKeywords) {
    if (text.toLowerCase().includes(role.toLowerCase())) {
      return role;
    }
  }

  return 'Not specified';
};

const detectSeniority = (text) => {
  const seniorityLevels = [
    { level: 'Entry Level', keywords: ['junior', 'entry', 'associate', 'intern'] },
    { level: 'Mid Level', keywords: ['mid', 'middle', 'regular'] },
    { level: 'Senior', keywords: ['senior', 'sr\.?', 'lead'] },
    { level: 'Staff/Principal', keywords: ['staff', 'principal', 'distinguished'] },
    { level: 'Management', keywords: ['manager', 'director', 'vp', 'vice president', 'head of', 'cto', 'ceo'] }
  ];

  const textLower = text.toLowerCase();
  
  for (const { level, keywords } of seniorityLevels) {
    for (const keyword of keywords) {
      const pattern = new RegExp(`\\b${keyword}\\b`, 'i');
      if (pattern.test(textLower)) {
        return level;
      }
    }
  }

  return 'Not specified';
};

export const generateCareerSuggestions = (analysis) => {
  const suggestions = {
    careerPaths: [],
    developmentPoints: [],
    recommendedSkills: []
  };

  const { skills, experience, currentRole, seniority } = analysis;
  const yearsOfExperience = experience.explicitYears || experience.estimatedYears;

  // Career path suggestions based on current role and experience
  if (currentRole.includes('Developer') || currentRole.includes('Engineer')) {
    if (yearsOfExperience < 3) {
      suggestions.careerPaths.push('Senior Software Engineer');
      suggestions.careerPaths.push('Tech Lead');
      suggestions.developmentPoints.push('Master system design principles');
      suggestions.developmentPoints.push('Improve code review skills');
      suggestions.developmentPoints.push('Learn mentoring techniques');
    } else if (yearsOfExperience < 7) {
      suggestions.careerPaths.push('Staff Engineer');
      suggestions.careerPaths.push('Engineering Manager');
      suggestions.careerPaths.push('Architect');
      suggestions.developmentPoints.push('Develop leadership skills');
      suggestions.developmentPoints.push('Gain cross-team collaboration experience');
      suggestions.developmentPoints.push('Study distributed systems');
    } else {
      suggestions.careerPaths.push('Principal Engineer');
      suggestions.careerPaths.push('Director of Engineering');
      suggestions.careerPaths.push('VP of Engineering');
      suggestions.careerPaths.push('CTO');
      suggestions.developmentPoints.push('Strategic thinking and planning');
      suggestions.developmentPoints.push('Organizational leadership');
      suggestions.developmentPoints.push('Business acumen');
    }
  }

  if (currentRole.includes('Data')) {
    suggestions.careerPaths.push('Senior Data Scientist');
    suggestions.careerPaths.push('ML Engineer');
    suggestions.careerPaths.push('Data Engineering Lead');
    suggestions.developmentPoints.push('Advanced machine learning algorithms');
    suggestions.developmentPoints.push('Big data technologies (Spark, Hadoop)');
    suggestions.developmentPoints.push('MLOps and model deployment');
  }

  // Skill recommendations based on gaps
  const essentialSkills = ['JavaScript', 'Python', 'Git', 'Docker', 'AWS'];
  const missingEssential = essentialSkills.filter(s => !skills.includes(s));
  
  if (missingEssential.length > 0) {
    suggestions.recommendedSkills.push(...missingEssential);
    suggestions.developmentPoints.push(`Learn ${missingEssential.join(', ')}`);
  }

  // Add emerging tech recommendations
  const emergingTech = ['AI/ML', 'Cloud Native', 'Kubernetes', 'GraphQL', 'TypeScript'];
  const missingEmerging = emergingTech.filter(tech => 
    !skills.some(s => s.toLowerCase().includes(tech.toLowerCase()))
  );
  
  if (missingEmerging.length > 0) {
    suggestions.recommendedSkills.push(...missingEmerging.slice(0, 3));
    suggestions.developmentPoints.push(`Explore ${missingEmerging.slice(0, 2).join(' and ')}`);
  }

  // Remove duplicates
  suggestions.developmentPoints = [...new Set(suggestions.developmentPoints)];
  suggestions.recommendedSkills = [...new Set(suggestions.recommendedSkills)];

  return suggestions;
};
