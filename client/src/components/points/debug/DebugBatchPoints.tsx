import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/hooks/use-auth';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

// A dedicated component for debugging batch points assignment issues
export default function DebugBatchPoints() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [studentIds, setStudentIds] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [teacherId, setTeacherId] = useState(user?.id?.toString() || '');
  const [pointValue, setPointValue] = useState('1');
  const [notes, setNotes] = useState('Test note');
  
  const handleDirectSubmit = async () => {
    setLoading(true);
    setResponse(null);
    setError(null);
    
    try {
      // Format student IDs
      const studentIdArray = studentIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      const points = studentIdArray.map(studentId => ({
        studentId,
        categoryId: parseInt(categoryId),
        points: parseInt(pointValue),
        teacherId: parseInt(teacherId),
        notes: notes
      }));
      
      console.log('DIRECT SUBMISSION DATA:', {
        studentIds: studentIdArray,
        points: points
      });
      
      // Keep it simple - direct API call
      const fetchOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points }),
        credentials: 'include' as RequestCredentials
      };
      
      console.log('Sending request to /api/behavior-points/batch with options:', fetchOptions);
      console.log('Request body:', fetchOptions.body);
      
      const response = await fetch('/api/behavior-points/batch', fetchOptions);
      const responseText = await response.text();
      console.log('Response status:', response.status);
      console.log('Response text:', responseText);
      
      try {
        // Try to parse as JSON
        const data = JSON.parse(responseText);
        setResponse(data);
        
        if (response.ok) {
          toast({
            title: "Success",
            description: `Successfully assigned ${data?.count || 0} points`,
          });
        } else {
          setError(`Server returned an error: ${data.error || 'Unknown error'}`);
        }
      } catch (e) {
        // Not valid JSON
        setResponse({ raw: responseText });
        setError(`Invalid JSON response: ${responseText}`);
      }
    } catch (e: any) {
      console.error('Error in direct submit:', e);
      setError(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleIndividualSubmits = async () => {
    setLoading(true);
    setResponse(null);
    setError(null);
    
    try {
      // Format student IDs
      const studentIdArray = studentIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      const points = studentIdArray.map(studentId => ({
        studentId,
        categoryId: parseInt(categoryId),
        points: parseInt(pointValue),
        teacherId: parseInt(teacherId),
        notes: notes
      }));
      
      console.log('INDIVIDUAL SUBMISSION DATA:', {
        studentIds: studentIdArray,
        points: points
      });
      
      // Process each point individually
      const results = [];
      let successCount = 0;
      let errorCount = 0;
      
      for (const point of points) {
        try {
          const response = await fetch('/api/behavior-points', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(point),
            credentials: 'include'
          });
          
          const data = await response.json();
          results.push({
            studentId: point.studentId,
            success: response.ok,
            data
          });
          
          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (e: any) {
          results.push({
            studentId: point.studentId,
            success: false,
            error: e.message
          });
          errorCount++;
        }
      }
      
      setResponse({
        results,
        summary: {
          total: points.length,
          success: successCount,
          error: errorCount
        }
      });
      
      toast({
        title: "Process Complete",
        description: `Successes: ${successCount}, Failures: ${errorCount}`,
        variant: errorCount > 0 ? "destructive" : "default"
      });
    } catch (e: any) {
      console.error('Error in individual submit:', e);
      setError(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Debug Batch Points Assignment</CardTitle>
          <CardDescription>
            Use this tool to test the batch points API endpoint with controlled inputs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="studentIds">Student IDs (comma-separated)</Label>
              <Input 
                id="studentIds" 
                value={studentIds} 
                onChange={(e) => setStudentIds(e.target.value)}
                placeholder="11, 12, 13"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category ID</Label>
              <Input 
                id="categoryId" 
                value={categoryId} 
                onChange={(e) => setCategoryId(e.target.value)}
                placeholder="1"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="teacherId">Teacher ID</Label>
              <Input 
                id="teacherId" 
                value={teacherId} 
                onChange={(e) => setTeacherId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pointValue">Point Value</Label>
              <Input 
                id="pointValue" 
                value={pointValue} 
                onChange={(e) => setPointValue(e.target.value)}
                type="number"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea 
              id="notes" 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          
          <div className="flex gap-4 pt-4">
            <Button 
              onClick={handleDirectSubmit} 
              disabled={loading}
              className="flex gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Test Batch Endpoint
            </Button>
            
            <Button 
              onClick={handleIndividualSubmits} 
              disabled={loading} 
              variant="outline"
              className="flex gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Test Individual Endpoint
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            <pre className="whitespace-pre-wrap text-xs">{error}</pre>
          </AlertDescription>
        </Alert>
      )}
      
      {response && (
        <Card>
          <CardHeader>
            <CardTitle>Response</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-black/5 rounded-md p-4 overflow-auto text-xs whitespace-pre-wrap max-h-96">
              {JSON.stringify(response, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}