# 🎯 SMART INSERT FEATURE - Thêm vào Đúng Vị Trí Đã Chọn

## 📋 Tổng Quan

Feature này cho phép **insert HTML elements vào đúng vị trí bạn đã chọn** trong Elementor Editor, thay vì luôn thêm vào cuối page.

### Ví dụ:

```
Working on: Elementor #11 > Column #2

→ Click Insert → Elements sẽ thêm vào Column #2 (vị trí bạn đang edit)
```

---

## 🎯 Cách Hoạt Động

### Logic Insert

```
1. User chọn một element trong Elementor (Section/Column/Widget)
2. User paste HTML vào modal
3. Click "Insert to Page"
4. Code tự động detect element đã chọn
5. Insert vào đúng vị trí dựa trên element type
```

---

## 🔍 Detection Logic Chi Tiết

### 1. Detect Element Đã Chọn

```javascript
getTargetContainer() {
    // Get selected element from panel
    const panel = elementor.getPanelView();
    const currentPageView = panel.getCurrentPageView();
    const selectedElement = currentPageView.getOption('editedElementView');
    
    // OR from context menu
    const selectedElement = elementor.channels.editor.request('contextMenu:targetView');
}
```

**Elementor có 2 cách để biết element đang được chọn**:

#### A. Panel Editor Route
```javascript
if ($e.routes.isPartOf('panel/editor')) {
    // User đang edit element trong panel
    const currentPageView = panel.getCurrentPageView();
    const editedElementView = currentPageView.getOption('editedElementView');
}
```

**Khi nào xảy ra**: User click vào một element để edit (panel bên trái hiện controls)

#### B. Context Menu
```javascript
const contextElement = elementor.channels.editor.request('contextMenu:targetView');
```

**Khi nào xảy ra**: User right-click vào element (context menu appears)

---

### 2. Xác Định Container Dựa Trên Element Type

```javascript
const elType = selectedContainer.model.get('elType');

switch (elType) {
    case 'widget':
        // Insert AFTER widget
        break;
    case 'section':
        // Insert INTO first column
        break;
    case 'column':
        // Insert INTO column
        break;
    case 'container':
        // Insert INTO container
        break;
}
```

---

## 📐 Insert Rules

### Rule 1: Widget được chọn

```
Selected: Widget #3 trong Column #2

Action: Insert AFTER Widget #3

Logic:
- Get parent container (Column #2)
- Get widget index (3)
- Insert at index + 1 (position 4)
```

**Code**:
```javascript
case 'widget':
    const parent = selectedContainer.parent;  // Column
    const index = selectedElement._index;     // 3
    
    return {
        container: parent,
        options: { at: index + 1 }  // Insert at position 4
    };
```

---

### Rule 2: Section được chọn

```
Selected: Section #1

Action: Insert INTO first column of section

Logic:
- Get section's first column
- Insert at end of column (no specific index)
```

**Code**:
```javascript
case 'section':
    const firstColumn = selectedContainer.children[0];
    
    return {
        container: firstColumn,
        options: {}  // No specific index = append
    };
```

**Tại sao vào Column đầu tiên?**
- Section không chứa widgets trực tiếp
- Widgets phải nằm trong Column
- First column là vị trí logical nhất

---

### Rule 3: Column được chọn

```
Selected: Column #2

Action: Insert INTO selected column

Logic:
- Use column as container directly
- Append to end of column
```

**Code**:
```javascript
case 'column':
    return {
        container: selectedContainer,
        options: {}
    };
```

---

### Rule 4: Container được chọn

```
Selected: Container (Flexbox/Grid)

Action: Insert INTO container

Logic:
- Use container directly
- Append to end
```

**Code**:
```javascript
case 'container':
    return {
        container: selectedContainer,
        options: {}
    };
```

---

### Rule 5: Không có Element nào được chọn

```
No Selection

Action: Insert at document level (end of page)

Logic:
- Use document container
- Append to end of page
```

**Code**:
```javascript
if (!selectedElement) {
    return {
        container: elementor.getPreviewContainer(),  // Document
        options: {}
    };
}
```

---

## 🎨 Visual Examples

### Example 1: Insert After Widget

```
BEFORE:
┌─────────────────────────┐
│ Section                 │
│  ┌─────────────────────┐│
│  │ Column              ││
│  │  ┌──────────────┐  ││
│  │  │ Widget #1    │  ││  ← Select this
│  │  └──────────────┘  ││
│  │  ┌──────────────┐  ││
│  │  │ Widget #2    │  ││
│  │  └──────────────┘  ││
│  └─────────────────────┘│
└─────────────────────────┘

Paste HTML: <button>New Button</button>
Click Insert

AFTER:
┌─────────────────────────┐
│ Section                 │
│  ┌─────────────────────┐│
│  │ Column              ││
│  │  ┌──────────────┐  ││
│  │  │ Widget #1    │  ││  ← Was selected
│  │  └──────────────┘  ││
│  │  ┌──────────────┐  ││
│  │  │ NEW BUTTON   │  ││  ← Inserted here!
│  │  └──────────────┘  ││
│  │  ┌──────────────┐  ││
│  │  │ Widget #2    │  ││
│  │  └──────────────┘  ││
│  └─────────────────────┘│
└─────────────────────────┘
```

---

### Example 2: Insert Into Column

```
BEFORE:
┌─────────────────────────────────────┐
│ Section                             │
│  ┌──────────┐  ┌──────────────────┐│
│  │ Column 1 │  │ Column 2         ││  ← Select this
│  │          │  │  ┌────────────┐  ││
│  │          │  │  │ Widget #1  │  ││
│  │          │  │  └────────────┘  ││
│  └──────────┘  └──────────────────┘│
└─────────────────────────────────────┘

Paste HTML: <h1>Title</h1><p>Text</p>
Click Insert

AFTER:
┌─────────────────────────────────────┐
│ Section                             │
│  ┌──────────┐  ┌──────────────────┐│
│  │ Column 1 │  │ Column 2         ││  ← Was selected
│  │          │  │  ┌────────────┐  ││
│  │          │  │  │ Widget #1  │  ││
│  │          │  │  └────────────┘  ││
│  │          │  │  ┌────────────┐  ││
│  │          │  │  │ HEADING    │  ││  ← Inserted!
│  │          │  │  └────────────┘  ││
│  │          │  │  ┌────────────┐  ││
│  │          │  │  │ TEXT       │  ││  ← Inserted!
│  │          │  │  └────────────┘  ││
│  └──────────┘  └──────────────────┘│
└─────────────────────────────────────┘
```

---

### Example 3: Insert Into Section

```
BEFORE:
┌─────────────────────────────────────┐
│ Section #2                          │  ← Select this
│  ┌──────────┐  ┌──────────────────┐│
│  │ Column 1 │  │ Column 2         ││
│  │ (empty)  │  │  ┌────────────┐  ││
│  │          │  │  │ Widget #1  │  ││
│  │          │  │  └────────────┘  ││
│  └──────────┘  └──────────────────┘│
└─────────────────────────────────────┘

Paste HTML: <div><button>CTA</button></div>
Click Insert

AFTER:
┌─────────────────────────────────────┐
│ Section #2                          │
│  ┌──────────┐  ┌──────────────────┐│
│  │ Column 1 │  │ Column 2         ││
│  │  ┌─────┐ │  │  ┌────────────┐  ││
│  │  │ CTA │ │  │  │ Widget #1  │  ││  ← Inserted in Col 1!
│  │  └─────┘ │  │  └────────────┘  ││
│  └──────────┘  └──────────────────┘│
└─────────────────────────────────────┘
```

---

## 🔧 Implementation Code

### Full Method

```javascript
/**
 * Get target container for inserting elements
 * Similar to Elementor's getContainerForNewElement()
 */
getTargetContainer() {
    // Default to document container
    const defaultContainer = {
        container: elementor.getPreviewContainer(),
        options: {}
    };

    try {
        // Get selected element from panel
        const panel = elementor.getPanelView();
        let selectedElement = null;

        // Method 1: From editor panel
        if ($e.routes.isPartOf('panel/editor')) {
            const currentPageView = panel.getCurrentPageView();
            if (currentPageView && currentPageView.getOption) {
                selectedElement = currentPageView.getOption('editedElementView');
            }
        }

        // Method 2: From context menu
        if (!selectedElement && elementor.channels && elementor.channels.editor) {
            selectedElement = elementor.channels.editor.request('contextMenu:targetView');
        }

        // No selection
        if (!selectedElement) {
            console.log('📄 No selection, inserting at document level');
            return defaultContainer;
        }

        const selectedContainer = selectedElement.getContainer();
        const elType = selectedContainer.model.get('elType');

        console.log('🎯 Selected element:', {
            type: elType,
            id: selectedContainer.id,
            label: selectedContainer.model.get('widgetType') || elType
        });

        // Handle based on type
        switch (elType) {
            case 'widget':
                // Insert after widget
                const parent = selectedContainer.parent;
                const index = selectedElement._index ?? -1;
                
                if (parent && index > -1) {
                    console.log(`  → Inserting after widget at index ${index}`);
                    return {
                        container: parent,
                        options: { at: index + 1 }
                    };
                }
                break;

            case 'section':
                // Insert into first column
                const firstColumn = selectedContainer.children?.[0];
                if (firstColumn) {
                    console.log('  → Inserting into section\'s first column');
                    return {
                        container: firstColumn,
                        options: {}
                    };
                }
                break;

            case 'column':
                // Insert into column
                console.log('  → Inserting into selected column');
                return {
                    container: selectedContainer,
                    options: {}
                };

            case 'container':
                // Insert into container
                console.log('  → Inserting into container');
                return {
                    container: selectedContainer,
                    options: {}
                };

            default:
                console.log('  → Unknown type, using element as container');
                return {
                    container: selectedContainer,
                    options: {}
                };
        }
    } catch (err) {
        console.warn('Failed to get selected element:', err);
    }

    return defaultContainer;
}
```

---

### Usage in Insert Button

```javascript
insertBtn.onclick = () => {
    if (!currentElements) return;
    
    // Check Elementor availability
    if (typeof elementor === 'undefined' || typeof $e === 'undefined') {
        alert('Please run this inside Elementor Editor!');
        return;
    }

    try {
        // Get target container (smart detection)
        const targetInfo = this.getTargetContainer();
        
        console.log('🎯 Inserting into:', targetInfo);

        // Insert each element
        currentElements.forEach(element => {
            $e.run('document/elements/create', {
                model: element,
                container: targetInfo.container,  // Smart container
                options: targetInfo.options || {}  // Smart position
            });
        });

        modal.remove();
        alert('✅ Elements inserted successfully!');
    } catch (err) {
        alert('Failed to insert: ' + err.message);
        console.error(err);
    }
};
```

---

## 🧪 Testing Guide

### Test Case 1: Insert After Widget

1. Open page in Elementor
2. Click chọn một widget bất kỳ (panel bên trái mở ra)
3. Nhìn title bar: "Working on: Elementor > Section > Column > Widget"
4. Press **Ctrl+Shift+H** (mở converter)
5. Paste HTML: `<button>Test Button</button>`
6. Click "Insert to Page"
7. **Expected**: Button xuất hiện **NGAY SAU** widget đã chọn

**Console Output**:
```
🎯 Selected element: { type: 'widget', id: 'abc123', label: 'heading' }
  → Inserting after widget at index 2
🎯 Inserting into: { container: Column, options: { at: 3 } }
✅ Elements inserted successfully!
```

---

### Test Case 2: Insert Into Column

1. Click chọn một Column (not widget, click vào border của column)
2. Title bar: "Working on: Elementor > Section > Column"
3. Open converter (Ctrl+Shift+H)
4. Paste HTML: `<h1>Title</h1><p>Paragraph</p>`
5. Click Insert
6. **Expected**: Elements xuất hiện **TRONG column đã chọn**, ở cuối

**Console Output**:
```
🎯 Selected element: { type: 'column', id: 'def456' }
  → Inserting into selected column
🎯 Inserting into: { container: Column, options: {} }
```

---

### Test Case 3: Insert Into Section

1. Click chọn một Section (click vào section handle/border)
2. Title bar: "Working on: Elementor > Section"
3. Open converter
4. Paste HTML: `<div><img src="test.jpg" /><button>CTA</button></div>`
5. Click Insert
6. **Expected**: Elements xuất hiện trong **COLUMN ĐẦU TIÊN** của section

**Console Output**:
```
🎯 Selected element: { type: 'section', id: 'ghi789' }
  → Inserting into section's first column
🎯 Inserting into: { container: Column(0), options: {} }
```

---

### Test Case 4: No Selection

1. Không chọn element nào (click vào empty space)
2. Open converter
3. Paste HTML và insert
4. **Expected**: Elements xuất hiện **Ở CUỐI PAGE** (document level)

**Console Output**:
```
📄 No selection, inserting at document level
🎯 Inserting into: { container: Document, options: {} }
```

---

## 🎓 Học Từ Elementor

### Elementor's Approach

File: `elementor/packages/core/editor-components/src/utils/get-container-for-new-element.ts`

```typescript
export const getContainerForNewElement = (): { 
    container: V1Element | null; 
    options?: { at: number } 
} => {
    const selectedElement = getSelectedElementContainer();
    
    if (selectedElement) {
        switch (selectedElement.model.get('elType')) {
            case 'widget':
                return {
                    container: selectedElement.parent,
                    options: { at: selectedElement.view._index + 1 }
                };
            case 'section':
                return {
                    container: selectedElement.children?.[0]
                };
            default:
                return { container: selectedElement };
        }
    }
    
    return { container: getCurrentDocumentContainer() };
};
```

**Chúng ta làm tương tự!**

---

## 💡 Key Concepts

### 1. Element Hierarchy

```
Document
└── Section
    └── Column
        └── Widget
```

### 2. Container vs Element

- **Container**: Nơi chứa child elements (Document, Section, Column, Container)
- **Element**: Có thể là anything (Widget, Section, Column, etc.)

### 3. Insert Position

- `options: {}` = Insert at end (append)
- `options: { at: 3 }` = Insert at specific index (0-based)

### 4. Element Index

```javascript
selectedElement._index  // Current position in parent
// Index 0 = first
// Index 1 = second
// etc.
```

---

## 🚀 Benefits

### Before (Old Behavior)

```
❌ Always insert at end of page
❌ Need to manually drag elements to correct position
❌ Slow workflow
❌ Annoying for complex layouts
```

### After (New Behavior)

```
✅ Insert exactly where you want
✅ Context-aware insertion
✅ Fast workflow
✅ Natural editing experience
✅ Matches Elementor's native behavior
```

---

## 📊 Comparison Table

| Scenario | Old Behavior | New Behavior |
|----------|-------------|--------------|
| **Widget selected** | Insert at page end | Insert after widget |
| **Column selected** | Insert at page end | Insert into column |
| **Section selected** | Insert at page end | Insert into first column |
| **No selection** | Insert at page end | Insert at page end |
| **Working on Column #3** | Elements go to page end, need drag | Elements go directly to Column #3 ✅ |

---

## 🎬 Workflow Example

### Real-World Scenario

**Goal**: Add a CTA button after the hero heading

**Old Way**:
```
1. Open converter
2. Paste button HTML
3. Click insert
4. ❌ Button appears at page end
5. Scroll down
6. Find button
7. Drag it up to hero section
8. Drop after heading
9. 😫 10+ clicks
```

**New Way**:
```
1. Click hero heading
2. Open converter (Ctrl+Shift+H)
3. Paste button HTML
4. Click insert
5. ✅ Button appears right after heading!
6. 😊 Done in 3 clicks!
```

---

## 🔍 Debug Tips

### Check Selected Element

```javascript
// In browser console
const panel = elementor.getPanelView();
const currentPage = panel.getCurrentPageView();
const selected = currentPage.getOption('editedElementView');

console.log('Selected:', {
    type: selected?.getContainer().model.get('elType'),
    id: selected?.getContainer().id,
    index: selected?._index
});
```

### Check Container

```javascript
const container = selected.getContainer();
console.log('Container:', {
    type: container.model.get('elType'),
    id: container.id,
    parent: container.parent?.id,
    children: container.children?.length
});
```

### Check Panel Route

```javascript
console.log('Route:', $e.routes.getCurrent());
// Output: "panel/editor/..." = editing mode
```

---

## ✅ Summary

### What We Built

1. **Smart Container Detection**: Automatically find where user is working
2. **Context-Aware Insertion**: Insert based on element type
3. **Natural Workflow**: Matches Elementor's native behavior
4. **Console Logging**: Clear feedback about insertion location

### How It Works

```
1. User selects element (or not)
2. getTargetContainer() detects selection
3. Returns appropriate container + position
4. $e.run() inserts at correct location
5. Done! 🎉
```

### Files Modified

- ✅ `html-to-elementor-converter.js`: Added `getTargetContainer()` method
- ✅ Insert button: Updated to use smart container
- ✅ Console logging: Added debug info

---

**Now you can paste HTML and it goes EXACTLY where you want! 🎯**

---

**Created**: October 10, 2025  
**Feature**: Smart Insert with Context Detection  
**Status**: ✅ Production Ready
