'use client';
import { createContext, useState, ReactNode, useContext } from 'react';

interface EditableContextType {
  isEditing: boolean;
  edit: () => void;
  submit: () => void;
  cancel: () => void;
  inputValue: string;
  setInputValue: (value: string) => void;
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
  const [draftValue, setDraftValue] = useState(value);
  const inputValue = isEditing ? draftValue : value;

  const edit = () => {
    setDraftValue(value);
    setIsEditing(true);
  };
  const submit = async () => {
    if (onSubmit) {
      try {
        await onSubmit(draftValue);
      } catch (error) {
        console.error('Submit failed:', error);
        return;
      }
    }
    setIsEditing(false);
  };
  const cancel = () => setIsEditing(false);

  const contextValue: EditableContextType = {
    isEditing,
    edit,
    submit,
    cancel,
    inputValue,
    setInputValue: setDraftValue,
  };

  return <EditableContext.Provider value={contextValue}>{children}</EditableContext.Provider>;
}
