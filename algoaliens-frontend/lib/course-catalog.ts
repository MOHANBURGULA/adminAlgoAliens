import type { Course, CourseModule } from "@/lib/learning"

export type CourseInstructor = {
  bio: string
  experience: string
  initials: string
  name: string
  studentsTaught: string
  title: string
}

export type CourseReview = {
  id: string
  name: string
  quote: string
  role: string
}

export type CourseCatalogMetadata = {
  audience: string[]
  category: string
  description: string
  durationLabel: string
  instructor: CourseInstructor
  learningOutcomes: string[]
  rating: number
  requirements: string[]
  reviewCount: number
  reviews: CourseReview[]
  shortDescription: string
  students: number
  subtitle: string
}

export type CourseLessonPreview = {
  durationLabel: string
  id: string
  isLocked: boolean
  isPreview: boolean
  title: string
}

export type CourseModulePreview = {
  id: number
  isLocked: boolean
  lessonCount: number
  lessons: CourseLessonPreview[]
  summary: string
  title: string
  totalDurationLabel: string
}

const COURSE_METADATA: Record<number, CourseCatalogMetadata> = {
  1: {
    audience: [
      "Students preparing for coding interviews",
      "Developers building stronger problem-solving instincts",
      "Learners who want structured DSA practice",
    ],
    category: "Algorithms",
    description:
      "Master the core patterns behind arrays, linked lists, stacks, queues, trees, and problem decomposition through guided walkthroughs, coding drills, and final evaluations.",
    durationLabel: "32 hours",
    instructor: {
      bio: "Aditi leads AlgoAliens' interview-prep curriculum and has coached thousands of learners through live coding loops and placement preparation.",
      experience: "9+ years in DSA coaching and backend engineering",
      initials: "AR",
      name: "Aditi Raman",
      studentsTaught: "18,000+ students taught",
      title: "Lead Problem Solving Mentor",
    },
    learningOutcomes: [
      "Build strong intuition for arrays, stacks, queues, and trees",
      "Solve interview-style coding questions with repeatable patterns",
      "Write cleaner solutions with better time and space complexity",
      "Practice debugging and test-case reasoning",
      "Improve confidence in whiteboard and online assessment settings",
      "Translate brute-force ideas into optimized implementations",
    ],
    rating: 4.8,
    requirements: [
      "Basic programming familiarity in any language",
      "A laptop with internet access",
      "Willingness to practice coding regularly",
    ],
    reviewCount: 1284,
    reviews: [
      {
        id: "dsa-review-1",
        name: "Nikhil S.",
        quote:
          "The pattern-first structure helped me stop memorizing answers and start understanding why each solution works.",
        role: "Final-year CSE student",
      },
      {
        id: "dsa-review-2",
        name: "Ananya P.",
        quote:
          "I used the course before placements and finally felt comfortable explaining trade-offs out loud.",
        role: "Placement candidate",
      },
      {
        id: "dsa-review-3",
        name: "Rahul M.",
        quote:
          "The progression from basics to challenge sets feels professional and much more focused than random YouTube prep.",
        role: "Backend developer",
      },
    ],
    shortDescription: "Interview-focused DSA fundamentals with structured problem-solving practice.",
    students: 18420,
    subtitle: "A high-impact roadmap for mastering coding patterns and technical interviews.",
  },
  2: {
    audience: [
      "Beginners learning SQL for the first time",
      "Students preparing for data and analyst interviews",
      "Backend developers who want stronger database query skills",
    ],
    category: "Databases",
    description:
      "Learn SQL from the ground up with practical query writing, joins, aggregations, indexing fundamentals, and optimization habits for real-world database work.",
    durationLabel: "24 hours",
    instructor: {
      bio: "Karan designs data-focused learning paths at AlgoAliens with a strong emphasis on readable query design and production troubleshooting.",
      experience: "8+ years in data systems and analytics engineering",
      initials: "KG",
      name: "Karan Gupta",
      studentsTaught: "14,000+ students taught",
      title: "Data Systems Instructor",
    },
    learningOutcomes: [
      "Write clean SELECT, WHERE, GROUP BY, and ORDER BY queries",
      "Understand joins and when to use each join strategy",
      "Use aggregations to answer business and product questions",
      "Debug slow or incorrect queries with confidence",
      "Learn indexing basics and performance trade-offs",
      "Practice SQL challenges that mirror screening rounds",
    ],
    rating: 4.7,
    requirements: [
      "No previous database experience required",
      "Comfort using a laptop and browser-based editor",
      "Interest in data querying and backend fundamentals",
    ],
    reviewCount: 932,
    reviews: [
      {
        id: "sql-review-1",
        name: "Priya R.",
        quote: "I finally understand joins beyond memorized syntax. The examples feel grounded in real work.",
        role: "Aspiring data analyst",
      },
      {
        id: "sql-review-2",
        name: "Irfan A.",
        quote: "The debugging and optimization angle made this much more useful than a basic SQL crash course.",
        role: "Junior software engineer",
      },
    ],
    shortDescription: "Hands-on SQL query writing, debugging, and optimization for modern workflows.",
    students: 12610,
    subtitle: "Build confidence in SQL by practicing the queries teams actually rely on.",
  },
  3: {
    audience: [
      "Learners preparing for systems interviews",
      "Students who want stronger networking fundamentals",
      "Engineers working closer to distributed systems",
    ],
    category: "Systems",
    description:
      "Explore networking concepts like TCP/IP, DNS, routing, and security through structured modules that connect protocol theory with practical troubleshooting scenarios.",
    durationLabel: "28 hours",
    instructor: {
      bio: "Sana brings together academic clarity and real infrastructure experience to make networking topics easier to reason about under pressure.",
      experience: "10+ years in network engineering and systems education",
      initials: "SK",
      name: "Sana Khanna",
      studentsTaught: "9,500+ students taught",
      title: "Systems & Networking Mentor",
    },
    learningOutcomes: [
      "Explain the full journey of a request across the network stack",
      "Understand DNS resolution and routing decisions clearly",
      "Reason about reliability, latency, and packet flow",
      "Connect protocol theory to interview and troubleshooting questions",
      "Practice system-level thinking with scenario-based tasks",
      "Build confidence discussing network security fundamentals",
    ],
    rating: 4.6,
    requirements: [
      "Basic programming or CS exposure is helpful",
      "Curiosity about how internet systems work",
      "Willingness to work through layered concepts step by step",
    ],
    reviewCount: 604,
    reviews: [
      {
        id: "net-review-1",
        name: "Deepak V.",
        quote: "This course made networking finally click for me. The explanations are layered and practical.",
        role: "Engineering student",
      },
      {
        id: "net-review-2",
        name: "Melissa J.",
        quote: "I appreciated how the content connected theory to real debugging situations instead of staying abstract.",
        role: "SRE intern",
      },
    ],
    shortDescription: "Protocol fundamentals and systems thinking for network-heavy interviews.",
    students: 7450,
    subtitle: "Decode modern networking concepts with less confusion and more practical clarity.",
  },
  4: {
    audience: [
      "Students studying operating systems",
      "Placement candidates revising OS concepts",
      "Developers who want stronger systems fundamentals",
    ],
    category: "Systems",
    description:
      "Understand processes, threads, memory, scheduling, and file systems with concise explanations and checkpoints that reinforce concepts commonly asked in interviews.",
    durationLabel: "26 hours",
    instructor: {
      bio: "Meera focuses on translating dense systems concepts into approachable lessons that still respect technical depth.",
      experience: "7+ years teaching systems programming and CS fundamentals",
      initials: "MN",
      name: "Meera Nair",
      studentsTaught: "11,000+ students taught",
      title: "Operating Systems Instructor",
    },
    learningOutcomes: [
      "Explain processes, threads, and CPU scheduling clearly",
      "Understand memory management strategies and trade-offs",
      "Discuss synchronization and concurrency with confidence",
      "Connect file systems and storage abstractions to real systems",
      "Revise placement-oriented OS questions efficiently",
      "Strengthen your system-design interview foundation",
    ],
    rating: 4.7,
    requirements: [
      "Basic CS terminology familiarity helps",
      "A laptop and note-taking setup",
      "Interest in systems thinking and internals",
    ],
    reviewCount: 718,
    reviews: [
      {
        id: "os-review-1",
        name: "Harsha K.",
        quote: "This felt like the revision guide I wish I had before university exams and placements.",
        role: "CS undergraduate",
      },
      {
        id: "os-review-2",
        name: "Ritika D.",
        quote: "The structure is clean and the pacing is perfect for tricky OS topics.",
        role: "Placement prep learner",
      },
    ],
    shortDescription: "Clear, interview-ready operating systems revision with applied explanations.",
    students: 9860,
    subtitle: "Build a sharper understanding of processes, memory, concurrency, and storage.",
  },
  5: {
    audience: [
      "Beginners starting with Java",
      "Students preparing for OOP and backend coursework",
      "Developers moving into JVM-based projects",
    ],
    category: "Programming",
    description:
      "Start with Java fundamentals and move into OOP, collections, threads, streams, and Spring-oriented thinking through focused lessons and practical checkpoint exercises.",
    durationLabel: "30 hours",
    instructor: {
      bio: "Rohan teaches Java with a strong balance of syntax, architecture, and problem-solving so learners can progress from basics to backend-ready confidence.",
      experience: "9+ years in Java backend development",
      initials: "RS",
      name: "Rohan Sharma",
      studentsTaught: "13,500+ students taught",
      title: "Java & Backend Mentor",
    },
    learningOutcomes: [
      "Understand Java syntax and object-oriented programming deeply",
      "Work confidently with collections and streams",
      "Reason about exceptions, concurrency, and clean structure",
      "Practice Java problem-solving with guided labs",
      "Prepare for backend and placement interviews",
      "Build a strong foundation for Spring and enterprise projects",
    ],
    rating: 4.8,
    requirements: [
      "No prior Java experience required",
      "Basic comfort with any programming language helps",
      "Laptop with internet and coding editor access",
    ],
    reviewCount: 1106,
    reviews: [
      {
        id: "java-review-1",
        name: "Shruti T.",
        quote: "The instructor explains Java in a way that makes both the language and the ecosystem feel less intimidating.",
        role: "Aspiring backend developer",
      },
      {
        id: "java-review-2",
        name: "Kishore L.",
        quote: "I liked that the course balances fundamentals with what companies actually expect from Java beginners.",
        role: "Recent graduate",
      },
    ],
    shortDescription: "Beginner-friendly Java pathway with OOP, collections, streams, and backend prep.",
    students: 15870,
    subtitle: "Go from Java basics to backend confidence with guided, career-focused practice.",
  },
}

function titleFallback(course: Pick<Course, "difficulty" | "id" | "title">): CourseCatalogMetadata {
  return {
    audience: [
      "Learners building stronger technical foundations",
      "Students preparing for structured assessments",
      "Developers expanding practical problem-solving skills",
    ],
    category: "Core Engineering",
    description:
      "A structured learning experience that combines guided explanations, checkpoints, and hands-on practice so learners can build confidence with real technical concepts.",
    durationLabel: "20 hours",
    instructor: {
      bio: "The AlgoAliens mentor team designs every pathway around real outcomes, clear explanations, and confidence-building practice.",
      experience: "Industry-led instruction",
      initials: "AA",
      name: "AlgoAliens Mentor Team",
      studentsTaught: "20,000+ students taught",
      title: "Platform Instructor Team",
    },
    learningOutcomes: [
      "Understand the core concepts behind the course topic",
      "Practice with structured lessons and checkpoints",
      "Strengthen your confidence through guided labs",
      "Improve interview and assessment readiness",
      "Build consistent study momentum",
      "Connect theory with hands-on execution",
    ],
    rating: 4.7,
    requirements: [
      "Laptop with internet connection",
      "Curiosity and willingness to practice",
      "No advanced prior experience required",
    ],
    reviewCount: 500,
    reviews: [
      {
        id: `course-${course.id}-review-1`,
        name: "AlgoAliens learner",
        quote: "The lessons are organized and practical, which makes it easier to stay consistent.",
        role: "Platform student",
      },
    ],
    shortDescription: `${course.title} with guided practice, checkpoints, and outcome-focused lessons.`,
    students: 5000,
    subtitle: `Build confidence in ${course.title.toLowerCase()} with a structured learning path.`,
  }
}

export function getCourseCatalogMetadata(course: Pick<Course, "difficulty" | "id" | "title">) {
  return COURSE_METADATA[course.id] || titleFallback(course)
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value)
}

export function buildCourseModulePreview(
  modules: CourseModule[],
  isEnrolled: boolean,
): CourseModulePreview[] {
  return modules.map((module, moduleIndex) => {
    const lessonDurations = [14 + moduleIndex * 2, 18 + moduleIndex * 2, 22 + moduleIndex * 2]
    const moduleUnlocked = isEnrolled || moduleIndex === 0
    const lessons = [
      `Foundations of ${module.title}`,
      `${module.title} in Practice`,
      `${module.title} Checkpoint Lab`,
    ].map((lessonTitle, lessonIndex) => ({
      durationLabel: `${lessonDurations[lessonIndex]} min`,
      id: `${module.id}-${lessonIndex + 1}`,
      isLocked: !moduleUnlocked && lessonIndex > 0,
      isPreview: moduleIndex === 0 && lessonIndex === 0,
      title: lessonTitle,
    }))

    const totalDurationMinutes = lessonDurations.reduce((sum, current) => sum + current, 0)

    return {
      id: module.id,
      isLocked: !moduleUnlocked,
      lessonCount: lessons.length,
      lessons,
      summary: moduleUnlocked
        ? "Hands-on lessons and checkpoints are ready to explore."
        : "Unlock this module after enrollment to access the full lesson flow.",
      title: module.title,
      totalDurationLabel: `${totalDurationMinutes} min`,
    }
  })
}

export function estimateTotalLessons(modules: CourseModule[]) {
  return Math.max(modules.length * 3, 0)
}
