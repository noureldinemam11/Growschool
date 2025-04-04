import React, { useEffect } from 'react';
import DebugBatchPoints from '@/components/points/debug/DebugBatchPoints';

export default function DebugPage() {
  useEffect(() => {
    document.title = "Debug Batch Points | School Behavior Management";
  }, []);
  
  return (
    <div className="container max-w-6xl py-8">
      <h1 className="text-3xl font-bold mb-8">Debug Tools</h1>
      <DebugBatchPoints />
    </div>
  );
}