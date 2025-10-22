# 🔄 Angie HTML to JSON Converter - Integration Guide

## 📋 Tổng quan

Chức năng convert HTML sang Elementor JSON đã được tích hợp hoàn toàn với iframe Next.js. User có thể:
1. Paste HTML vào Next.js iframe
2. Convert sang Elementor JSON format
3. Click một nút để insert trực tiếp vào Elementor editor

---

## 🔧 Cơ chế hoạt động

### 1. Luồng xử lý HTML → JSON → Insert

```
┌─────────────────────────────────────────────────────────────┐
│  1. User paste HTML vào iframe                              │
│     <div style="background: blue; padding: 20px">           │
│       <h1>Hello World</h1>                                  │
│     </div>                                                  │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Next.js converter (client-side)                         │
│     - htmlToElementorJSON()                                 │
│     - Parse HTML với DOMParser                              │
│     - Extract inline styles                                 │
│     - Generate Elementor v4 Atomic format                   │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  3. JSON Output                                             │
│     [                                                       │
│       {                                                     │
│         "id": "a1b2c3d",                                    │
│         "elType": "e-div-block",                            │
│         "settings": {...},                                  │
│         "elements": [...]                                   │
│       }                                                     │
│     ]                                                       │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  4. User clicks "📤 Insert to Elementor"                    │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  5. PostMessage: INSERT_ELEMENTOR_ELEMENTS                  │
│     iframe → parent window                                  │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  6. WordPress handler (angie-element-detector.js)           │
│     - handleInsertElements()                                │
│     - Validate elements                                     │
│     - Get target container                                  │
│     - Insert via Elementor API                              │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  7. Response back to iframe                                 │
│     INSERT_ELEMENTS_RESPONSE                                │
│     { success: true, message: "..." }                       │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  8. Next.js shows success message                           │
│     ✅ Successfully inserted 1 element(s)                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Code Changes

### 1. WordPress Handler (angie-element-detector.js)

#### A. Message Handler
```javascript
case 'INSERT_ELEMENTOR_ELEMENTS':
    handleInsertElements(event.data.payload);
    break;
```

#### B. Insert Elements Function
```javascript
function handleInsertElements(elements) {
    // 1. Validate elements array
    if (!elements || !Array.isArray(elements)) {
        sendInsertResponse(false, 'Invalid elements format');
        return;
    }

    // 2. Check if in Elementor editor
    if (!isElementorEditor()) {
        sendInsertResponse(false, 'Not in Elementor editor');
        return;
    }

    // 3. Insert elements
    try {
        insertElementsToElementor(elements);
        sendInsertResponse(true, `Successfully inserted ${elements.length} element(s)`);
    } catch (error) {
        sendInsertResponse(false, error.message);
    }
}
```

#### C. Get Target Container
```javascript
function getTargetContainer() {
    // Try 1: Get selected container (section, column, etc.)
    const elements = elementor.selection.getElements();
    if (elements && elements.length > 0) {
        const elType = element.model.get('elType');
        const containerTypes = ['section', 'column', 'container', 'e-div-block'];
        if (containerTypes.includes(elType)) {
            return { model, view, id, type, label };
        }
    }

    // Try 2: Get document root
    const previewView = elementor.getPreviewView();
    return { model, view, id, type: 'document', label: 'Document Root' };
}
```

#### D. Insert Single Element
```javascript
function insertSingleElement(targetContainer, elementData, index) {
    // Method 1: Use $e.run command (Elementor v3.6+)
    if (window.$e && $e.run) {
        $e.run('document/elements/create', {
            container: targetContainer.model,
            model: elementData,
            options: { at: index, edit: false }
        });
    }
    
    // Method 2: Direct model creation (fallback)
    else if (targetContainer.model) {
        const collection = targetContainer.model.get('elements');
        collection.add(elementData, { at: index });
    }
}
```

### 2. Next.js Updates (page.tsx)

#### A. State Management
```typescript
const [insertStatus, setInsertStatus] = useState<{
  type: 'success' | 'error' | 'info' | null,
  message: string
}>({ type: null, message: '' });
```

#### B. Message Listener
```typescript
case 'INSERT_ELEMENTS_RESPONSE':
    const response = event.data.payload;
    if (response.success) {
        setInsertStatus({
            type: 'success',
            message: response.message || 'Elements inserted successfully!'
        });
        // Clear inputs after 2 seconds
        setTimeout(() => {
            setConvertedOutput('');
            setHtmlInput('');
            setJsonInput('');
        }, 2000);
    } else {
        setInsertStatus({
            type: 'error',
            message: response.message
        });
    }
    // Auto-clear after 5 seconds
    setTimeout(() => {
        setInsertStatus({ type: null, message: '' });
    }, 5000);
    break;
```

#### C. Insert Handler
```typescript
const handleInsertToElementor = () => {
    try {
        setInsertStatus({ type: 'info', message: '⏳ Inserting elements...' });
        
        const elements = JSON.parse(convertedOutput);
        
        if (!Array.isArray(elements)) {
            throw new Error('Invalid format: Expected array of elements');
        }

        window.parent.postMessage({
            type: 'INSERT_ELEMENTOR_ELEMENTS',
            payload: elements,
        }, '*');
        
        console.log('📤 Sent INSERT_ELEMENTOR_ELEMENTS:', elements);
    } catch (error) {
        setInsertStatus({
            type: 'error',
            message: `❌ ${error.message}`
        });
    }
};
```

#### D. UI Status Display
```tsx
{insertStatus.type && (
    <div style={{
        padding: '12px 16px',
        borderRadius: '8px',
        background: 
            insertStatus.type === 'success' ? '#d1fae5' :
            insertStatus.type === 'error' ? '#fee2e2' :
            '#dbeafe',
        color:
            insertStatus.type === 'success' ? '#065f46' :
            insertStatus.type === 'error' ? '#991b1b' :
            '#1e40af',
    }}>
        {insertStatus.message}
    </div>
)}
```

---

## 🧪 Testing Guide

### Test Case 1: Simple HTML with Styles

**Input HTML:**
```html
<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 8px;">
    <h2 style="color: white; margin-bottom: 16px;">Welcome to Angie</h2>
    <p style="color: #f0f0f0; font-size: 16px;">Your AI assistant for WordPress</p>
</div>
```

**Expected Output:**
- 1 e-div-block container
- 1 e-heading widget
- 1 e-paragraph widget
- Styles preserved in Atomic format

**Steps:**
1. Open Elementor editor
2. Open Angie sidebar (click Angie icon)
3. Go to "Converter" tab
4. Paste HTML in "HTML Input"
5. Click "HTML → JSON"
6. Verify JSON in output area
7. Select a container in Elementor (section/column)
8. Click "📤 Insert to Elementor"
9. Verify elements appear in editor

### Test Case 2: Complex Layout

**Input HTML:**
```html
<section style="padding: 60px 0; background: #f9fafb;">
    <div style="max-width: 1200px; margin: 0 auto;">
        <h1 style="text-align: center; font-size: 48px; margin-bottom: 20px;">Our Features</h1>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;">
            <div style="background: white; padding: 24px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <h3 style="color: #667eea;">Fast</h3>
                <p>Lightning quick performance</p>
            </div>
            <div style="background: white; padding: 24px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <h3 style="color: #667eea;">Secure</h3>
                <p>Enterprise-grade security</p>
            </div>
            <div style="background: white; padding: 24px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <h3 style="color: #667eea;">Scalable</h3>
                <p>Grows with your business</p>
            </div>
        </div>
    </div>
</section>
```

**Expected Output:**
- Nested container structure
- 3 card-like containers
- Proper grid layout styles
- Shadows and borders preserved

### Test Case 3: Error Handling

**Test scenarios:**

1. **Not in Elementor Editor**
   - Open Angie in WordPress admin (not Elementor)
   - Try to insert
   - Expected: "Not in Elementor editor" error

2. **Invalid JSON**
   - Paste malformed JSON
   - Try to insert
   - Expected: Parse error message

3. **No Container Selected**
   - Don't select any container
   - Try to insert
   - Expected: Inserts at document root (success)

4. **Widget Selected (not container)**
   - Select a widget (heading, button, etc.)
   - Try to insert
   - Expected: Falls back to document root

---

## 📊 Message Flow Diagram

```
┌─────────────────────┐                    ┌──────────────────────┐
│   Next.js Iframe    │                    │  WordPress Parent    │
│   (localhost:3030)  │                    │   (Elementor)        │
└──────────┬──────────┘                    └──────────┬───────────┘
           │                                           │
           │  1. ANGIE_IFRAME_READY                   │
           ├──────────────────────────────────────────>│
           │                                           │
           │                                           │
           │  2. ELEMENTOR_CONTEXT                    │
           │<──────────────────────────────────────────┤
           │  { isElementorEditor, selectedElement }  │
           │                                           │
           │                                           │
           │  3. ELEMENT_SELECTED (every 500ms)       │
           │<──────────────────────────────────────────┤
           │  { id, type, label, widgetType, ... }    │
           │                                           │
           │                                           │
           │  4. INSERT_ELEMENTOR_ELEMENTS            │
           ├──────────────────────────────────────────>│
           │  [elementData, elementData, ...]         │
           │                                           │
           │                                           │──┐
           │                                           │  │ Process:
           │                                           │  │ - Validate
           │                                           │  │ - Get container
           │                                           │  │ - Insert via API
           │                                           │<─┘
           │                                           │
           │  5. INSERT_ELEMENTS_RESPONSE             │
           │<──────────────────────────────────────────┤
           │  { success: true, message: "..." }       │
           │                                           │
           │──┐                                        │
           │  │ Update UI:                            │
           │  │ - Show success                        │
           │  │ - Clear inputs                        │
           │<─┘                                        │
           │                                           │
```

---

## 🎯 Key Features

### ✅ Implemented

1. **Client-side HTML parsing** (Next.js)
   - No server round-trip needed
   - Fast conversion
   - Real-time preview

2. **Elementor v4 Atomic format**
   - Uses e-div-block
   - Class-based styling
   - Typed values ($$type)
   - Responsive variants

3. **Smart container detection**
   - Auto-selects target
   - Falls back to document root
   - Validates container types

4. **Error handling**
   - Validation errors
   - Parse errors
   - Editor state checks
   - User-friendly messages

5. **UI feedback**
   - Status messages
   - Success/error states
   - Auto-clear on success
   - Loading states

### 🔄 Conversion Capabilities

**Supported HTML elements:**
- ✅ Containers: div, section, article, aside
- ✅ Headings: h1-h6
- ✅ Text: p, span, em, strong, etc.
- ✅ Images: img
- ✅ Buttons: button, a
- ✅ Lists: ul, ol, li

**Supported CSS properties:**
- ✅ Layout: display, width, height, padding, margin
- ✅ Background: color, gradient, image
- ✅ Typography: font-size, color, text-align, line-height
- ✅ Border: border, border-radius, box-shadow
- ✅ Flexbox: flex-direction, justify-content, align-items, gap
- ✅ Grid: grid-template-columns, gap
- ✅ Transform: translateX/Y, scale, rotate

---

## 🐛 Known Limitations

### 1. CSS Not Fully Supported
- Complex selectors (ignored)
- Pseudo-elements (limited)
- Animations (basic)
- Custom properties/variables

### 2. Elementor Specifics
- Some widgets require specific structure
- Forms need proper integration
- Dynamic content not converted

### 3. Browser Compatibility
- DOMParser required (all modern browsers ✅)
- PostMessage API required ✅

---

## 🚀 Future Enhancements

### Phase 1: Basic Improvements
- [ ] Add undo/redo support
- [ ] Better error messages with suggestions
- [ ] Validate output before insert
- [ ] Preview before insert

### Phase 2: Advanced Features
- [ ] Support external stylesheets parsing
- [ ] Responsive breakpoint conversion
- [ ] Custom widget mapping
- [ ] Batch conversion (multiple HTML blocks)

### Phase 3: AI Integration
- [ ] AI-powered HTML cleanup
- [ ] Smart widget detection
- [ ] Layout optimization suggestions
- [ ] SEO improvements

---

## 💡 Usage Tips

### 1. Best Practices

**For best results:**
- Use inline styles (not external CSS)
- Keep HTML structure simple
- Use semantic HTML tags
- Test with small sections first

**Example of good HTML:**
```html
<div style="padding: 20px; background: #f0f0f0;">
    <h2 style="color: #333;">Title</h2>
    <p style="font-size: 16px;">Text content</p>
</div>
```

**Avoid:**
```html
<div class="complex-class">  <!-- External CSS not supported -->
    <span onclick="alert()">  <!-- JavaScript not recommended -->
```

### 2. Debugging

**In Next.js console:**
```javascript
// Check converted output
console.log('Converted elements:', JSON.parse(convertedOutput));
```

**In WordPress console:**
```javascript
// Check detector
window.angieElementDetector.getSelectedElement()
window.angieElementDetector.isElementorEditor()

// Manual test insert
window.angieElementDetector.handleInsertElements([
    {
        id: 'test123',
        elType: 'e-heading',
        settings: {
            text: 'Test Heading'
        }
    }
])
```

### 3. Troubleshooting

**Problem: "Not in Elementor editor"**
- Solution: Make sure you're editing a page with Elementor

**Problem: Elements not appearing**
- Check console for errors
- Verify JSON format is valid
- Try selecting a different container

**Problem: Styles not applied**
- Inline styles should be present in HTML
- Check CSS property support list
- Some properties may need manual adjustment

---

## 📖 API Reference

### Messages

#### 1. INSERT_ELEMENTOR_ELEMENTS
**Direction:** Iframe → Parent  
**Payload:**
```typescript
{
    type: 'INSERT_ELEMENTOR_ELEMENTS',
    payload: Array<ElementorElement>
}
```

#### 2. INSERT_ELEMENTS_RESPONSE
**Direction:** Parent → Iframe  
**Payload:**
```typescript
{
    type: 'INSERT_ELEMENTS_RESPONSE',
    payload: {
        success: boolean,
        message: string
    }
}
```

### Functions

#### WordPress (angie-element-detector.js)

```javascript
// Handle insert request
handleInsertElements(elements: Array): void

// Send response to iframe
sendInsertResponse(success: boolean, message: string): void

// Get target container
getTargetContainer(): Object | null

// Insert single element
insertSingleElement(container: Object, elementData: Object, index: number): void
```

#### Next.js (page.tsx)

```typescript
// Convert HTML to JSON
handleHTMLToJSON(): void

// Convert JSON to HTML
handleJSONToHTML(): void

// Insert to Elementor
handleInsertToElementor(): void
```

---

## 📚 Related Files

### WordPress
- `angie/modules/angie-app/assets/angie-element-detector.js` - Main handler
- `angie/modules/elementor-core/components/atomic-html-converter.php` - PHP converter (backup)
- `angie/modules/elementor-core/assets/js/html-to-elementor-converter.js` - Old JS converter

### Next.js
- `nextjs/src/app/angie/page.tsx` - Main UI component
- `nextjs/src/lib/elementor-converter.ts` - Main converter
- `nextjs/src/lib/html-to-json.ts` - HTML parser
- `nextjs/src/lib/elementor-types.ts` - TypeScript types

---

## ✅ Testing Checklist

Before deploying to production:

- [ ] Test HTML → JSON conversion
- [ ] Test JSON → HTML conversion
- [ ] Test insert to empty page
- [ ] Test insert to existing content
- [ ] Test with section selected
- [ ] Test with column selected
- [ ] Test with widget selected (should fallback)
- [ ] Test with no selection (should use root)
- [ ] Test error messages display correctly
- [ ] Test success messages display correctly
- [ ] Test auto-clear after success
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test in Edge

---

📅 **Document created:** October 21, 2025  
👨‍💻 **Created by:** GitHub Copilot  
🔄 **Last updated:** Implementation complete
