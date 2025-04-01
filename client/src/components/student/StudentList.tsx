import { FC } from 'react';
import { User } from '@shared/schema';
import { cn } from '@/lib/utils';

interface StudentListProps {
  students: Partial<User>[];
  selectedStudentId: number | null;
  onSelectStudent: (id: number) => void;
}

const StudentList: FC<StudentListProps> = ({ students, selectedStudentId, onSelectStudent }) => {
  return (
    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
      {students.map(student => (
        <div 
          key={student.id}
          className={cn(
            "flex items-center p-2 rounded-md cursor-pointer transition-colors",
            student.id === selectedStudentId 
              ? "bg-primary text-white" 
              : "hover:bg-neutral"
          )}
          onClick={() => onSelectStudent(student.id!)}
        >
          <div className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center",
            student.id === selectedStudentId 
              ? "bg-white" 
              : "bg-neutral-light"
          )}>
            <span className={cn(
              "font-semibold",
              student.id === selectedStudentId 
                ? "text-primary" 
                : "text-neutral-dark"
            )}>
              {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
            </span>
          </div>
          <div className="ml-3">
            <div className="font-medium">{student.firstName} {student.lastName}</div>
            <div className={cn(
              "text-xs",
              student.id === selectedStudentId 
                ? "text-white text-opacity-90" 
                : "text-neutral-dark"
            )}>
              {student.gradeLevel && student.section 
                ? `Grade ${student.gradeLevel}${student.section}` 
                : ''}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StudentList;
