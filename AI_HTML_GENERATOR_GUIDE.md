# 🎨 AI HTML Generator for Elementor

## 📋 Tổng Quan

**NEW FLOW**: AI generates HTML → HTML to Elementor Converter → Insert to page

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  User Input │ --> │ AI (OpenAI) │ --> │HTML→Elementor│ --> │   Insert    │
│  (Prompt)   │     │Generate HTML│     │  Converter  │     │  to Page    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

### 🎯 Mục Đích

Thay vì yêu cầu AI generate trực tiếp Elementor JSON (phức tạp, dễ sai), giờ:
1. **AI chỉ generate HTML** (đơn giản, chính xác)
2. **Dùng converter có sẵn** trong Angie để convert HTML → Elementor JSON
3. **Tận dụng được converter đã test kỹ** thay vì rely 100% vào AI

---

## 🚀 Cách Sử Dụng

### Bước 1: Mở AI Converter

**3 cách để mở:**

1. **Click nút RED** `</>` trên Elementor top bar
2. **Phím tắt**: `Ctrl + Shift + H`
3. **Console**: `showAngieAIConverter()`

### Bước 2: Describe What You Want

Không cần paste HTML! Chỉ cần mô tả:

```
✅ Examples:

"Create a hero section with title and call-to-action button"

"Generate a pricing table with 3 columns"

"Build a contact form with name, email, and message fields"

"Create a feature list with icons and descriptions"

"Make a testimonial section with customer quotes"

"Generate a newsletter signup form"
```

### Bước 3: Add Instructions (Optional)

Thêm yêu cầu cụ thể:

```
✅ Examples:

"Make it modern and clean"
"Use blue color scheme"
"Add hover animations"
"Include icons from Font Awesome"
"Make it mobile responsive"
```

### Bước 4: Generate & Insert

1. Click **"Generate with AI"**
2. Đợi AI generate HTML
3. System tự động convert HTML → Elementor
4. Review kết quả
5. Click **"Insert to Page"**

---

## 💡 How It Works

### Architecture Flow

```php
┌────────────────────────────────────────────────────────────────┐
│ STEP 1: User Input                                             │
│ "Create a hero section with title and button"                 │
└───────────────────────┬────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────────────┐
│ STEP 2: AI_Converter::generate_html_with_ai()                 │
│                                                                 │
│ System Prompt:                                                 │
│ "You are an HTML expert. Generate clean HTML..."              │
│                                                                 │
│ User Prompt:                                                   │
│ "Generate HTML for: Create a hero section..."                 │
│                                                                 │
│ OpenAI Response:                                               │
│ <section class="hero">                                         │
│   <h1>Welcome</h1>                                            │
│   <button>Get Started</button>                                │
│ </section>                                                     │
└───────────────────────┬────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────────────┐
│ STEP 3: Html_To_Elementor_Converter::parse_html_to_elements() │
│                                                                 │
│ Input: <section><h1>...</h1><button>...</button></section>   │
│                                                                 │
│ Parser:                                                        │
│ - Parse <section> → Container                                 │
│ - Parse <h1> → Heading Widget                                 │
│ - Parse <button> → Button Widget                              │
│                                                                 │
│ Output: Elementor JSON Array                                   │
│ [                                                              │
│   {                                                            │
│     "elType": "section",                                       │
│     "elements": [                                              │
│       {"widgetType": "heading", ...},                          │
│       {"widgetType": "button", ...}                            │
│     ]                                                          │
│   }                                                            │
│ ]                                                              │
└───────────────────────┬────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────────────┐
│ STEP 4: Insert to Elementor Editor                            │
│                                                                 │
│ JavaScript:                                                    │
│ $e.run('document/elements/create', {                          │
│   model: element,                                              │
│   container: selectedContainer                                 │
│ });                                                            │
└────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Technical Details

### Files Changed

#### 1. `ai-converter.php` (Backend)

**New Method: `generate_html_with_ai()`**

```php
private function generate_html_with_ai( $user_input, $context, $api_key, $endpoint, $model, $temperature ) {
    // Build prompts
    $system_prompt = $this->get_html_generation_prompt();
    $user_prompt = $this->build_html_user_prompt( $user_input, $context );

    // Call OpenAI
    $response = wp_remote_post( $endpoint . 'chat/completions', [...] );

    // Extract HTML from response
    $html = $body['choices'][0]['message']['content'];
    $html = $this->extract_html( $html );

    return $html;
}
```

**New System Prompt:**

```
You are an expert HTML/CSS developer.
Your task is to generate clean, semantic HTML code.

CRITICAL RULES:
1. Return ONLY valid HTML - no markdown
2. Use semantic HTML5 tags
3. Add appropriate CSS classes
4. Make it responsive and accessible
5. NO explanations, NO code blocks
```

**Updated `convert_html()` Method:**

```php
public function convert_html( $request ) {
    // Accept 'prompt' or 'html'
    $user_input = ! empty( $params['prompt'] ) 
        ? $params['prompt'] 
        : $params['html'];

    // Step 1: Generate HTML with AI
    $generated_html = $this->generate_html_with_ai( ... );

    // Step 2: Convert to Elementor
    $converter = new Html_To_Elementor_Converter();
    $elementor_elements = $converter->parse_html_to_elements( $generated_html );

    return [
        'success'       => true,
        'elements'      => $elementor_elements,
        'generated_html' => $generated_html
    ];
}
```

#### 2. `ai-elementor-integration.js` (Frontend)

**Updated Modal UI:**

```javascript
// Changed from "Paste HTML" to "Describe what you want"
<textarea 
    id="angie-prompt-input" 
    placeholder="Examples:
- Create a hero section with title and CTA button
- Generate a pricing table with 3 columns
- Build a contact form
..."
></textarea>
```

**Updated AJAX Call:**

```javascript
function convertWithAI(prompt, context) {
    $.ajax({
        url: wpApiSettings.root + 'angie/v1/ai-convert',
        method: 'POST',
        data: JSON.stringify({
            prompt: prompt,  // ← Changed from 'html'
            context: context
        }),
        success: function(response) {
            displayElements(
                response.elements, 
                response.generated_html  // ← Show HTML too
            );
        }
    });
}
```

**Enhanced Display:**

```javascript
function displayElements(elements, generatedHtml) {
    let html = `
        <!-- Show Generated HTML -->
        <div class="angie-html-preview">
            <strong>📝 Generated HTML:</strong>
            <button class="angie-copy-html-btn">Copy HTML</button>
            <pre>${generatedHtml}</pre>
        </div>

        <!-- Show Elementor JSON (collapsed by default) -->
        <div class="angie-json-preview">
            <strong>⚡ Elementor JSON:</strong>
            <button class="angie-toggle-json-btn">Show/Hide</button>
            <pre style="display: none;">${JSON.stringify(elements)}</pre>
        </div>
    `;
}
```

---

## 📊 Comparison: Old vs New

### ❌ Old Flow (Direct JSON Generation)

```
User HTML → AI generates Elementor JSON → Insert
```

**Problems:**
- ❌ AI phải hiểu cấu trúc JSON phức tạp của Elementor
- ❌ Dễ sai format, thiếu fields
- ❌ Khó debug khi lỗi
- ❌ Không tận dụng converter có sẵn
- ❌ Phụ thuộc hoàn toàn vào AI

### ✅ New Flow (HTML Generation + Converter)

```
User Prompt → AI generates HTML → Converter → Insert
```

**Benefits:**
- ✅ AI chỉ cần generate HTML (đơn giản, chính xác)
- ✅ Dùng converter đã test kỹ trong Angie
- ✅ Dễ debug: xem được HTML intermediate
- ✅ Tách biệt concerns: AI làm HTML, Converter làm Elementor
- ✅ User có thể paste HTML sẵn có hoặc describe

---

## 🎨 Examples

### Example 1: Hero Section

**Input:**
```
Prompt: "Create a hero section with headline and CTA button"
Context: "Modern design, blue color"
```

**AI Output (HTML):**
```html
<section class="hero">
  <h1>Transform Your Business Today</h1>
  <p>Discover the power of innovation</p>
  <a href="#" class="btn btn-primary">Get Started Now</a>
</section>
```

**Converter Output (Elementor JSON):**
```json
[
  {
    "id": "abc12345",
    "elType": "section",
    "elements": [
      {
        "id": "def67890",
        "elType": "column",
        "elements": [
          {
            "id": "ghi11111",
            "elType": "widget",
            "widgetType": "heading",
            "settings": {
              "title": "Transform Your Business Today",
              "header_size": "h1"
            }
          },
          {
            "id": "jkl22222",
            "elType": "widget",
            "widgetType": "text-editor",
            "settings": {
              "editor": "<p>Discover the power of innovation</p>"
            }
          },
          {
            "id": "mno33333",
            "elType": "widget",
            "widgetType": "button",
            "settings": {
              "text": "Get Started Now",
              "link": {"url": "#"}
            }
          }
        ]
      }
    ]
  }
]
```

### Example 2: Feature List

**Input:**
```
Prompt: "Generate a feature list with 3 items"
Context: "Include icons, modern style"
```

**AI Output:**
```html
<section class="features">
  <div class="feature-item">
    <h3>Fast Performance</h3>
    <p>Lightning-fast load times</p>
  </div>
  <div class="feature-item">
    <h3>Secure</h3>
    <p>Enterprise-grade security</p>
  </div>
  <div class="feature-item">
    <h3>Scalable</h3>
    <p>Grows with your business</p>
  </div>
</section>
```

**Result:** 3 Elementor heading + text widgets

---

## 🔍 Debugging

### Check Generated HTML

1. Open modal
2. Generate with AI
3. Look for **"📝 Generated HTML"** section
4. Click **"Copy HTML"** to inspect

### Check Console Logs

```javascript
// In browser console
console.log('Response:', response);
console.log('Generated HTML:', response.generated_html);
console.log('Elements:', response.elements);
```

### Common Issues

#### Issue 1: AI Returns Markdown

**Symptom:** HTML has ` ```html ` wrapper

**Solution:** `extract_html()` method removes markdown:

```php
private function extract_html( $response ) {
    $html = preg_replace( '/```html\s*/i', '', $response );
    $html = preg_replace( '/```\s*$/i', '', $html );
    return trim( $html );
}
```

#### Issue 2: Converter Fails

**Symptom:** `conversion_error` response

**Check:**
1. Is HTML valid?
2. Are there unsupported tags?
3. Check `Html_To_Elementor_Converter` logs

**Fallback:** Converter creates HTML widget for unknown tags

---

## 🎯 Best Practices

### For Users

✅ **DO:**
- Describe clearly what you want
- Use simple, natural language
- Add specific requirements in context
- Test with simple requests first

❌ **DON'T:**
- Make overly complex requests
- Expect pixel-perfect designs (AI generates structure)
- Forget to configure AI Settings first

### For Developers

✅ **DO:**
- Keep AI prompts focused on HTML generation
- Let converter handle Elementor structure
- Log intermediate steps for debugging
- Handle errors gracefully

❌ **DON'T:**
- Ask AI to generate Elementor JSON directly
- Assume AI output is always valid
- Skip HTML validation step
- Forget error handling

---

## 📚 API Reference

### REST Endpoint

```
POST /wp-json/angie/v1/ai-convert
```

**Request:**
```json
{
  "prompt": "Create a hero section",
  "context": "Modern design"
}
```

**Response:**
```json
{
  "success": true,
  "elements": [...],
  "generated_html": "<section>...</section>",
  "message": "HTML generated and converted to Elementor format"
}
```

**Error Response:**
```json
{
  "code": "missing_api_key",
  "message": "OpenAI API Key is not configured",
  "status": 400
}
```

---

## 🔄 Migration from Old Version

### If You Used Old Version

**Before (v1):**
```javascript
// User had to paste HTML
$('#angie-html-input').val('<div>...</div>');
```

**After (v2):**
```javascript
// User describes what they want
$('#angie-prompt-input').val('Create a hero section');

// OR still paste HTML (backward compatible)
$('#angie-prompt-input').val('<div>...</div>');
```

### Backward Compatibility

Code accepts both `prompt` and `html` parameters:

```php
$user_input = ! empty( $params['prompt'] ) 
    ? $params['prompt']      // New way
    : $params['html'];       // Old way (still works)
```

---

## 🎓 Tips & Tricks

### 1. Start Simple

```
✅ Good: "Create a button"
❌ Too complex: "Create a full landing page with 10 sections"
```

### 2. Be Specific

```
✅ Good: "Create a pricing table with 3 columns showing price, features, and CTA button"
❌ Vague: "Create a pricing thing"
```

### 3. Use Context Field

```
Prompt: "Create a contact form"
Context: "Include name, email, phone, message. Make it 2-column layout"
```

### 4. Iterate

Generate → Review → Describe changes → Regenerate

---

## 🚀 Future Enhancements

### Planned Features

1. **Style Presets**: "Make it in Material Design style"
2. **Template Library**: Save commonly used prompts
3. **Undo/Redo**: Regenerate with different parameters
4. **Batch Generation**: Multiple sections at once
5. **AI Refinement**: "Make this button bigger"

---

## 📞 Support

### Configuration Issues

1. Check AI Settings: `/wp-admin?page=angie-ai-settings`
2. Test connection with "Test Connection" button
3. Verify API key is valid

### Generation Issues

1. Check console for errors (F12)
2. Try simpler prompts
3. Check generated HTML in response
4. Verify converter is working

### Insert Issues

1. Select a container first (Section/Column)
2. Check Elementor is loaded
3. Look for console errors
4. Check `insertElements()` logs

---

**Version:** 2.0  
**Last Updated:** October 11, 2025  
**Status:** ✅ Production Ready

---

## 🎉 Summary

**New Flow = Better Results:**

1. 🤖 AI generates clean HTML
2. ⚡ Converter transforms to Elementor
3. 🎨 Insert to page
4. ✅ Done!

**Key Advantages:**
- Simpler AI prompts
- More reliable results
- Easier debugging
- Leverages existing converter
- Backward compatible

**Try it now:** `Ctrl + Shift + H` 🚀
