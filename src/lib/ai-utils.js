
// Mock AI quiz generation
export function generateMockQuiz(topic, subjectId) {
  const questions = [
    { 
      question: `What is the primary concept behind ${topic}?`, 
      options: ["Fundamentals", "Advanced theory", "Practical application", "Historical context"], 
      correctIndex: 0, 
      explanation: `The fundamentals of ${topic} form the foundation for all further study.`, 
      difficulty: "easy" 
    },
    { 
      question: `Which method is most effective for studying ${topic}?`, 
      options: ["Passive reading", "Active recall", "Highlighting", "Copying notes"], 
      correctIndex: 1, 
      explanation: "Active recall has been proven by research to be the most effective study technique.", 
      difficulty: "easy" 
    },
    { 
      question: `What distinguishes ${topic} from related fields?`, 
      options: ["Methodology", "Scope", "Both methodology and scope", "Neither"], 
      correctIndex: 2, 
      explanation: `${topic} is distinguished by both its unique methodology and broader scope of application.`, 
      difficulty: "medium" 
    },
    { 
      question: `In which scenario would ${topic} principles NOT apply?`, 
      options: ["Research contexts", "Practical applications", "Unrelated domains", "Educational settings"], 
      correctIndex: 2, 
      explanation: `${topic} principles are specific to their domain and don't directly apply to unrelated fields.`, 
      difficulty: "medium" 
    },
    { 
      question: `What is the most advanced application of ${topic}?`, 
      options: ["Basic analysis", "Cross-domain synthesis", "Simple memorization", "Surface review"], 
      correctIndex: 1, 
      explanation: "Cross-domain synthesis represents the highest level of understanding and application.", 
      difficulty: "hard" 
    },
  ];
  return { title: `AI Quiz: ${topic}`, questions };
}

// Mock AI document summary
export function generateMockSummary(title, content) {
  return `## Summary of "${title}"\n\n### Key Points:\n1. **Core Concepts** — The document covers fundamental theories and principles\n2. **Important Details** — Key formulas, definitions, and relationships are identified\n3. **Applications** — Practical use cases and real-world examples\n4. **Review Notes** — Critical points for exam preparation\n\n### Takeaways:\n- Focus on understanding core relationships\n- Practice applying concepts to new problems\n- Review highlighted formulas regularly`;
}

// Mock AI study plan generation
export function generateMockStudyPlan(subjects) {
  const sessions = [];
  
  // Sort by priority and difficulty
  const sorted = [...subjects].sort((a, b) => {
    const pMap = { high: 0, medium: 1, low: 2 };
    const pa = pMap[a.priority || "medium"];
    const pb = pMap[b.priority || "medium"];
    if (pa !== pb) return pa - pb;
    
    const dMap = { Hard: 0, Medium: 1, Easy: 2 };
    return dMap[a.difficulty] - dMap[b.difficulty];
  });

  let dayIndex = 0;
  for (const subject of sorted) {
    const hoursPerWeek = subject.requiredHoursPerWeek || subject.credits;
    const sessionsCount = Math.min(Math.ceil(hoursPerWeek / 1.5), 5);
    
    for (let i = 0; i < sessionsCount; i++) {
      const day = dayIndex % 7;
      const startHour = subject.difficulty === "Hard" ? 9 : subject.difficulty === "Medium" ? 11 : 14;
      sessions.push({
        day,
        start: startHour + (i % 2) * 3,
        duration: Math.min(hoursPerWeek / sessionsCount, 2),
        title: `${subject.name} — ${i === 0 ? "Review" : i === 1 ? "Practice" : "Deep Study"}`,
        color: subject.color,
      });
      dayIndex++;
    }
  }
  return sessions;
}

// Mock AI content moderation
const spamPatterns = [/buy\s+cheap/i, /free\s+money/i, /click\s+here/i, /limited\s+offer/i, /act\s+now/i, /!!!/];
const inappropriatePatterns = [/stupid/i, /hate/i, /idiot/i, /dumb/i];

export function moderateContent(text) {
  if (!text) return null;
  
  for (const pattern of spamPatterns) {
    if (pattern.test(text)) return { flagged: true, type: "spam", severity: "high" };
  }
  for (const pattern of inappropriatePatterns) {
    if (pattern.test(text)) return { flagged: true, type: "inappropriate", severity: "medium" };
  }
  
  // Check for very short meaningless content
  if (text.trim().length < 3 && text.trim().length > 0) {
    return { flagged: true, type: "irrelevant", severity: "low" };
  }
  
  return null;
}

// Mock AI material suggestions
export function suggestMaterials(subjectName) {
  return [
    { 
      title: `${subjectName} — Key Concepts Summary`, 
      type: "note", 
      content: `Comprehensive overview of the most important concepts in ${subjectName}. Covers fundamental theories, key formulas, and practical applications.` 
    },
    { 
      title: `${subjectName} — Practice Problems`, 
      type: "note", 
      content: `A curated set of practice problems covering all major topics in ${subjectName}. Includes solutions and explanations.` 
    },
    { 
      title: `${subjectName} — Video Lectures (Khan Academy)`, 
      type: "link", 
      content: `https://khanacademy.org/search?q=${encodeURIComponent(subjectName)}` 
    },
  ];
}