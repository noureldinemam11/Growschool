import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { insertIncidentReportSchema, incidentTypes } from "@shared/schema";
import { useCreateIncidentReport } from "@/hooks/use-incident-reports";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "@shared/schema";
import { Loader2 } from "lucide-react";

// Extend the schema to add custom validation
const formSchema = insertIncidentReportSchema.extend({
  studentIds: z.array(z.number()).min(1, {
    message: "At least one student must be selected",
  }),
});

type IncidentFormValues = z.infer<typeof formSchema>;

interface IncidentReportFormProps {
  students: User[];
  onSuccess?: () => void;
}

export default function IncidentReportForm({ students, onSuccess }: IncidentReportFormProps) {
  const [selectedStudents, setSelectedStudents] = useState<User[]>([]);
  const createMutation = useCreateIncidentReport();
  const [, navigate] = useLocation();

  // Set up form with default values
  const form = useForm<IncidentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "classroom_disruption", // Default selection
      description: "",
      studentIds: [],
      incidentDate: new Date(),
      attachmentUrl: "",
    },
  });

  // Handle form submission
  const onSubmit = async (values: IncidentFormValues) => {
    try {
      await createMutation.mutateAsync(values);
      if (onSuccess) {
        onSuccess();
      } else {
        // Navigate back to the incidents list if no success callback is provided
        navigate("/incidents");
      }
    } catch (error) {
      console.error("Error submitting incident report:", error);
    }
  };

  // Handle student selection
  const handleStudentToggle = (student: User, checked: boolean) => {
    if (checked) {
      // Add student to selection
      setSelectedStudents(prev => [...prev, student]);
      // Update form values
      const currentStudentIds = form.getValues("studentIds");
      form.setValue("studentIds", [...currentStudentIds, student.id]);
    } else {
      // Remove student from selection
      setSelectedStudents(prev => prev.filter(s => s.id !== student.id));
      // Update form values
      const currentStudentIds = form.getValues("studentIds");
      form.setValue("studentIds", currentStudentIds.filter(id => id !== student.id));
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Incident Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select incident type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {incidentTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1).replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide details about the incident"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Include what happened, when, where, and any relevant context
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="studentIds"
              render={() => (
                <FormItem>
                  <FormLabel>Students Involved</FormLabel>
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
                  <FormDescription>
                    Select all students involved in the incident
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="attachmentUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Attachment URL (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/document.pdf"
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a link to any relevant documents, images, or evidence
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <CardFooter className="px-0 pt-6 flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/incidents")}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Report"
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}