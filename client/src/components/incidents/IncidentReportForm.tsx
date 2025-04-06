import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { User } from "@shared/schema";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { incidentTypes } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface IncidentReportFormProps {
  students: User[];
  onSuccess?: () => void;
}

export default function IncidentReportForm({ students, onSuccess }: IncidentReportFormProps) {
  const [selectedStudents, setSelectedStudents] = useState<User[]>([]);
  const [type, setType] = useState<string>("classroom_disruption");
  const [description, setDescription] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleStudentToggle = (student: User, checked: boolean) => {
    if (checked) {
      setSelectedStudents(prev => [...prev, student]);
    } else {
      setSelectedStudents(prev => prev.filter(s => s.id !== student.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("Form submission started");
    console.log("Current user:", user);
    
    // Validation
    if (selectedStudents.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one student",
        variant: "destructive",
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: "Error",
        description: "Please provide a description of the incident",
        variant: "destructive",
      });
      return;
    }
    
    if (!user?.id) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to submit a report",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create the report data
      const reportData = {
        type,
        description,
        teacherId: user.id,
        studentIds: selectedStudents.map(student => student.id),
        incidentDate: new Date(),
        attachmentUrl: "",
      };
      
      console.log("Submitting report:", reportData);
      
      // Submit the report using the API directly
      const res = await apiRequest("POST", "/api/incident-reports", reportData);
      const data = await res.json();
      
      console.log("Submission result:", data);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/incident-reports'] });
      
      toast({
        title: "Success",
        description: "Incident report has been submitted successfully",
      });
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/incidents");
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      toast({
        title: "Submission Error",
        description: error instanceof Error ? error.message : "Failed to submit report",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Submit Incident Report</CardTitle>
        <CardDescription>
          Document student behavior incidents for administrative review
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="incident-type">Incident Type</Label>
            <Select 
              value={type} 
              onValueChange={setType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select incident type" />
              </SelectTrigger>
              <SelectContent>
                {incidentTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1).replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Provide details about the incident"
              className="min-h-[100px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Include what happened, when, where, and any relevant context
            </p>
          </div>
          
          <div className="space-y-3">
            <Label>Students Involved</Label>
            <div className="border rounded-md p-4 max-h-[200px] overflow-y-auto">
              <div className="space-y-2">
                {students.map((student) => (
                  <div key={student.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`student-${student.id}`}
                      checked={selectedStudents.some(s => s.id === student.id)}
                      onCheckedChange={(checked) => 
                        handleStudentToggle(student, checked as boolean)
                      }
                    />
                    <label
                      htmlFor={`student-${student.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {student.firstName} {student.lastName}
                      {student.gradeLevel && ` (Grade ${student.gradeLevel})`}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Select all students involved in the incident
            </p>
          </div>
          
          <div className="flex justify-end gap-4 mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/incidents")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="px-8"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Report"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}