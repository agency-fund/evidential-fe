# Editable Components

A simple inline editing system built with React Context.

## Components

### EditableRoot
Context provider that manages editable state.

```tsx
import { EditableRoot } from './EditableRoot';

<EditableRoot id="user-name" name="userName" defaultValue="John Doe">
  {/* child components */}
</EditableRoot>
```

**Props:**
- `id: string` - Unique identifier
- `name: string` - Field name
- `defaultValue?: string` - Initial value (default: '')
- `children: ReactNode` - Child components

**Context provides:**
- `isEditing: boolean` - Current edit state
- `inputValue: string` - Current input value
- `originalValue: string` - Initial value
- `edit()` - Enter edit mode
- `submit()` - Exit edit mode
- `cancel()` - Exit edit mode and reset to original value
- `setValue(value)` - Update input value
- `id: string` - Component ID
- `name: string` - Component name

### useEditable Hook
Access the editable context in child components.

```tsx
import { useEditable } from './EditableRoot';

const { isEditing, inputValue, edit, submit, cancel } = useEditable();
```

## Usage Pattern

```tsx
<EditableRoot id="title" name="title" defaultValue="Click to edit">
  <EditableArea>
    <EditablePreview />
    <EditableInput />
  </EditableArea>
  <EditableSubmitTrigger>Save</EditableSubmitTrigger>
  <EditableCancelTrigger>Cancel</EditableCancelTrigger>
</EditableRoot>
```