const baseCourses = [

  {
    id: "1",
    title: "Data Structures & Algorithms",
    level: "Intermediate",
    progress: 65,
    enrolled: true,
    modules: [
      { id: "1", title: "Arrays" },
      { id: "2", title: "Linked Lists" },
      { id: "3", title: "Stacks" },
      { id: "4", title: "Queues" },
      { id: "5", title: "Trees" },
    ]
  },

  {
    id: "2",
    title: "SQL Mastery",
    level: "Beginner",
    progress: 85,
    enrolled: true,
    modules: [
      { id: "1", title: "Joins" },
      { id: "2", title: "Aggregations" },
      { id: "3", title: "Indexes" },
      { id: "4", title: "Optimization" },
      { id: "5", title: "Query Debugging" }
    ]
  },

  {
    id: "3",
    title: "Computer Networks",
    level: "Advanced",
    progress: 20,
    enrolled: false,
    modules: [
      { id: "1", title: "TCP/IP" },
      { id: "2", title: "DNS" },
      { id: "3", title: "Routing" },
      { id: "4", title: "Security" },
      { id: "5", title: "Network Analysis" }
    ]
  },

  {
    id: "4",
    title: "Operating Systems",
    level: "Intermediate",
    progress: 45,
    enrolled: false,
    modules: [
      { id: "1", title: "Processes" },
      { id: "2", title: "Threads" },
      { id: "3", title: "Memory" },
      { id: "4", title: "Scheduling" },
      { id: "5", title: "File Systems" }
    ]
  },

  {
    id: "5",
    title: "Java Programming",
    level: "Beginner",
    progress: 0,
    enrolled: false,
    modules: [
      { id: "1", title: "OOP" },
      { id: "2", title: "Collections" },
      { id: "3", title: "Threads" },
      { id: "4", title: "Streams" },
      { id: "5", title: "Spring Basics" }
    ]
  }

]

export const courses = baseCourses.map(course => ({
  ...course,
  modules: [
    ...course.modules,
    { id: "6", title: "Final Evaluation" }
  ]
}))