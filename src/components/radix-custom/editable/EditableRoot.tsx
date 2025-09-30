'use client';
import { createContext, useState, ReactNode, useContext } from 'react';

interface EditableContextType {
  isEditing: boolean;
  edit: () => void;
  submit: () => void;
  cancel: () => void;
  inputValue: string;
  setValue: (value: string) => void;
  originalValue: string;
  name: string;
}

export const EditableContext = createContext<EditableContextType | undefined>(undefined);

interface EditableRootProps {
  children: ReactNode;
  name: string;
  defaultValue?: string;
  onSubmit?: (value: string) => Promise<void> | void;
}

export function EditableRoot({ children, name, defaultValue = '', onSubmit }: EditableRootProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(defaultValue);
  const [originalValue] = useState(defaultValue);

  const edit = () => setIsEditing(true);
  const submit = async () => {
    if (inputValue.trim() === '') {
      cancel();
      return;
    }

    if (onSubmit) {
      try {
        await onSubmit(inputValue);
      } catch (error) {
        console.error('Submit failed:', error);
        return;
      }
    }
    setIsEditing(false);
  };
  const cancel = () => {
    setInputValue(originalValue);
    setIsEditing(false);
  };
  const setValue = (value: string) => setInputValue(value);

  const value: EditableContextType = {
    isEditing,
    edit,
    submit,
    cancel,
    inputValue,
    setValue,
    originalValue,
    name,
  };

  return (
    <EditableContext.Provider value={value}>
      {children}
    </EditableContext.Provider>
  );
}

export function useEditable() {
  const context = useContext(EditableContext);
  if (!context) {
    throw new Error('useEditable must be used within EditableRoot');
  }
  return context;
}