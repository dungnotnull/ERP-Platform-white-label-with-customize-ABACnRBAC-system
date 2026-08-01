# NoteDialog Component Design

**Date:** 2026-06-04
**Status:** Approved
**Type:** UI Component

## Overview

A reusable, modern note dialog component for displaying informational content (policies, guidelines, static information) across the application. The component displays as a styled link trigger that opens a dialog with dynamically passed title and content.

## Component API

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | `string` (i18n key) | Yes | - | Dialog header title |
| `content` | `string` (i18n key) | Yes | - | Body content (supports HTML formatting) |
| `triggerLabel` | `string` (i18n key) | No | "common.notes" | Text for the trigger link |
| `className` | `string` | No | - | Additional classes for trigger element |

### Component Structure

```
NoteDialog
├── Dialog (Radix UI root)
├── DialogTrigger (styled link with Info icon)
└── DialogContent
    ├── DialogHeader
    │   └── DialogTitle
    ├── DialogBody (content with HTML support)
    └── DialogFooter
        └── "Understood" button (DialogClose)
```

## Implementation Details

### File Structure

- **Component:** `src/components/ui/NoteDialog.tsx`
- **Location:** UI components directory for consistency

### Dependencies

- `@/components/ui/Dialog` - Existing dialog components
- `@/components/ui/Button` - Existing button component
- `lucide-react` - Info icon
- `react-i18next` - Internationalization

### Component Logic

- Wraps existing Radix Dialog components
- Trigger renders as flex link with Info icon + translated text
- Content supports HTML via `dangerouslySetInnerHTML`
- No additional state management (Dialog handles open/close)
- "Understood" button closes the dialog

### Extensibility

- Future: Add `open`/`onOpenChange` props for controlled behavior
- Future: Add `variant` prop for different visual styles
- Future: Add custom footer actions if needed

## Usage & Integration

### Employee Detail Page Integration

**Location:** `src/pages/employees/EmployeeDetail.tsx`

Place after PageTopBar component, before the Back button:

```tsx
<NoteDialog
  title="employees.notes.title"
  content="employees.notes.content"
  triggerLabel="employees.notes.trigger"
/>
```

### i18n Configuration

**English (`locales/en/employees.json`):**
```json
{
  "notes": {
    "title": "Important Employee Information",
    "trigger": "Important Notes",
    "content": "<p>Key information about employee records:</p><ul><li>Point 1</li><li>Point 2</li></ul>"
  }
}
```

**Vietnamese (`locales/vi/employees.json`):**
```json
{
  "notes": {
    "title": "Thông tin quan trọng về nhân viên",
    "trigger": "Lưu ý quan trọng",
    "content": "<p>Thông tin chính về hồ sơ nhân viên:</p><ul><li>Điểm 1</li><li>Điểm 2</li></ul>"
  }
}
```

### Reusability

Component can be used on any page:

```tsx
// Different pages, different content
<NoteDialog title="assets.notes.title" content="assets.notes.content" />
<NoteDialog title="device.notes.title" content="device.notes.content" />
```

## Styling & UX

### Trigger Link

- Info icon (16-18px) + text label
- `hover:text-green-700` (matches Back button pattern)
- Underline on hover
- Inline-flex layout

### Dialog

- Leverages existing Dialog styles:
  - `rounded-3xl` corners
  - Backdrop blur (`bg-black/40 backdrop-blur-sm`)
  - Neumorphic shadows
  - Max-width: `sm:max-w-lg`
  - Max-height: `75vh` with scroll

### Button

- Uses existing Button component
- Green hover state (`hover:bg-green-700`)
- Closes dialog on click

### Accessibility

- Radix UI primitives provide ARIA support
- Keyboard navigation: Escape to close, Enter to trigger
- Focus management handled by primitives
- Screen reader support via DialogTitle/DialogDescription

### Animation

- Existing Dialog animations: zoom-in, fade-in
- 200ms duration
- Smooth backdrop transition

## Success Criteria

- [x] Component renders trigger link correctly
- [x] Clicking trigger opens dialog with correct title/content
- [x] "Understood" button closes dialog
- [x] Content supports HTML formatting (bold, links, lists)
- [x] i18n works correctly for all text
- [x] Styling matches existing neumorphic design
- [x] Keyboard navigation works
- [x] Component is reusable across different pages

## Design Decisions

1. **Simple Props API vs Compound Pattern:** Chose simple props for ease of use. Compound pattern would be overkill for informational content display.

2. **HTML Content Support:** Used `dangerouslySetInnerHTML` to support rich content (links, formatting). Alternative: Markdown parser, but HTML is sufficient for this use case.

3. **i18n-only Content:** Content is passed as i18n keys only. Static strings not supported to maintain consistency and keep API simple.

4. **No Custom Footer Actions:** Single "Understood" button is sufficient for informational content. Can be extended later if needed.

5. **Info Icon on Trigger:** Adds visual prominence and helps users recognize this is informational content.

## Related Components

- `Dialog` - Base dialog primitives
- `Button` - Footer action button
- `AlertDialog` - Alternative for destructive actions (not this use case)
