import { useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Clock, AlertCircle, Pencil, Trash2, ChevronLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useIncidentReports } from "@/hooks/incident-report-context";



export default function IncidentReportDetail({ id }: { id: number }) {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { 
    getReportById, 
    isLoading, 
    deleteReport, 
    updateReport,
    getTeacherName,
    students 
  } = useIncidentReports();
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  
  const report = getReportById(id);
  const isAdmin = user?.role === 'admin';
  
  // Helper function for status badge
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "resolved": return "bg-green-100 text-green-800";
      case "escalated": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  
  const formatIncidentType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
  };
  
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteReport(id);
      navigate("/incidents");
    } catch (error) {
      console.error("Error deleting incident report:", error);
      setIsDeleting(false);
      setShowDeleteAlert(false);
    }
  };
  
  const handleResolve = async () => {
    try {
      setIsUpdating(true);
      await updateReport(id, { 
        status: "resolved",
        adminId: user?.id
      });
      setIsUpdating(false);
    } catch (error) {
      console.error("Error resolving incident report:", error);
      setIsUpdating(false);
    }
  };
  
  const handleEscalate = async () => {
    try {
      setIsUpdating(true);
      await updateReport(id, { 
        status: "escalated",
        adminId: user?.id 
      });
      setIsUpdating(false);
    } catch (error) {
      console.error("Error escalating incident report:", error);
      setIsUpdating(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!report) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Report Not Found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              The incident report you're looking for doesn't exist or has been deleted.
            </p>
            <Button className="mt-4" onClick={() => navigate("/incidents")}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Incident Reports
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Map student IDs to names
  const studentNames = report.studentIds.map(studentId => {
    const student = students.find(s => s.id === studentId);
    return student ? `${student.firstName} ${student.lastName}` : `Student #${studentId}`;
  });
  
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className={getStatusColor(report.status)}>
                  {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                </Badge>
                <Badge variant="outline">
                  {formatIncidentType(report.type)}
                </Badge>
              </div>
              <CardTitle className="text-2xl">Incident Report #{report.id}</CardTitle>
              <CardDescription className="flex items-center mt-1">
                <Clock className="h-4 w-4 mr-1" />
                {format(new Date(report.incidentDate), "MMMM d, yyyy 'at' h:mm a")}
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" asChild>
                <a href={`/incidents/${id}/edit`}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </a>
              </Button>
              <Button variant="outline" size="sm" className="text-red-600" onClick={() => setShowDeleteAlert(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Reporter Information</h3>
              <p className="text-muted-foreground">{getTeacherName(report.teacherId)}</p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Students Involved</h3>
              <div className="space-y-2">
                {studentNames.map((name, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium mr-2">
                      {name.charAt(0)}
                    </div>
                    <span>{name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="text-lg font-medium mb-2">Incident Description</h3>
            <div className="p-4 bg-muted rounded-md whitespace-pre-wrap">
              {report.description}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Action Taken by Teacher</h3>
            <div className="p-4 bg-muted rounded-md">
              {report.actionTaken ? (
                report.actionTaken === "none" ? (
                  <span className="text-muted-foreground">No action was taken before escalation</span>
                ) : (
                  <span>{report.actionTaken}</span>
                )
              ) : (
                <span className="text-muted-foreground">Not specified</span>
              )}
            </div>
          </div>
          
          {isAdmin && (
            <>
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-2">Admin Response</h3>
                {report.adminResponse ? (
                  <div className="p-4 bg-muted rounded-md whitespace-pre-wrap">
                    {report.adminResponse}
                  </div>
                ) : (
                  <div className="border rounded-md p-4">
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.target as HTMLFormElement;
                      const textarea = form.querySelector('textarea') as HTMLTextAreaElement;
                      const response = textarea.value.trim();
                      
                      if (response) {
                        setIsUpdating(true);
                        try {
                          await updateReport(id, { adminResponse: response });
                          setIsUpdating(false);
                        } catch (error) {
                          console.error("Error submitting admin response:", error);
                          setIsUpdating(false);
                        }
                      }
                    }}>
                      <textarea
                        className="w-full h-24 p-2 border rounded-md mb-3"
                        placeholder="Enter your response here..."
                        required
                      />
                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={isUpdating}
                        >
                          {isUpdating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            "Add Response"
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between border-t pt-6">
          <Button variant="outline" onClick={() => navigate("/incidents")}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Incident Reports
          </Button>
          
          {isAdmin && report.status === "pending" && (
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={handleResolve}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Mark as Resolved"
                )}
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleEscalate}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Escalate"
                )}
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              incident report and remove it from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}