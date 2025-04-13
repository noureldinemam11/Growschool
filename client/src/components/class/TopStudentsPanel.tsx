import { Loader2 } from 'lucide-react';
import React from 'react';

interface TopStudent {
  id: number;
  firstName: string;
  lastName: string;
  totalPoints: number;
}

interface ClassTopStudentData {
  classId: number;
  className: string;
  podId: number;
  classColor: string;
  classPoints: number;
  topStudent: TopStudent | null;
}

interface TopStudentsPanelProps {
  classes: any[];
  classPoints: Record<number, number>;
  topStudentsByClass: ClassTopStudentData[] | undefined;
  isLoadingClassTopStudents: boolean;
}

const TopStudentsPanel: React.FC<TopStudentsPanelProps> = ({
  classes,
  classPoints,
  topStudentsByClass,
  isLoadingClassTopStudents
}) => {
  // Sort classes by points
  const sortedClasses = [...classes].sort((a, b) => 
    (classPoints[b.id] || 0) - (classPoints[a.id] || 0)
  );
  
  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      <div className="bg-blue-600 text-white py-3 px-4 font-bold">
        TOP STUDENTS BY CLASS
      </div>
      <div className="p-4">
        {isLoadingClassTopStudents ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3">
            {sortedClasses.map((classItem, index) => {
              const topStudent = topStudentsByClass?.find(c => c.classId === classItem.id)?.topStudent;
              return (
                <div key={classItem.id} className="flex items-center py-2 border-b last:border-b-0">
                  {/* Rank Number */}
                  <div 
                    className={`flex items-center justify-center h-7 w-7 rounded-full text-white font-semibold mr-3 
                    ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-700' : 'bg-gray-200'}`}
                  >
                    {index + 1}
                  </div>
                  
                  {/* Class Info */}
                  <div className="mr-2">
                    <div className="font-semibold">{classItem.name}</div>
                    <div className="text-xs text-gray-500">{classPoints[classItem.id] || 0} points</div>
                  </div>
                  
                  {/* Student Info */}
                  <div className="ml-auto flex items-center">
                    {topStudent ? (
                      <>
                        <div className="text-right mr-3">
                          <div className="font-semibold">{topStudent.firstName} {topStudent.lastName.charAt(0)}</div>
                          <div className="text-xs text-gray-500">Star Student</div>
                        </div>
                        <div className="bg-primary/10 text-primary px-2 py-1 rounded font-semibold whitespace-nowrap">
                          {topStudent.totalPoints} pts
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-400 italic">No students</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TopStudentsPanel;