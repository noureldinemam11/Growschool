import { CelebrationType } from "@/components/animations/CelebrationAnimation";
import { BehaviorPoint, User } from "@shared/schema";

// Define milestone thresholds
export const milestones = {
  studentPoints: [10, 25, 50, 100, 250, 500, 1000],
  teacherAwards: [5, 10, 25, 50, 100, 250, 500],
  positiveStreak: [3, 5, 10, 15, 20, 30],
  housePoints: [50, 100, 250, 500, 1000, 2500, 5000],
  improvement: [10, 25, 50],
};

// Track milestones that have already been celebrated to avoid repeating
const celebratedMilestones = new Map<string, Set<number>>();

// Initialize milestone tracking for a specific user or entity
export function initMilestoneTracking(entityId: string, entityType: string) {
  const key = `${entityType}_${entityId}`;
  if (!celebratedMilestones.has(key)) {
    celebratedMilestones.set(key, new Set<number>());
  }
}

// Check if a milestone should be celebrated and mark it as celebrated
export function checkMilestone(
  value: number, 
  entityId: string, 
  entityType: string, 
  milestoneType: keyof typeof milestones
): { shouldCelebrate: boolean; milestone: number; type: CelebrationType; message: string } | null {
  const key = `${entityType}_${entityId}`;
  const entityMilestones = celebratedMilestones.get(key) || new Set<number>();
  
  // Find the first milestone that matches the current value and hasn't been celebrated yet
  const milestone = milestones[milestoneType].find(
    (m) => value >= m && !entityMilestones.has(m)
  );
  
  if (!milestone) {
    return null;
  }
  
  // Mark this milestone as celebrated
  entityMilestones.add(milestone);
  celebratedMilestones.set(key, entityMilestones);
  
  // Determine celebration type and message based on milestone type
  let celebrationType: CelebrationType;
  let message = "";
  
  switch (milestoneType) {
    case "studentPoints":
      celebrationType = "points_milestone";
      message = `You've reached ${milestone} total behavior points!`;
      break;
    case "teacherAwards":
      celebrationType = "achievement";
      message = `You've awarded ${milestone} behavior points to students!`;
      break;
    case "positiveStreak":
      celebrationType = "behavior_streak";
      message = `Amazing! ${milestone} positive behaviors in a row!`;
      break;
    case "housePoints":
      celebrationType = "house_milestone";
      message = `Your house has reached ${milestone} points! Keep up the great work!`;
      break;
    case "improvement":
      celebrationType = "improvement";
      message = `Outstanding improvement with ${milestone} positive points this week!`;
      break;
    default:
      celebrationType = "achievement";
      message = `Congratulations on reaching ${milestone}!`;
  }
  
  return {
    shouldCelebrate: true,
    milestone,
    type: celebrationType,
    message
  };
}

// Helper functions for specific milestone checks

// Check for student point milestones when points are awarded
export function checkStudentPointMilestone(
  studentId: number,
  totalPoints: number
) {
  return checkMilestone(totalPoints, studentId.toString(), "student", "studentPoints");
}

// Check for teacher award milestones
export function checkTeacherAwardMilestone(
  teacherId: number,
  awardCount: number
) {
  return checkMilestone(awardCount, teacherId.toString(), "teacher", "teacherAwards");
}

// Check for positive behavior streaks
export function checkPositiveStreak(
  studentId: number,
  recentPoints: BehaviorPoint[],
  currentStreak: number
) {
  return checkMilestone(currentStreak, studentId.toString(), "student_streak", "positiveStreak");
}

// Check for house point milestones
export function checkHousePointMilestone(
  houseId: number,
  totalPoints: number
) {
  return checkMilestone(totalPoints, houseId.toString(), "house", "housePoints");
}

// Check for improvement milestones (e.g., improvement over previous week)
export function checkImprovementMilestone(
  studentId: number,
  improvementAmount: number
) {
  return checkMilestone(improvementAmount, studentId.toString(), "student_improvement", "improvement");
}

// Calculate positive behavior streaks for a student
export function calculatePositiveStreak(recentPoints: BehaviorPoint[]): number {
  // Sort points by timestamp, newest first
  const sortedPoints = [...recentPoints].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  let streak = 0;
  
  // Count consecutive positive points
  for (const point of sortedPoints) {
    if (point.points > 0) {
      streak++;
    } else {
      // Streak is broken on first negative behavior
      break;
    }
  }
  
  return streak;
}

// Calculate the improvement in points from one period to another
export function calculateImprovement(
  currentPeriodPoints: number,
  previousPeriodPoints: number
): number {
  return Math.max(0, currentPeriodPoints - previousPeriodPoints);
}

// Reset all milestone tracking (useful for testing or at the start of a new term)
export function resetMilestoneTracking() {
  celebratedMilestones.clear();
}