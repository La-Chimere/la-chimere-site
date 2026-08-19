interface ToggleSwitchProps {
  on: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function ToggleSwitch({ on, onChange, label, disabled }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      className={`mini-toggle ${on ? "on" : ""}`}
      onClick={() => !disabled && onChange(!on)}
      disabled={disabled}
      aria-pressed={on}
      aria-label={label}
    >
      <span className="k" />
    </button>
  );
}
