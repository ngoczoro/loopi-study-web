// Mock AI quiz generation
export function generateMockQuiz(topic, subjectId) {
  const questions = [
    {
      question: `What is the primary concept behind ${topic}?`,
      options: [
        "Fundamentals",
        "Advanced theory",
        "Practical application",
        "Historical context",
      ],
      correctIndex: 0,
      explanation: `The fundamentals of ${topic} form the foundation for all further study.`,
      difficulty: "easy",
    },
    {
      question: `Which method is most effective for studying ${topic}?`,
      options: [
        "Passive reading",
        "Active recall",
        "Highlighting",
        "Copying notes",
      ],
      correctIndex: 1,
      explanation:
        "Active recall has been proven by research to be the most effective study technique.",
      difficulty: "easy",
    },
    {
      question: `What distinguishes ${topic} from related fields?`,
      options: [
        "Methodology",
        "Scope",
        "Both methodology and scope",
        "Neither",
      ],
      correctIndex: 2,
      explanation: `${topic} is distinguished by both its unique methodology and broader scope of application.`,
      difficulty: "medium",
    },
    {
      question: `In which scenario would ${topic} principles NOT apply?`,
      options: [
        "Research contexts",
        "Practical applications",
        "Unrelated domains",
        "Educational settings",
      ],
      correctIndex: 2,
      explanation: `${topic} principles are specific to their domain and don't directly apply to unrelated fields.`,
      difficulty: "medium",
    },
    {
      question: `What is the most advanced application of ${topic}?`,
      options: [
        "Basic analysis",
        "Cross-domain synthesis",
        "Simple memorization",
        "Surface review",
      ],
      correctIndex: 1,
      explanation:
        "Cross-domain synthesis represents the highest level of understanding and application.",
      difficulty: "hard",
    },
  ];

  return { title: `AI Quiz: ${topic}`, questions };
}

// Mock AI document summary
export function generateMockSummary(title, content) {
  return `## Summary of "${title}"

### Key Points:
1. **Core Concepts** — The document covers fundamental theories and principles
2. **Important Details** — Key formulas, definitions, and relationships are identified
3. **Applications** — Practical use cases and real-world examples
4. **Review Notes** — Critical points for exam preparation

### Takeaways:
- Focus on understanding core relationships
- Practice applying concepts to new problems
- Review highlighted formulas regularly`;
}

// Mock AI content moderation
const spamPatterns = [
  /buy\s+cheap/i,
  /free\s+money/i,
  /click\s+here/i,
  /limited\s+offer/i,
  /act\s+now/i,
  /!!!/,
];

const inappropriatePatterns = [/stupid/i, /hate/i, /idiot/i, /dumb/i];

export function moderateContent(text) {
  if (!text) return null;

  for (const pattern of spamPatterns) {
    if (pattern.test(text))
      return { flagged: true, type: "spam", severity: "high" };
  }

  for (const pattern of inappropriatePatterns) {
    if (pattern.test(text))
      return {
        flagged: true,
        type: "inappropriate",
        severity: "medium",
      };
  }

  if (text.trim().length < 3 && text.trim().length > 0) {
    return {
      flagged: true,
      type: "irrelevant",
      severity: "low",
    };
  }

  return null;
}

// Mock AI material suggestions
export function suggestMaterials(subjectName) {
  return [
    {
      title: `${subjectName} — Key Concepts Summary`,
      type: "note",
      content: `Comprehensive overview of ${subjectName}`,
    },
    {
      title: `${subjectName} — Practice Problems`,
      type: "note",
      content: `Practice set for ${subjectName}`,
    },
    {
      title: `${subjectName} — Video Lectures`,
      type: "link",
      content: `https://khanacademy.org/search?q=${encodeURIComponent(
        subjectName,
      )}`,
    },
  ];
}
