import React from 'react';

interface RoleSelectorProps {
  selected: 'cpa' | 'franchisee' | 'smb';
  onChange: (role: 'cpa' | 'franchisee' | 'smb') => void;
}

export default function RoleSelector({ selected, onChange }: RoleSelectorProps) {
  const roles = [
    {
      value: 'cpa' as const,
      label: 'CPA/Accountant',
      icon: 'fa-sharp fa-regular fa-file-invoice-dollar',
      ariaLabel: 'CPA managing client finances'
    },
    {
      value: 'franchisee' as const,
      label: 'Franchisee',
      icon: 'fa-sharp fa-regular fa-store',
      ariaLabel: 'Franchisee managing multiple locations'
    },
    {
      value: 'smb' as const,
      label: 'Small Business Owner',
      icon: 'fa-sharp fa-regular fa-building',
      ariaLabel: 'Small business owner managing companies'
    },
  ];

  return (
    <div className="flex justify-center items-center gap-6 py-4 bg-gray-50 border-b border-gray-200">
      <span className="text-sm text-gray-600 font-medium">I manage:</span>
      <div className="flex gap-6">
        {roles.map((role) => (
          <label
            key={role.value}
            className="flex items-center gap-2 cursor-pointer hover:text-[#1239FF] transition-colors"
          >
            <input
              type="radio"
              name="role"
              value={role.value}
              checked={selected === role.value}
              onChange={() => onChange(role.value)}
              className="w-4 h-4 text-[#1239FF] focus:ring-[#1239FF] focus:ring-2 cursor-pointer"
            />
            <i
              className={`${role.icon} text-lg ${selected === role.value ? 'text-[#1239FF]' : 'text-gray-600'}`}
              aria-label={role.ariaLabel}
              role="img"
            />
            <span className={`text-sm font-medium ${selected === role.value ? 'text-[#1239FF]' : 'text-gray-700'}`}>
              {role.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
