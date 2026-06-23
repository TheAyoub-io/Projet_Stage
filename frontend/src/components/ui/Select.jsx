import React, { useState } from 'react';
import { ChevronDown, AlertCircle, CheckCircle } from 'lucide-react';

const Select = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  error,
  hint,
  required = false,
  disabled = false,
  icon: Icon,
  success = false,
  className = '',
  multiple = false,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (option) => {
    if (multiple) {
      const newValue = Array.isArray(value) ? value : [];
      if (newValue.includes(option.value)) {
        onChange(newValue.filter(v => v !== option.value));
      } else {
        onChange([...newValue, option.value]);
      }
    } else {
      onChange(option.value);
      setIsOpen(false);
    }
  };

  const getDisplayValue = () => {
    if (!value) return placeholder;
    if (multiple && Array.isArray(value)) {
      return value.map(v => options.find(o => o.value === v)?.label).join(', ');
    }
    return options.find(o => o.value === value)?.label || placeholder;
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className={`relative ${className}`}>
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full px-4 py-2.5 ${Icon ? 'pl-10' : ''} rounded-lg border-2 transition-all duration-200 text-left flex items-center justify-between
            ${error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-900/30'
              : success
              ? 'border-green-500 focus:border-green-500 focus:ring-green-100 dark:focus:ring-green-900/30'
              : 'border-gray-300 dark:border-gray-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30'
            }
            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
            disabled:opacity-50 disabled:cursor-not-allowed`}
          {...props}
        >
          <span className="flex items-center gap-2">
            {Icon && <Icon size={18} />}
            {getDisplayValue()}
          </span>
          <ChevronDown size={18} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute z-50 top-full mt-2 w-full bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option)}
                className={`w-full px-4 py-2.5 text-left hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors flex items-center gap-2
                  ${(multiple ? Array.isArray(value) && value.includes(option.value) : value === option.value)
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'text-gray-900 dark:text-white'
                  }`}
              >
                {multiple && (
                  <input
                    type="checkbox"
                    checked={Array.isArray(value) && value.includes(option.value)}
                    readOnly
                    className="w-4 h-4 rounded cursor-pointer"
                  />
                )}
                {option.label}
              </button>
            ))}
          </div>
        )}

        {success && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
            <CheckCircle size={18} />
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1.5 mt-1.5 text-sm text-red-600 dark:text-red-400">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {hint && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">{hint}</p>
      )}
    </div>
  );
};

export default Select;
