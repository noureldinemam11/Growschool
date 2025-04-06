import { useIncidentReport, useUpdateIncidentReport } from "@/hooks/use-incident-reports";
import { incidentStatuses, type User } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Link } from "wouter";
import { FileText, Calendar, Users, User as UserIcon, ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";

interface IncidentReportDetailProps {
  id: number;
  students: User[];
}

export default function IncidentReportDetail({ id, students }: IncidentReportDetailProps) {
  const { data: report, isLoading: isReportLoading } = useIncidentReport(id);
  const updateMutation = useUpdateIncidentReport(id);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string | null>(null);

  const handleStatusUpdate = async () => {
    if (newStatus && report) {
      try {
        await updateMutation.mutateAsync({
          status: newStatus as any,
        });
        setIsStatusDialogOpen(false);
      } catch (error) {
        console.error("Error updating incident status:", error);
      }
    }
  };

  const formatIncidentType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "resolved": return "bg-green-100 text-green-800";
      case "escalated": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Find student details for the involved students
  const involvedStudents = students.filter(
    student => report?.studentIds?.includes(student.id) || false
  );

  if (isReportLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!report) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Incident Report Not Found</CardTitle>
          <CardDescription>
            The incident report you're looking for doesn't exist or has been deleted
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">
              Please return to the incident reports list and select another report.
            </p>
            <Link href="/incidents">
              <Button>Back to Incident Reports</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Incident Report #{report.id}</CardTitle>
            <CardDescription>
              {formatIncidentType(report.type)} • Reported on {format(new Date(report.createdAt), "PPP")}
            </CardDescription>
          </div>
          <Badge variant="outline" className={getStatusColor(report.status)}>
            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium flex items-center gap-2 mb-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Incident Date
            </h3>
            <p className="text-base">
              {format(new Date(report.incidentDate), "PPPP")}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium flex items-center gap-2 mb-2 text-muted-foreground">
              <UserIcon className="h-4 w-4" />
              Reported By
            </h3>
            <p className="text-base">
              Teacher ID: {report.teacherId}
            </p>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-sm font-medium flex items-center gap-2 mb-3 text-muted-foreground">
            <FileText className="h-4 w-4" />
            Description
          </h3>
          <div className="p-4 bg-muted rounded-md text-sm">
            {report.description || "No description provided."}
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-sm font-medium flex items-center gap-2 mb-3 text-muted-foreground">
            <Users className="h-4 w-4" />
            Students Involved ({report.studentIds?.length || 0})
          </h3>
          <div className="space-y-2">
            {involvedStudents.length > 0 ? (
              <div className="grid gap-2">
                {involvedStudents.map(student => (
                  <div key={student.id} className="flex items-center p-2 bg-muted rounded-md">
                    <div>
                      <p className="font-medium">{student.firstName} {student.lastName}</p>
                      <p className="text-xs text-muted-foreground">
                        {student.gradeLevel ? `Grade ${student.gradeLevel}` : 'No grade specified'} 
                        {student.houseId ? ` • House ID: ${student.houseId}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Student details not available
              </p>
            )}
          </div>
        </div>

        {report.attachmentUrl && (
          <>
            <Separator />
            <div>
              <h3 className="text-sm font-medium flex items-center gap-2 mb-3 text-muted-foreground">
                <ExternalLink className="h-4 w-4" />
                Attachment
              </h3>
              <a 
                href={report.attachmentUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary hover:underline flex items-center gap-1"
              >
                View Attachment <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="justify-between">
        <Link href="/incidents">
          <Button variant="outline">Back to List</Button>
        </Link>
        <div className="space-x-2">
          <Link href={`/incidents/${report.id}/edit`}>
            <Button variant="outline">Edit Report</Button>
          </Link>
          <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
            <DialogTrigger asChild>
              <Button>Update Status</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Incident Status</DialogTitle>
                <DialogDescription>
                  Change the current status of this incident report.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Select 
                  defaultValue={report.status} 
                  onValueChange={(value) => setNewStatus(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a new status" />
                  </SelectTrigger>
                  <SelectContent>
                    {incidentStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsStatusDialogOpen(false)}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleStatusUpdate}
                  disabled={updateMutation.isPending || !newStatus || newStatus === report.status}
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardFooter>
    </Card>
  );
}