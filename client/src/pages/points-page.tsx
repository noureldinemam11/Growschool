import React, { useState } from 'react';
import { PageHeader } from "@/components/ui/page-header";
import StudentGrid from '@/components/points/StudentGrid';
import PointsAssignment from '@/components/points/PointsAssignment';
import { useAuth } from '@/hooks/use-auth';
import { Redirect } from 'wouter';

export default function PointsPage() {
  const { user } = useAuth();
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  if (!user || !['admin', 'teacher'].includes(user.role)) {
    return <Redirect to="/auth" />;
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <PageHeader
        heading="Points Management"
        subheading="Assign points to students for positive and negative behaviors"
      />

      {selectedStudentId ? (
        <PointsAssignment 
          studentId={selectedStudentId} 
          onBack={() => setSelectedStudentId(null)}
        />
      ) : (
        <StudentGrid onSelectStudent={(studentId) => setSelectedStudentId(studentId)} />
      )}
    </div>
  );
}