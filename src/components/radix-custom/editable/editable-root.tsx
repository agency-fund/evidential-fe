'use client';
import { createContext, useState, ReactNode, useContext, useEffect } from 'react';

interface EditableContextType {
  isEditing: boolean;
  edit: () => void;
  submit: () => void;
  cancel: () => void;
  inputValue: string;
  setInputValue: (value: string) => void;
  originalValue: string;
}

export const EditableContext = createContext<EditableContextType | undefined>(undefined);

export function useEditable() {
  const context = useContext(EditableContext);
  if (!context) {
    throw new Error('useEditable must be used within EditableRoot');
  }
  return context;
}

interface EditableRootProps {
  children: ReactNode;
  value: string;
  onSubmit?: (value: string) => Promise<void> | void;
}

export function EditableRoot({ children, value, onSubmit }: EditableRootProps) {
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

  const contextValue: EditableContextType = {
    isEditing,
    edit,
    submit,
    cancel,
    inputValue,
    setInputValue,
    originalValue,
  };

  return <EditableContext.Provider value={contextValue}>{children}</EditableContext.Provider>;
}
