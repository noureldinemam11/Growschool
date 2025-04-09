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
  classId: z.string().optional(),
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
      classId: undefined,
    },
  });

  // No need for class change handler anymore since we only have the class field

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
        classId: data.classId && data.classId !== '' && data.classId !== 'none' ? parseInt(data.classId) : undefined,
      };

      try {
        // Use direct fetch API with explicit content-type header
        const response = await fetch('/api/users/bulk-import-names', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload),
          credentials: 'include'
        });
        
        // Check if response is ok
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API error:', errorText);
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
        
        // Try to parse as JSON
        try {
          return await response.json();
        } catch (parseError) {
          const text = await response.text();
          console.error('Failed to parse response as JSON:', text);
          throw new Error('Invalid JSON response from server');
        }
      } catch (error) {
        console.error('Error in bulk import:', error);
        throw error;
      }
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

              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="classId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign to Class</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
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