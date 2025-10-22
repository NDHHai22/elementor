# 📡 Cơ chế giao tiếp giữa WordPress Angie Plugin và Next.js Iframe

## 🎯 Tổng quan kiến trúc

Dự án của bạn sử dụng **iframe messaging** để tích hợp ứng dụng Next.js vào WordPress plugin Angie. Đây là kiến trúc **parent-child communication** với hai bên:

```
┌─────────────────────────────────────────────────────────────┐
│  WordPress Admin/Frontend (Parent Window)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  🔌 Angie WordPress Plugin                           │   │
│  │  - PHP Backend (sidebar-html.php, angie-app.php)     │   │
│  │  - JavaScript (angie-element-detector.js)            │   │
│  └──────────────────────────────────────────────────────┘   │
│                         ↕️ postMessage API                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  <iframe id="angie-iframe">                          │   │
│  │    ⚛️ Next.js App (localhost:3030/angie)             │   │
│  │    - React Components (page.tsx)                     │   │
│  │    - Elementor Converter (lib/*.ts)                  │   │
│  │  </iframe>                                           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📍 1. Khởi tạo Iframe (Setup)

### 1.1. WordPress tạo HTML container

**File:** `angie/modules/sidebar/components/sidebar-html.php`

```php
// Line 100-108: Inject iframe trực tiếp vào HTML
<iframe 
    id='angie-iframe'
    src='http://localhost:3030/angie'
    style='width: 100%; height: 100%; border: none; display: block;'
    title='Angie AI Assistant'
    allow='clipboard-read; clipboard-write'
    sandbox='allow-scripts allow-same-origin allow-forms allow-popups allow-modals'
></iframe>
```

**Điểm quan trọng:**
- Iframe được tạo trực tiếp trong PHP (không đợi JavaScript)
- URL: `http://localhost:3030/angie` → Next.js development server
- Sandbox attributes cho phép scripts, forms, popups
- Quyền truy cập clipboard

### 1.2. Next.js khởi động và thông báo sẵn sàng

**File:** `nextjs/src/app/angie/page.tsx` (line 30-40)

```typescript
useEffect(() => {
  // 🚀 Thông báo cho parent window: "Tôi đã sẵn sàng!"
  const notifyParent = () => {
    if (window.parent !== window) {
      window.parent.postMessage(
        { 
          type: 'ANGIE_IFRAME_READY',
          timestamp: Date.now()
        },
        '*'
      );
      console.log('Sent ANGIE_IFRAME_READY to parent');
    }
  };

  notifyParent();
  setIsReady(true);
}, []);
```

---

## 🔄 2. Luồng giao tiếp hai chiều (Bidirectional Communication)

### 2.1. Parent → Iframe: WordPress gửi thông tin Elementor

**File:** `angie/modules/angie-app/assets/angie-element-detector.js`

#### A. Khởi tạo detector
```javascript
// Line 15-32: Tìm iframe và bắt đầu lắng nghe
function init() {
    iframe = document.getElementById('angie-iframe');
    
    // Lắng nghe tin nhắn TỪ iframe
    window.addEventListener('message', handleIframeMessage);
    
    // Bắt đầu theo dõi element được chọn
    startSelectionWatcher();
    
    // Gửi context ban đầu sau 1 giây
    setTimeout(() => {
        sendElementorContext();
    }, 1000);
}
```

#### B. Gửi thông tin context Elementor
```javascript
// Line 73-85: Gửi ELEMENTOR_CONTEXT
function sendElementorContext() {
    const context = {
        isElementorEditor: isElementorEditor(),  // Có phải editor không?
        selectedElement: getSelectedElement(),   // Element đang được chọn
    };

    iframe.contentWindow.postMessage({
        type: 'ELEMENTOR_CONTEXT',
        payload: context,
        timestamp: Date.now(),
    }, '*');
}
```

#### C. Theo dõi thay đổi selection (polling)
```javascript
// Line 220-237: Check mỗi 500ms
selectionCheckInterval = setInterval(() => {
    const element = getSelectedElement();
    const currentId = element ? element.id : null;

    // Chỉ gửi khi selection thay đổi
    if (currentId !== lastSelectedId) {
        lastSelectedId = currentId;
        sendSelectedElement();  // 🔔 Gửi ELEMENT_SELECTED
    }
}, 500);
```

#### D. Chi tiết element được chọn
```javascript
// Line 118-136: Lấy thông tin từ Elementor API
function getElementorSelectedElement() {
    const model = firstElement.model;
    
    return {
        id: model.get('id'),              // Element ID
        type: model.get('elType'),        // section/column/widget
        label: model.get('settings')?.get('_title'),
        widgetType: model.get('widgetType'),  // heading/button/etc
        settings: model.get('settings')?.attributes || {},
    };
}
```

### 2.2. Iframe → Parent: Next.js yêu cầu và nhận thông tin

**File:** `nextjs/src/app/angie/page.tsx`

#### A. Lắng nghe tin nhắn từ parent
```typescript
// Line 42-70: Message handler
const handleMessage = (event: MessageEvent) => {
  if (!event.data || typeof event.data !== 'object') return;

  switch (event.data.type) {
    case 'focusInput':
      // Parent yêu cầu focus input
      const input = document.querySelector('input');
      if (input) input.focus();
      break;

    case 'ELEMENTOR_CONTEXT':
      // ✅ Nhận thông tin context ban đầu
      setElementorContext(event.data.payload || {
        isElementorEditor: false,
        selectedElement: null,
      });
      break;

    case 'ELEMENT_SELECTED':
      // ✅ Nhận thông tin element được chọn
      setElementorContext(prev => ({
        ...prev,
        selectedElement: event.data.payload,
      }));
      break;
  }
};

window.addEventListener('message', handleMessage);
```

#### B. Yêu cầu context định kỳ
```typescript
// Line 74-84: Request context mỗi 5 giây
const requestElementorContext = () => {
  if (window.parent !== window) {
    window.parent.postMessage(
      { 
        type: 'GET_ELEMENTOR_CONTEXT',
        timestamp: Date.now()
      },
      '*'
    );
  }
};

// Gọi ngay và sau đó mỗi 5s
setTimeout(requestElementorContext, 500);
const contextInterval = setInterval(requestElementorContext, 5000);
```

---

## 📨 3. Các loại tin nhắn (Message Types)

### 3.1. Iframe → Parent Messages

| Message Type | Direction | Mục đích |
|-------------|-----------|----------|
| `ANGIE_IFRAME_READY` | Iframe → Parent | Thông báo iframe đã load xong |
| `GET_ELEMENTOR_CONTEXT` | Iframe → Parent | Yêu cầu thông tin context hiện tại |
| `GET_SELECTED_ELEMENT` | Iframe → Parent | Yêu cầu element đang được chọn |
| `INSERT_ELEMENTOR_ELEMENTS` | Iframe → Parent | Gửi elements để insert vào Elementor |
| `ANGIE_HEARTBEAT` | Iframe → Parent | Kiểm tra kết nối (optional) |

### 3.2. Parent → Iframe Messages

| Message Type | Direction | Payload | Mục đích |
|-------------|-----------|---------|----------|
| `ELEMENTOR_CONTEXT` | Parent → Iframe | `{isElementorEditor, selectedElement}` | Gửi context tổng thể |
| `ELEMENT_SELECTED` | Parent → Iframe | `{id, type, label, widgetType, settings}` | Element được chọn mới |
| `focusInput` | Parent → Iframe | - | Yêu cầu focus vào input |

---

## 🎨 4. Chức năng Converter (HTML ↔ Elementor JSON)

### 4.1. HTML → Elementor JSON

**File:** `nextjs/src/lib/html-to-json.ts`

```typescript
// Chuyển đổi HTML với inline CSS sang Elementor Atomic format
export function htmlToElementorJSON(html: string): ElementorElement[] {
  // Parse HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Convert từng element sang format Elementor v4
  // - Tạo e-div-block thay vì section/column
  // - Extract inline styles thành Atomic CSS classes
  // - Generate unique IDs
}
```

### 4.2. Elementor JSON → HTML

**File:** `nextjs/src/lib/json-to-html.ts`

```typescript
// Chuyển Elementor elements về HTML thuần
export function elementorJSONToHTML(elements: ElementorElement[]): string {
  return elements.map(el => {
    // Render từng element type
    if (el.elType === 'widget') {
      return renderWidget(el);
    }
    // Recursive cho nested elements
  }).join('');
}
```

### 4.3. Converter UI trong Next.js

**File:** `nextjs/src/app/angie/page.tsx` (line 130-220)

```typescript
// Tab "Converter" trong UI
const handleHTMLToJSON = () => {
  const elements = htmlToElementorJSON(htmlInput);
  setConvertedOutput(JSON.stringify(elements, null, 2));
};

const handleJSONToHTML = () => {
  const elements = JSON.parse(jsonInput);
  const html = elementorJSONToHTML(elements);
  setConvertedOutput(html);
};

// 🚀 Insert vào Elementor
const handleInsertToElementor = () => {
  const elements = JSON.parse(convertedOutput);
  
  window.parent.postMessage({
    type: 'INSERT_ELEMENTOR_ELEMENTS',
    payload: elements,
  }, '*');
};
```

---

## 🔒 5. Security & Sandbox

### 5.1. Iframe sandbox attributes

```html
sandbox='allow-scripts allow-same-origin allow-forms allow-popups allow-modals'
```

**Các quyền được cấp:**
- ✅ `allow-scripts`: Chạy JavaScript
- ✅ `allow-same-origin`: Truy cập localStorage, cookies (cùng origin)
- ✅ `allow-forms`: Submit forms
- ✅ `allow-popups`: Mở popups/windows
- ✅ `allow-modals`: Alert/confirm/prompt

### 5.2. PostMessage validation

```typescript
// Luôn kiểm tra event.data
if (!event.data || typeof event.data !== 'object') return;

// Kiểm tra origin trong production
// if (event.origin !== 'https://trusted-domain.com') return;
```

---

## 🎭 6. UI State Management

### 6.1. Hiển thị thông tin element đang chọn

```typescript
// Line 228-265 trong page.tsx
{elementorContext.selectedElement && (
  <div style={{ /* Fixed position info box */ }}>
    <span>🎯</span>
    <div>
      {elementorContext.selectedElement.label}
      <div>{elementorContext.selectedElement.type}</div>
    </div>
    <div>#{elementorContext.selectedElement.id}</div>
  </div>
)}
```

### 6.2. Chat Interface

- Messages state: `useState<Message[]>([])` 
- Auto-scroll: `useEffect` với `messagesEndRef`
- Input handling: `handleSendMessage()` + Enter key

### 6.3. Tabs Navigation

```typescript
type ActiveTab = 'chat' | 'converter';
const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
```

---

## 🔧 7. WordPress Integration Points

### 7.1. Enqueue scripts

**File:** `angie/modules/angie-app/components/angie-app.php` (line 144-151)

```php
wp_enqueue_script(
    'angie-element-detector',
    Utils::get_asset_url('angie-element-detector.js', __DIR__),
    [],
    ANGIE_VERSION,
    true  // Load in footer
);
```

### 7.2. Config injection

```php
wp_add_inline_script(
    'angie-app',
    'window.angieConfig = ' . wp_json_encode([
        'plugins' => $plugins,
        'postTypesNames' => $post_types_names,
        'version' => ANGIE_VERSION,
        'wpUsername' => $wp_username,
        'siteKey' => $site_key,
    ]),
    'before'
);
```

---

## 🐛 8. Debugging Tools

### 8.1. Console logs quan trọng

```javascript
// WordPress side
console.log('Sent Elementor context:', context);
console.log('Sent selected element:', element);

// Next.js side
console.log('Sent ANGIE_IFRAME_READY to parent');
console.log('Received message:', event.data);
```

### 8.2. Window globals cho debugging

```javascript
// angie-element-detector.js (line 282-287)
window.angieElementDetector = {
    getSelectedElement,
    isElementorEditor,
    sendElementorContext,
    sendSelectedElement,
};
```

Sử dụng trong console:
```javascript
// Trong WordPress console
window.angieElementDetector.getSelectedElement()
window.angieElementDetector.sendElementorContext()
```

---

## 🚀 9. Flow hoạt động hoàn chỉnh

### Kịch bản: User chọn một Heading widget trong Elementor

```
1. 👤 User clicks vào Heading widget trong Elementor Editor
   ↓
2. 📡 Elementor API cập nhật selection
   ↓
3. ⏰ angie-element-detector.js polling (500ms) phát hiện thay đổi
   ↓
4. 📤 WordPress gửi message:
   {
     type: 'ELEMENT_SELECTED',
     payload: {
       id: 'a1b2c3d',
       type: 'widget',
       label: 'My Heading',
       widgetType: 'heading',
       settings: {...}
     }
   }
   ↓
5. 📥 Next.js iframe nhận message
   ↓
6. ⚛️ React state update: setElementorContext()
   ↓
7. 🎨 UI re-render → Hiển thị info box:
   "🎯 My Heading | widget • heading | #a1b2c3d"
   ↓
8. 💬 User có thể chat với Angie về element này
```

---

## 🔄 10. Converter Flow

### Kịch bản: Convert HTML sang Elementor và insert

```
1. 👤 User paste HTML vào "HTML Input" trong tab Converter
   ↓
2. 🖱️ Click "HTML → JSON"
   ↓
3. 🔧 htmlToElementorJSON() xử lý:
   - Parse HTML với DOMParser
   - Extract inline styles
   - Tạo Atomic CSS classes
   - Generate Elementor element structure
   ↓
4. 📄 JSON hiển thị trong "Converted Output"
   ↓
5. 🖱️ User click "📤 Insert to Elementor"
   ↓
6. 📤 Next.js gửi message:
   {
     type: 'INSERT_ELEMENTOR_ELEMENTS',
     payload: [elementorElements...]
   }
   ↓
7. 📥 WordPress nhận message (TODO: cần implement handler)
   ↓
8. ⚡ Elementor API insert elements vào page
```

---

## ⚠️ 11. Known Issues & TODOs

### 11.1. Chưa implement

1. **WordPress không xử lý `INSERT_ELEMENTOR_ELEMENTS`**
   - Message được gửi nhưng chưa có handler
   - Cần implement trong `angie-element-detector.js`

2. **OAuth flow bị disable**
   - Line 313-325 trong `angie-app.php`: `is_oauth_flow_active()` luôn return false
   - Comment: "TEMPORARILY DISABLED FOR TESTING"

3. **AI Chat chưa kết nối backend**
   - Hiện tại chỉ là mock response
   - Line 103-110 trong `page.tsx`: "This is a demo response"

### 11.2. Performance concerns

1. **Polling mỗi 500ms** có thể tối ưu hơn bằng event listeners
2. **Request context mỗi 5s** có thể dùng WebSocket
3. **postMessage với origin='*'** nên hạn chế trong production

---

## 📚 12. Files Reference Map

### WordPress Plugin Files
```
angie/
├── modules/
│   ├── angie-app/
│   │   ├── components/
│   │   │   └── angie-app.php          # Main app page, config injection
│   │   └── assets/
│   │       └── angie-element-detector.js  # Core communication logic
│   └── sidebar/
│       └── components/
│           ├── sidebar-html.php        # Iframe container
│           └── sidebar-css-injector.php # Styles
```

### Next.js Files
```
nextjs/src/
├── app/angie/
│   └── page.tsx                # Main UI component
└── lib/
    ├── elementor-converter.ts  # Main converter
    ├── html-to-json.ts        # HTML → Elementor
    ├── json-to-html.ts        # Elementor → HTML
    └── elementor-types.ts     # TypeScript types
```

---

## 🎓 Kết luận

Cơ chế giao tiếp của bạn là một **well-designed iframe integration** với:

✅ **Strengths:**
- Bidirectional communication rõ ràng
- Type-safe với TypeScript
- UI responsive và user-friendly
- Modular architecture dễ maintain
- Debugging tools tốt

⚠️ **Needs improvement:**
- Implement INSERT_ELEMENTOR_ELEMENTS handler
- Optimize polling → event-driven
- Add origin validation cho postMessage
- Connect real AI backend
- Re-enable OAuth flow

🚀 **Next steps:**
1. Implement WordPress handler cho INSERT message
2. Test converter với real Elementor pages
3. Integrate AI API vào chat
4. Add error handling & retry logic
5. Production security hardening

---

📅 **Document created:** October 21, 2025  
📝 **Author:** GitHub Copilot  
🔄 **Last updated:** Based on current codebase analysis
