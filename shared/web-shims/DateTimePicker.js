import React from 'react';

const styles = {
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    fontFamily: 'system-ui',
    backgroundColor: '#FAFAFA',
    color: '#333',
    width: '100%',
    outline: 'none',
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
};

export default function DateTimePicker({ value, mode, maximumDate, onChange, style }) {
  return (
    <input
      type={mode === 'date' ? 'date' : 'datetime-local'}
      value={value ? value.toISOString().split('T')[0] : ''}
      max={maximumDate ? maximumDate.toISOString().split('T')[0] : undefined}
      onChange={e => {
        const raw = e.target.value;
        const dt = raw ? new Date(mode === 'date' ? raw + 'T00:00:00' : raw) : null;
        onChange?.({ type: 'set', nativeEvent: {} }, dt);
      }}
      style={{ ...styles.input, ...style }}
    />
  );
}
