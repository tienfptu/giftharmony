import React from 'react';
import { Button } from '../ui/button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = ({ icon, title, description, actionLabel, onAction }: EmptyStateProps) => {
  return (
    <div className="text-center py-16">
      <div className="flex justify-center mb-4 text-gray-300">
        {icon}
      </div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-2 font-['Poppins',Helvetica]">
        {title}
      </h2>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button 
          onClick={onAction}
          className="bg-[#49bbbd] hover:bg-[#3a9a9c] text-white"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};