import React from 'react';

interface RoleSelectorProps {
  selected: 'cpa' | 'franchisee' | 'smb';
  onChange: (role: 'cpa' | 'franchisee' | 'smb') => void;
  isEmbedded?: boolean;
}

export default function RoleSelector({ selected, onChange, isEmbedded = false }: RoleSelectorProps) {
  const roles = [
    {
      value: 'cpa' as const,
      label: 'CPA/Accountant',
      icon: 'fa-sharp fa-regular fa-file-invoice-dollar',
      ariaLabel: 'CPA managing client finances'
    },
    {
      value: 'franchisee' as const,
      label: 'Franchisee/ZOR',
      icon: 'fa-sharp fa-regular fa-store',
      ariaLabel: 'Franchisee or franchisor managing multiple locations'
    },
    {
      value: 'smb' as const,
      label: 'Small Business Owner',
      icon: 'fa-sharp fa-regular fa-building',
      ariaLabel: 'Small business owner managing companies'
    },
  ];

  // Use compact padding for embedded mode
  const verticalPadding = isEmbedded ? 'py-2' : 'py-4';

  return (
    <div className={`flex flex-wrap justify-center items-center gap-2 sm:gap-4 md:gap-6 ${verticalPadding} bg-gray-50 border-b border-gray-200`}>
      <span className="text-sm sm:text-base text-gray-700 font-bold w-full sm:w-auto text-center sm:text-left mb-1 sm:mb-0">I'm a</span>
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-6">
        {roles.map((role) => (
          <label
            key={role.value}
            className="flex items-center gap-1.5 sm:gap-2 cursor-pointer hover:text-[#1239FF] transition-colors min-h-[44px]"
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
              className={`${role.icon} text-base sm:text-lg ${selected === role.value ? 'text-[#1239FF]' : 'text-gray-600'}`}
              aria-label={role.ariaLabel}
              role="img"
            />
            <span className={`text-xs sm:text-sm font-medium ${selected === role.value ? 'text-[#1239FF]' : 'text-gray-700'} whitespace-nowrap`}>
              {role.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
