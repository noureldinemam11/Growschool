import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, AlertTriangle, CheckCircle2, Download, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { BulkNameImport } from "@/components/roster/BulkNameImport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ImportResult = {
  message: string;
  results: {
    total: number;
    imported: number;
    failed: number;
    errors: { row: number; message: string }[];
  };
};

export function ImportStudentsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importMethod, setImportMethod] = useState<string>("excel");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch pods for the name import component
  const { data: pods = [] } = useQuery({
    queryKey: ['/api/pods'],
  });
  
  // Fetch classes for the name import component
  const { data: classes = [] } = useQuery({
    queryKey: ['/api/classes'],
  });
  
  const importMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/import/students', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header, let the browser set it with the boundary
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          error: "Failed to parse error response" 
        }));
        
        // Create more user-friendly error message based on status code
        const defaultErrorMsg = "Failed to import students";
        const errorMessage = errorData.error || defaultErrorMsg;
        
        // Add more context based on status code
        if (response.status === 400) {
          throw new Error(`Invalid file: ${errorMessage}`);
        } else if (response.status === 413) {
          throw new Error("File is too large. Please upload a smaller file.");
        } else if (response.status >= 500) {
          throw new Error(`Server error: ${errorMessage}`);
        } else {
          throw new Error(errorMessage);
        }
      }
      
      return response.json() as Promise<ImportResult>;
    },
    onSuccess: (data) => {
      if (data.results.imported > 0) {
        // Invalidate any queries that use student data
        queryClient.invalidateQueries({ queryKey: ["/api/users/students"] });
        queryClient.invalidateQueries({ queryKey: ["/api/users/role/student"] });
        
        // Show success toast
        toast({
          title: "Import Successful",
          description: `Imported ${data.results.imported} of ${data.results.total} students`,
          variant: "default",
        });
      }
      
      setImportResult(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImportResult(null);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select an Excel file to upload",
        variant: "destructive",
      });
      return;
    }
    
    // Check file extension
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(fileExtension || '')) {
      toast({
        title: "Invalid file type",
        description: "Please select an Excel (.xlsx, .xls) or CSV file",
        variant: "destructive",
      });
      return;
    }
    
    // Check file size (5MB max)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 5MB",
        variant: "destructive",
      });
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    importMutation.mutate(formData);
  };
  
  const resetForm = () => {
    setFile(null);
    setImportResult(null);
  };
  
  const closeDialog = () => {
    setIsOpen(false);
    setTimeout(resetForm, 300); // Reset after close animation
  };
  
  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" asChild>
          <a href="/student_import_template.xlsx" download>
            <Download className="mr-2 h-4 w-4" />
            Download Template
          </a>
        </Button>
        <Button variant="secondary" onClick={() => setIsOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Import Students
        </Button>
      </div>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Import Students</DialogTitle>
            <DialogDescription>
              Choose an import method below
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="names" onValueChange={setImportMethod} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="names" className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                Import Student Names
              </TabsTrigger>
              <TabsTrigger value="excel" className="flex items-center gap-1.5">
                <Upload className="h-4 w-4" />
                Import from Excel
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="names" className="mt-4">
              <div className="space-y-4">
                <div className="bg-blue-50 p-3 rounded mb-4 border border-blue-100">
                  <h3 className="font-medium text-blue-800 flex items-center mb-1">
                    Simplified Student Import
                  </h3>
                  <p className="text-sm text-blue-700 mb-1">
                    Paste a list of student names to import them without requiring email addresses, usernames, or passwords.
                    Each student will be automatically assigned a system-generated username.
                  </p>
                </div>
                
                <BulkNameImport classes={classes} pods={pods} />
              </div>
            </TabsContent>
            
            <TabsContent value="excel" className="mt-4">
              <form onSubmit={handleSubmit}>
                {!importResult ? (
                  <div className="space-y-4">
                    <div className="bg-amber-50 p-3 rounded mb-4 border border-amber-200">
                      <h3 className="font-medium text-amber-800 flex items-center mb-1">
                        <AlertTriangle className="h-4 w-4 mr-1" /> Important
                      </h3>
                      <p className="text-sm text-amber-700 mb-1">
                        Your import file must follow the exact template format with all required fields.
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="bg-white border-amber-300 text-amber-800 hover:bg-amber-100"
                        >
                          <a href="/student_import_template.xlsx" download>
                            <Download className="h-3 w-3 mr-1" /> Download Template
                          </a>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="bg-white border-amber-300 text-amber-800 hover:bg-amber-100"
                        >
                          <a href="/student_import_readme.txt" download>
                            <Download className="h-3 w-3 mr-1" /> Download Instructions
                          </a>
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-medium mb-2">Import Requirements</h3>
                      <ul className="list-disc pl-5 text-sm space-y-1 mb-2">
                        <li><strong>Required columns:</strong> firstName, lastName, username, email, password</li>
                        <li><strong>Optional columns:</strong> gradeLevel, section, podId, classId</li>
                        <li>Column names must be spelled exactly as shown (case-sensitive)</li>
                      </ul>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="file">Excel File</Label>
                      <Input
                        id="file"
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileChange}
                        disabled={importMutation.isPending}
                      />
                      <p className="text-sm text-muted-foreground">
                        Maximum file size is 5MB
                      </p>
                    </div>
                    
                    <DialogFooter className="gap-2 sm:gap-0 pt-2">
                      <Button type="button" variant="outline" onClick={closeDialog} disabled={importMutation.isPending}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={!file || importMutation.isPending}>
                        {importMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {importMutation.isPending ? "Importing..." : "Import"}
                      </Button>
                    </DialogFooter>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Alert className={importResult.results.failed > 0 ? "bg-amber-50" : "bg-green-50"}>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center">
                          {importResult.results.failed > 0 ? (
                            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                          ) : (
                            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                          )}
                          <AlertDescription className="font-medium">
                            {importResult.message}
                          </AlertDescription>
                        </div>
                        
                        <div className="ml-7 text-sm">
                          <p>Total records: {importResult.results.total}</p>
                          <p className="text-green-600">Successfully imported: {importResult.results.imported}</p>
                          {importResult.results.failed > 0 && (
                            <p className="text-amber-600">Failed to import: {importResult.results.failed}</p>
                          )}
                        </div>
                        
                        {importResult.results.errors.length > 0 && (
                          <div className="mt-2 max-h-32 overflow-y-auto border rounded p-2">
                            <p className="font-medium text-sm mb-1">Errors:</p>
                            <ul className="text-xs space-y-1">
                              {importResult.results.errors.map((error, index) => (
                                <li key={index} className="text-red-600">
                                  Row {error.row}: {error.message}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </Alert>
                    
                    <DialogFooter className="gap-2 sm:gap-0">
                      <Button type="button" variant="outline" onClick={resetForm}>
                        Import Another File
                      </Button>
                      <Button type="button" onClick={closeDialog}>
                        Close
                      </Button>
                    </DialogFooter>
                  </div>
                )}
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}