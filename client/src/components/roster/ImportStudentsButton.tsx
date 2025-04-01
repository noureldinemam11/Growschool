import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, AlertTriangle, CheckCircle2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import Students from Excel</DialogTitle>
            <DialogDescription>
              <div className="bg-amber-50 p-3 rounded mb-4 border border-amber-200">
                <h3 className="font-medium text-amber-800 flex items-center mb-1">
                  <AlertTriangle className="h-4 w-4 mr-1" /> Important
                </h3>
                <p className="text-sm text-amber-700 mb-1">
                  Your import file must follow the exact template format. The previous import failed because
                  required fields were missing.
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
              
              <h3 className="font-medium mb-2">Import Requirements</h3>
              <ul className="list-disc pl-5 text-sm space-y-1 mb-2">
                <li><strong>Required columns:</strong> firstName, lastName, username, email, password</li>
                <li><strong>Optional columns:</strong> gradeLevel, section, houseId</li>
                <li>Column names must be spelled exactly as shown (case-sensitive)</li>
                <li>Do not rename the Excel headers from the template</li>
                <li>Every row must have values for all required fields</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            {!importResult ? (
              <div className="grid gap-4 py-4">
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
              </div>
            ) : (
              <div className="py-4">
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
              </div>
            )}
            
            <DialogFooter className="gap-2 sm:gap-0">
              {!importResult ? (
                <>
                  <Button type="button" variant="outline" onClick={closeDialog} disabled={importMutation.isPending}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!file || importMutation.isPending}>
                    {importMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {importMutation.isPending ? "Importing..." : "Import"}
                  </Button>
                </>
              ) : (
                <>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Import Another File
                  </Button>
                  <Button type="button" onClick={closeDialog}>
                    Close
                  </Button>
                </>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}