# 🤖 ANGIE AI HTML TO ELEMENTOR CONVERTER

## 📋 Tổng Quan

Chức năng này sử dụng **OpenAI API** để convert HTML thành Elementor JSON format, và tự động insert vào **container đang được chọn** trong Elementor Editor.

### ✨ Tính Năng Chính

1. ✅ **AI-Powered Conversion**: Sử dụng GPT-4 để parse HTML và generate exact Elementor JSON
2. ✅ **Smart Container Detection**: Tự động detect container đang được chọn (Column, Section, etc.)
3. ✅ **Custom OpenAI Endpoint**: Support OpenAI, Azure OpenAI, LocalAI, Ollama, và custom endpoints
4. ✅ **Context-Aware**: Có thể thêm context/instructions cho AI
5. ✅ **Multiple Access Points**: Button, keyboard shortcut, console API

---

## 🏗️ Kiến Trúc

```
┌─────────────────────────────────────────────────────────┐
│                   WORDPRESS BACKEND                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📁 components/                                          │
│  ├── ai-settings.php                                    │
│  │   → REST: /angie/v1/ai-settings (GET/POST)          │
│  │   → REST: /angie/v1/ai-settings/test (POST)         │
│  │                                                       │
│  ├── ai-converter.php                                   │
│  │   → REST: /angie/v1/ai-convert (POST)               │
│  │   → Calls OpenAI API                                 │
│  │                                                       │
│  └── ai-settings-page.php                               │
│      → Admin page: /wp-admin?page=angie-ai-settings     │
│                                                          │
└──────────────────────┬───────────────────────────────────┘
                       │
                       │ REST API
                       │
┌──────────────────────▼───────────────────────────────────┐
│              ELEMENTOR EDITOR (BROWSER)                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📁 assets/js/                                           │
│  ├── ai-elementor-integration.js                        │
│  │   → Modal UI                                          │
│  │   → Call REST API /ai-convert                        │
│  │   → Insert to selected container                     │
│  │                                                       │
│  ├── elementor-integration.js                           │
│  │   → Button in top bar                                │
│  │   → Keyboard shortcut (Ctrl+Shift+H)                 │
│  │                                                       │
│  └── ai-settings.js                                     │
│      → Settings page UI                                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Cài Đặt & Sử Dụng

### Bước 1: Configure OpenAI API

1. **Get API Key**:
   - Truy cập: https://platform.openai.com/api-keys
   - Tạo API key mới
   - Copy key (format: `sk-...`)

2. **Configure trong WordPress**:
   ```
   WP Admin → Angie → AI Settings
   ```

3. **Nhập thông tin**:
   - **API Key**: `sk-...` (required)
   - **Endpoint**: `https://api.openai.com/v1` (default)
   - **Model**: `gpt-4` (recommended)
   - **Temperature**: `0.7` (default)

4. **Test Connection**:
   - Click "Test Connection"
   - Verify: "✅ Connection Successful!"

5. **Save Settings**:
   - Click "Save Settings"

---

### Bước 2: Sử Dụng Converter

#### **Cách 1: Button trong Elementor Top Bar**

```
1. Open bất kỳ page nào với Elementor
2. Click vào element (Section, Column, Widget) muốn add content
3. Click button </>  màu ĐỎ ở top bar
4. Paste HTML vào modal
5. (Optional) Add context: "Make it responsive"
6. Click "Convert with AI"
7. Wait 3-5 seconds...
8. Click "Insert to Page"
```

**Kết quả**: Elements được insert vào container đang chọn!

---

#### **Cách 2: Keyboard Shortcut**

```
1. Select container trong Elementor
2. Press: Ctrl + Shift + H
3. Modal opens
4. Paste HTML & convert
```

---

#### **Cách 3: Console API**

```javascript
// Show modal
showAngieAIConverter();

// Get selected container
angieAI.getSelectedContainer();
```

---

## 📊 REST API Endpoints

### 1. Get/Update AI Settings

**GET** `/wp-json/angie/v1/ai-settings`

**Response**:
```json
{
  "success": true,
  "data": {
    "endpoint": "https://api.openai.com/v1",
    "model": "gpt-4",
    "temperature": 0.7,
    "has_api_key": true,
    "api_key_masked": "sk-ab****5678"
  }
}
```

**POST** `/wp-json/angie/v1/ai-settings`

**Body**:
```json
{
  "api_key": "sk-...",
  "endpoint": "https://api.openai.com/v1",
  "model": "gpt-4",
  "temperature": 0.7
}
```

---

### 2. Test Connection

**POST** `/wp-json/angie/v1/ai-settings/test`

**Response**:
```json
{
  "success": true,
  "message": "Connection successful!",
  "data": {
    "model": "gpt-4",
    "response": "Connection successful!"
  }
}
```

---

### 3. Convert HTML

**POST** `/wp-json/angie/v1/ai-convert`

**Body**:
```json
{
  "html": "<div><button>Click Here</button></div>",
  "context": "Make it responsive and add hover effects"
}
```

**Response**:
```json
{
  "success": true,
  "elements": [
    {
      "id": "abc12345",
      "elType": "widget",
      "widgetType": "button",
      "isInner": false,
      "isLocked": false,
      "settings": {
        "text": "Click Here",
        "link": {"url": "#", "is_external": "", "nofollow": ""},
        "align": "center",
        "size": "md"
      },
      "defaultEditSettings": {"defaultEditRoute": "content"},
      "elements": [],
      "editSettings": {"defaultEditRoute": "content"},
      "htmlCache": ""
    }
  ],
  "raw_response": "[{...}]"
}
```

---

## 🎯 Chức Năng "Insert to Selected Container"

### Cách Hoạt Động

1. **Detect Selected Container**:
   ```javascript
   const selection = elementor.selection.getElements();
   ```

2. **Get Container Info**:
   - **Type**: section, column, widget
   - **ID**: abc12345
   - **Label**: "Column #abc123"

3. **Display in Modal**:
   ```
   ℹ️ Working on: Column #abc123
   ```

4. **Insert Elements**:
   ```javascript
   $e.run('document/elements/create', {
       model: element,
       container: selectedContainer.view.getContainer(),
       options: {}
   });
   ```

---

### Container Types

| Type | Description | Use Case |
|------|-------------|----------|
| **Document** | Root container | Insert at page level |
| **Section** | Top-level container | Insert columns |
| **Column** | Inside section | Insert widgets |
| **Widget** | Element | Cannot insert here |

---

## 💡 Examples

### Example 1: Button

**HTML Input**:
```html
<button class="cta-btn">Get Started</button>
```

**Context**:
```
Make it primary color, large size, centered
```

**Result**:
```json
{
  "widgetType": "button",
  "settings": {
    "text": "Get Started",
    "align": "center",
    "size": "lg",
    "button_type": "primary"
  }
}
```

---

### Example 2: Hero Section

**HTML Input**:
```html
<div class="hero">
  <h1>Welcome to Our Site</h1>
  <p>Build amazing websites with ease</p>
  <button>Learn More</button>
</div>
```

**Context**:
```
Hero section with centered content
```

**Result**: Section → Column → 3 Widgets (heading, text, button)

---

### Example 3: Feature List

**HTML Input**:
```html
<ul>
  <li>Fast Performance</li>
  <li>Easy to Use</li>
  <li>24/7 Support</li>
</ul>
```

**Result**: Icon List widget with 3 items

---

## 🔧 Custom OpenAI Endpoints

### OpenAI (Default)
```
Endpoint: https://api.openai.com/v1
Model: gpt-4 | gpt-4-turbo | gpt-3.5-turbo
```

### Azure OpenAI
```
Endpoint: https://YOUR-RESOURCE.openai.azure.com/openai/deployments/YOUR-DEPLOYMENT
API Key: Azure API key
Model: gpt-4 (deployment name)
```

### LocalAI (Self-hosted)
```
Endpoint: http://localhost:8080/v1
API Key: (any value or empty)
Model: gpt-4 (or model name in LocalAI)
```

### Ollama (Local)
```
Endpoint: http://localhost:11434/v1
API Key: (any value)
Model: llama2 | mistral | codellama
```

---

## 🐛 Troubleshooting

### Issue 1: "API Key is not configured"

**Solution**:
```
1. Go to: Angie → AI Settings
2. Enter OpenAI API Key
3. Click "Save Settings"
4. Test connection
```

---

### Issue 2: "Connection failed"

**Causes**:
- ❌ Invalid API key
- ❌ Wrong endpoint URL
- ❌ Network/firewall issues
- ❌ API quota exceeded

**Solution**:
```
1. Verify API key at https://platform.openai.com/api-keys
2. Check endpoint URL (trailing slash not needed)
3. Test connection in AI Settings page
4. Check WordPress error logs
```

---

### Issue 3: "No container selected"

**Solution**:
```
1. Click vào một Section/Column trong Elementor
2. Check ℹ️ "Working on: ..." hiển thị container nào
3. Try again
```

---

### Issue 4: Button không xuất hiện

**Solution**:
```
1. Hard refresh: Ctrl + Shift + R
2. Check console: F12 → Console
3. Should see: "✅ Angie AI HTML Converter loaded!"
4. If not: Clear cache and reload
```

---

### Issue 5: Conversion takes too long

**Causes**:
- ⏱️ Large HTML input
- 🐌 Slow API response
- 🔄 Complex conversion

**Solution**:
```
1. Break HTML into smaller chunks
2. Try GPT-3.5-turbo (faster, cheaper)
3. Increase timeout in ai-converter.php (default: 60s)
```

---

## 📝 Code Structure

### PHP Components

**ai-settings.php**:
- Store/retrieve OpenAI API settings
- Test connection
- Secure API key storage

**ai-converter.php**:
- REST endpoint: `/ai-convert`
- Call OpenAI API
- Parse response
- Return Elementor JSON

**ai-settings-page.php**:
- Admin UI for settings
- Form handling
- Test connection UI

---

### JavaScript Files

**ai-elementor-integration.js**:
- Modal UI
- Container detection
- API calls
- Insert elements

**elementor-integration.js**:
- Button in top bar
- Keyboard shortcut
- Event handlers

**ai-settings.js**:
- Settings page UI
- AJAX calls
- Form validation

---

## 🔐 Security

### API Key Protection

1. ✅ Stored in WordPress options (encrypted database)
2. ✅ Never sent to frontend (only masked version)
3. ✅ REST API requires `manage_options` capability
4. ✅ Nonce verification on all requests

### Input Sanitization

1. ✅ HTML input sanitized before sending to AI
2. ✅ JSON response validated before insert
3. ✅ XSS protection on all outputs

---

## 🚀 Performance

### Optimization Tips

1. **Use GPT-3.5-turbo** for faster response (cheaper too)
2. **Cache common conversions** (future feature)
3. **Batch convert** multiple elements
4. **Optimize prompt** for shorter tokens

### Benchmarks

| Model | Speed | Cost | Quality |
|-------|-------|------|---------|
| GPT-4 | 5-10s | $$ | ⭐⭐⭐⭐⭐ |
| GPT-4-turbo | 3-5s | $$ | ⭐⭐⭐⭐⭐ |
| GPT-3.5-turbo | 1-3s | $ | ⭐⭐⭐⭐ |

---

## 📚 Advanced Usage

### Custom Context Examples

```
Context: "Make all text uppercase and bold"
Context: "Add icon before each list item"
Context: "Use brand colors: #92003B for primary"
Context: "Make it mobile-responsive with media queries"
Context: "Add hover animations"
```

---

### Batch Conversion

```javascript
// Convert multiple HTML snippets
const htmlArray = [
    '<h1>Title 1</h1>',
    '<p>Paragraph 1</p>',
    '<button>CTA 1</button>'
];

// Call API for each
for (const html of htmlArray) {
    await fetch('/wp-json/angie/v1/ai-convert', {
        method: 'POST',
        body: JSON.stringify({ html }),
        headers: { 'Content-Type': 'application/json' }
    });
}
```

---

## 🎓 Best Practices

### 1. Write Clear HTML

✅ **Good**:
```html
<div class="hero-section">
  <h1>Welcome</h1>
  <p>Description here</p>
</div>
```

❌ **Bad**:
```html
<div><div><div><h1>Welcome</h1></div></div></div>
```

---

### 2. Use Semantic HTML

✅ **Good**:
```html
<button>Click Here</button>
<h1>Main Title</h1>
```

❌ **Bad**:
```html
<div class="button">Click Here</div>
<div class="title">Main Title</div>
```

---

### 3. Add Context When Needed

```
✅ "Make button primary color, centered"
✅ "Hero section with background image"
✅ "Responsive 3-column layout"
```

---

## 🆕 What's New

### Version 1.0.0 (October 2025)

- ✨ Initial release
- ✅ OpenAI API integration
- ✅ Custom endpoint support
- ✅ Selected container detection
- ✅ AI Settings page
- ✅ Modal UI with preview
- ✅ Keyboard shortcuts
- ✅ REST API endpoints

---

## 🔮 Future Features

- [ ] **Conversion History**: Save and reuse conversions
- [ ] **Template Library**: Pre-made HTML templates
- [ ] **Bulk Import**: Convert entire pages
- [ ] **Style Preservation**: Better CSS parsing
- [ ] **Image Upload**: Auto-upload images to media library
- [ ] **AI Suggestions**: Get AI recommendations
- [ ] **Version Control**: Track changes

---

## 📞 Support

### Need Help?

1. Check this documentation first
2. Check console (F12) for errors
3. Test connection in AI Settings
4. Check WordPress error logs
5. Contact support

---

## 📄 License

Copyright © 2025 Angie Plugin  
All rights reserved.

---

**Created**: October 11, 2025  
**Version**: 1.0.0  
**Status**: Production Ready 🚀

---

## 🎉 Quick Start Checklist

- [ ] Get OpenAI API key
- [ ] Configure in AI Settings
- [ ] Test connection
- [ ] Open Elementor page
- [ ] Select container
- [ ] Click </>  button
- [ ] Paste HTML
- [ ] Convert with AI
- [ ] Insert to page
- [ ] 🎊 Done!

---

**Happy Converting! 🚀✨**
