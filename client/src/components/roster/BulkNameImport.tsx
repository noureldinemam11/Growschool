import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Schema for the form
const bulkImportSchema = z.object({
  studentNames: z.string().min(1, { message: "Please enter at least one student name" }),
  classId: z.string(),
  podId: z.string(),
  gradeLevel: z.string(),
});

type BulkImportFormData = z.infer<typeof bulkImportSchema>;

interface ImportResult {
  success: boolean;
  created: number;
  errors: Array<{ line: number; name: string; error: string }>;
  message: string;
}

interface BulkNameImportProps {
  classes: Array<{id: number; name: string; podId: number; gradeLevel: string}>;
  pods: Array<{id: number; name: string; color: string}>;
}

export function BulkNameImport({ classes, pods }: BulkNameImportProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Set up form
  const form = useForm<BulkImportFormData>({
    resolver: zodResolver(bulkImportSchema),
    defaultValues: {
      studentNames: '',
      classId: 'none',
      podId: 'none',
      gradeLevel: 'none',
    },
  });

  // Handle class selection change
  const handleClassChange = (classId: string) => {
    if (!classId || classId === 'none') {
      // User selected "None" - reset related fields to "none"
      form.setValue('podId', 'none');
      form.setValue('gradeLevel', 'none');
      return;
    }
    
    const selectedClass = classes.find(c => c.id.toString() === classId);
    if (selectedClass) {
      // Automatically set podId and gradeLevel based on selected class
      form.setValue('podId', selectedClass.podId.toString());
      form.setValue('gradeLevel', selectedClass.gradeLevel);
    }
  };

  // Mutation for bulk importing students
  const bulkImportMutation = useMutation({
    mutationFn: async (data: BulkImportFormData) => {
      // Process the names from the textarea
      const names = data.studentNames
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0);

      const payload = {
        names,
        classId: data.classId && data.classId !== 'none' ? parseInt(data.classId) : undefined,
        podId: data.podId && data.podId !== 'none' ? parseInt(data.podId) : undefined,
        gradeLevel: data.gradeLevel && data.gradeLevel !== 'none' ? data.gradeLevel : undefined,
      };

      const response = await apiRequest('POST', '/api/users/bulk-import-names', payload);
      return response.json();
    },
    onSuccess: (data: ImportResult) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/users/role/student'] });
      
      setImportResult(data);
      
      toast({
        title: data.success ? "Import Successful" : "Import Completed with Issues",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BulkImportFormData) => {
    bulkImportMutation.mutate(data);
  };

  const handleClose = () => {
    setOpen(false);
    setImportResult(null);
    form.reset();
  };

  return (
    <>
      <Button 
        variant="secondary" 
        onClick={() => setOpen(true)} 
        className="flex items-center gap-1.5"
      >
        <Upload className="h-4 w-4" />
        Import Student Names
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Bulk Import Students</DialogTitle>
            <DialogDescription>
              Add multiple students by pasting their names. No emails, usernames, or passwords required.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="studentNames"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student Names</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste student names here, one per line. Example:
ABDULLA AHMED SAEED ALORAIMIALJNEIBI
ABDULLA SALEM MUBAREK BINSHAIKHA ALMARRI
ALI HASAN ALI ABDULQADER ALKATHEERI"
                        className="font-mono h-60"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter each student name on a new line exactly as shown in your list.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="classId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign to Class</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleClassChange(value);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Class" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {classes.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id.toString()}>
                              {cls.name} (Grade {cls.gradeLevel})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Optional: Class assignment
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="podId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign to Pod</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Pod" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {pods.map((pod) => (
                            <SelectItem key={pod.id} value={pod.id.toString()}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: pod.color }}
                                ></div>
                                {pod.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Optional: Will be set automatically if class is selected
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gradeLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grade Level</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Grade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
                            <SelectItem key={grade} value={grade.toString()}>
                              Grade {grade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Optional: Will be set automatically if class is selected
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {importResult && (
                <Card>
                  <CardHeader>
                    <CardTitle>{importResult.success ? "Import Successful" : "Import Completed with Issues"}</CardTitle>
                    <CardDescription>
                      {importResult.created} students were successfully added.
                    </CardDescription>
                  </CardHeader>
                  {importResult.errors.length > 0 && (
                    <CardContent>
                      <h3 className="text-destructive font-medium mb-2">The following errors occurred:</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {importResult.errors.map((error, index) => (
                          <li key={index}>
                            Line {error.line}: {error.name} - {error.error}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  )}
                </Card>
              )}

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClose}
                  className="mr-2"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={bulkImportMutation.isPending}
                >
                  {bulkImportMutation.isPending ? "Importing..." : "Import Students"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}