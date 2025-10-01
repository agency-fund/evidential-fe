'use client';
import { createContext, useState, ReactNode, useContext, useEffect } from 'react';

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
  value: string;
  onSubmit?: (value: string) => Promise<void> | void;
}

export function EditableRoot({ children, name, value, onSubmit }: EditableRootProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [originalValue, setOriginalValue] = useState(value);

  useEffect(() => {
    if (!isEditing) {
      setInputValue(value);
      setOriginalValue(value);
    }
  }, [value, isEditing]);

  const edit = () => setIsEditing(true);
  const submit = async () => {
    if (inputValue.trim() === '') {
      cancel();
      return;
    }

    if (onSubmit) {
      try {
        await onSubmit(inputValue);
        // Update originalValue to the submitted value so cancel works correctly
        setOriginalValue(inputValue);
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
  const setValue = (val: string) => setInputValue(val);

  const contextValue: EditableContextType = {
    isEditing,
    edit,
    submit,
    cancel,
    inputValue,
    setValue,
    originalValue,
    name,
  };

  return <EditableContext.Provider value={contextValue}>{children}</EditableContext.Provider>;
}

export function useEditable() {
  const context = useContext(EditableContext);
  if (!context) {
    throw new Error('useEditable must be used within EditableRoot');
  }
  return context;
}
