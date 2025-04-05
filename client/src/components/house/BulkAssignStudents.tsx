import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

export function BulkAssignStudents({ houseId, houseName, color }: { houseId: number, houseName: string, color: string }) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch all students
  const { data: students, isLoading } = useQuery<any[]>({
    queryKey: ['/api/users/role/student'],
  });
  
  // Filter students that are not in this house or match search query
  const filteredStudents = students?.filter(student => {
    // Consider null, undefined, or 0 as "no house"
    const studentHasNoHouse = student.houseId === null || student.houseId === undefined || student.houseId === 0;
    // Either student has no house or has a different house than current
    const canBeAssigned = studentHasNoHouse || (student.houseId !== houseId);
    
    // Apply search filter
    const matchesSearch = 
      (student.firstName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
      (student.lastName?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    return canBeAssigned && matchesSearch;
  });
  
  // Mutation to assign students to house
  const assignStudents = useMutation({
    mutationFn: async (studentIds: number[]) => {
      const res = await apiRequest('POST', `/api/houses/${houseId}/assign-students`, { studentIds });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/role/student'] });
      toast({
        title: 'Students Assigned',
        description: `Successfully assigned ${selectedStudents.length} students to ${houseName} house.`,
      });
      setOpen(false);
      setSelectedStudents([]);
    },
    onError: (error: Error) => {
      toast({
        title: 'Assignment Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const handleAssign = () => {
    if (selectedStudents.length === 0) {
      toast({
        title: 'No Students Selected',
        description: 'Please select at least one student to assign to this house.',
        variant: 'destructive',
      });
      return;
    }
    
    assignStudents.mutate(selectedStudents);
  };
  
  const toggleStudent = (studentId: number) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };
  
  const selectAll = () => {
    if (filteredStudents) {
      setSelectedStudents(filteredStudents.map(student => student.id));
    }
  };
  
  const deselectAll = () => {
    setSelectedStudents([]);
  };
  
  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5"
      >
        <UserPlus className="h-4 w-4" />
        <span>Assign Students</span>
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Assign Students to {houseName} House</DialogTitle>
            <DialogDescription>
              Select students to assign to this house. Only students who are not currently assigned to this house will be shown.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>
            
            <div className="flex items-center gap-2 justify-end text-sm">
              <Button variant="outline" size="sm" onClick={selectAll}>Select All</Button>
              <Button variant="outline" size="sm" onClick={deselectAll}>Deselect All</Button>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto border rounded-md p-1">
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredStudents?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No students available to assign to this house.
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredStudents?.map(student => (
                    <div
                      key={student.id}
                      className="flex items-center space-x-2 p-2 hover:bg-accent/50 rounded-md"
                    >
                      <Checkbox
                        id={`student-${student.id}`}
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={() => toggleStudent(student.id)}
                      />
                      <label
                        htmlFor={`student-${student.id}`}
                        className="flex-1 cursor-pointer font-medium"
                      >
                        {student.firstName} {student.lastName} 
                        {student.gradeLevel && (
                          <span className="text-sm text-muted-foreground ml-2">
                            Grade {student.gradeLevel}{student.section && `, Section ${student.section}`}
                          </span>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAssign}
              style={{ backgroundColor: color }}
              className="text-white"
              disabled={assignStudents.isPending || selectedStudents.length === 0}
            >
              {assignStudents.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                `Assign ${selectedStudents.length} Students`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}