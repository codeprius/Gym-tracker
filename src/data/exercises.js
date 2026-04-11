export const DEFAULT_CATEGORIES = [
  {
    id: 'chest',
    name: 'Chest',
    color: '#f97316',
    exercises: [
      'Bench Press', 'Incline Bench Press', 'Decline Bench Press',
      'Dumbbell Flyes', 'Cable Crossover', 'Push-Up', 'Chest Dip',
    ],
  },
  {
    id: 'back',
    name: 'Back',
    color: '#3b82f6',
    exercises: [
      'Deadlift', 'Pull-Up', 'Chin-Up', 'Barbell Row', 'Seated Cable Row',
      'Lat Pulldown', 'T-Bar Row', 'Single-Arm Dumbbell Row',
    ],
  },
  {
    id: 'shoulders',
    name: 'Shoulders',
    color: '#8b5cf6',
    exercises: [
      'Overhead Press', 'Arnold Press', 'Lateral Raise', 'Front Raise',
      'Reverse Flyes', 'Upright Row', 'Face Pull',
    ],
  },
  {
    id: 'arms',
    name: 'Arms',
    color: '#ec4899',
    exercises: [
      'Barbell Curl', 'Dumbbell Curl', 'Hammer Curl', 'Preacher Curl',
      'Tricep Pushdown', 'Skull Crusher', 'Overhead Tricep Extension', 'Dips',
    ],
  },
  {
    id: 'legs',
    name: 'Legs',
    color: '#10b981',
    exercises: [
      'Squat', 'Front Squat', 'Leg Press', 'Romanian Deadlift',
      'Lunges', 'Leg Curl', 'Leg Extension', 'Calf Raise', 'Hack Squat',
    ],
  },
  {
    id: 'core',
    name: 'Core',
    color: '#f59e0b',
    exercises: [
      'Plank', 'Crunches', 'Leg Raise', 'Russian Twist',
      'Ab Wheel Rollout', 'Cable Crunch', 'Hanging Knee Raise',
    ],
  },
  {
    id: 'cardio',
    name: 'Cardio',
    color: '#06b6d4',
    exercises: [
      'Treadmill Run', 'Cycling', 'Jump Rope', 'Rowing Machine',
      'Stair Climber', 'Elliptical', 'Battle Ropes',
    ],
  },
]

export function getCategoryForExercise(exerciseName) {
  for (const cat of DEFAULT_CATEGORIES) {
    if (cat.exercises.includes(exerciseName)) return cat
  }
  return null
}

export function getAllExercises() {
  return DEFAULT_CATEGORIES.flatMap(c => c.exercises.map(e => ({ name: e, category: c })))
}
