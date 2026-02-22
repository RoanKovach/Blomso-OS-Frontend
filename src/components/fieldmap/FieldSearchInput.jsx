import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

/**
 * A styled search input component for filtering lists.
 * @param {{
 *  value: string,
 *  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
 *  placeholder?: string,
 *  className?: string
 * }} props
 */
export const FieldSearchInput = ({
  value,
  onChange,
  placeholder = 'Search by name, farm, or crop...',
  className = '',
}) => {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <Input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="pl-10"
      />
    </div>
  );
};