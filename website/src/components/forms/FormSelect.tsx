interface FormSelectProps {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  required?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  error?: string;
}

export const FormSelect = ({
  label,
  name,
  options,
  required = false,
  value,
  onChange,
  error,
}: FormSelectProps) => {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-semibold text-haroti-ink/90 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-haroti-forest focus:border-transparent transition-all ${
          error ? 'border-red-500' : 'border-haroti-muted/30'
        }`}
      >
        <option value="">Select an option</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};
