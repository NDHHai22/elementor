# Phân Tích Cấu Trúc Iframe và OAuth Trong Ứng Dụng Angie

## 📋 Tổng Quan

Ứng dụng Angie là một AI assistant được tích hợp vào WordPress thông qua một **sidebar có iframe**. Hệ thống sử dụng OAuth để xác thực người dùng.

---

## 🖼️ CẤU TRÚC IFRAME

### 1. **Container HTML**
**File:** `angie-goc\modules\sidebar\components\sidebar-html.php`

```html
<div id='angie-sidebar-container'
     role='complementary'
     aria-label='Angie'
     aria-hidden='false/true'
     tabindex='-1'
     dir='ltr/rtl'>
    
    <!-- Loading state -->
    <div id='angie-sidebar-loading' aria-live='polite' class='angie-sr-only'>
        Loading Angie...
    </div>
    
    <!-- Iframe sẽ được inject vào đây bởi angie.umd.cjs -->
</div>
```

### 2. **Các Thành Phần Iframe**

#### **Script Chính**
- **URL:** `https://editor-static-bucket.elementor.com/angie.umd.cjs`
- **Load từ:** File `angie-goc\modules\angie-app\components\angie-app.php` (dòng 106-113)
- **Dependencies:** `wp-api-request`

#### **Data được truyền vào Iframe** (window.angieConfig):
```javascript
{
    plugins: {
        woocommerce: { isSingleProductEdit: boolean },
        elementor: {},
        elementor_pro: {}
    },
    postTypesNames: [], // Tất cả post types có show_in_rest = true
    version: ANGIE_VERSION,
    wpVersion: "WordPress version",
    wpUsername: "User display name",
    untrusted__wpUserRole: "User role", // CHỈ dùng cho analytics
    siteKey: "Elementor site key"
}
```

### 3. **Hàm Quản Lý Iframe**

**File nguồn:** `angie-goc\cnd\js\angie.umd.cjs`

#### **Tìm Iframe:**
```javascript
// Hàm tn() - Tìm và lưu cache iframe
let ms = null;
const tn = () => {
    if (!ms || !document.contains(ms)) {
        ms = document.querySelector('iframe[src*="angie/"]');
    }
    return ms;
}
```

#### **Gửi Message tới Iframe:**
```javascript
const ps = (message, targetOrigin) => {
    console.log("postMessageToAngieIframe", message, targetOrigin);
    const iframe = tn();
    
    if (!iframe?.contentWindow) return false;
    
    const origin = targetOrigin || (() => {
        const iframe = tn();
        if (!iframe) return null;
        
        try {
            return new URL(iframe.src).origin;
        } catch(error) {
            console.error("Error parsing iframe URL:", error);
            return null;
        }
    })();
    
    if (!origin) {
        console.error("Could not determine target origin for Angie iframe");
        return false;
    }
    
    iframe.contentWindow.postMessage(message, origin);
    return true;
}
```

---

## 🔐 CƠ CHẾ OAUTH

### 1. **Luồng OAuth Flow**

#### **Bước 1: Kiểm tra OAuth State**
**File:** `angie-goc\modules\angie-app\components\angie-app.php` (dòng 169-178)

```php
private function is_oauth_flow_active() {
    $is_oauth_return = isset($_GET['oauth_code']) || isset($_GET['oauth_state']);
    $is_oauth_starting = isset($_GET['start-oauth']);
    
    return [
        'is_starting' => $is_oauth_starting,
        'is_returning' => $is_oauth_return,
        'is_active' => $is_oauth_starting || $is_oauth_return,
    ];
}
```

#### **Bước 2: Các Parameters OAuth**
- `start-oauth=1` - Bắt đầu quá trình OAuth
- `oauth_code` - Authorization code trả về
- `oauth_state` - State token để bảo mật
- `oauth_error` - Lỗi nếu có

### 2. **Xử Lý OAuth trong JavaScript**

**File:** `angie-goc\cnd\js\angie.umd.cjs`

#### **Bắt đầu OAuth:**
```javascript
function hd() {
    const url = new URL(window.location.href);
    url.searchParams.set("start-oauth", "1");
    console.log("OAuth: Redirecting to wp-admin with OAuth:", url.toString());
    window.location.href = url.toString();
}
```

#### **Kiểm tra OAuth Flow:**
```javascript
function isInOAuthFlow() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('start-oauth') || 
           urlParams.has('oauth_code') || 
           urlParams.has('oauth_state') || 
           urlParams.has('oauth_error');
}
```

#### **Lắng nghe Message từ Iframe:**
```javascript
const Nv = () => {
    window.addEventListener("message", (event) => {
        if (event.origin === Bt.iframeUrlObject?.origin) {
            switch (event.data.type) {
                case "OAUTH_GET_CODE_AND_STATE":
                    const urlParams = new URLSearchParams(window.location.search);
                    const code = urlParams.get("oauth_code");
                    const state = urlParams.get("oauth_state");
                    
                    if (code && state) {
                        rn(event, { code, state }); // Gửi response thành công
                    } else {
                        Qa(event, { message: "No OAuth code or state found" });
                    }
                    break;
            }
        }
    });
}
```

### 3. **Xử Lý OAuth UI**

**File:** `angie-goc\modules\angie-app\components\angie-app.php` (dòng 199-216)

#### **Hiển thị Loading State:**
```php
<?php if ( $is_in_oauth_flow ) : ?>
    <div class="angie-loading-state" data-testid="angie-loading-state">
        <div class="angie-spinner"></div>
        <p class="angie-loading-text">
            <?php 
            if ( $is_oauth_starting && ! $is_oauth_return ) {
                esc_html_e( 'Redirecting to sign in...', 'angie' );
            } else {
                esc_html_e( 'Completing authentication...', 'angie' );
            }
            ?>
        </p>
    </div>
<?php endif; ?>
```

#### **Monitor OAuth Completion:**
```javascript
function monitorAuthCompletion() {
    let authenticationSuccessful = false;
    
    const checkInterval = setInterval(function() {
        const sidebar = document.getElementById('angie-sidebar-container');
        
        // Kiểm tra iframe đã load và OAuth params đã bị xóa
        if (sidebar?.querySelector('iframe') && isOAuthComplete()) {
            updateUIAfterAuth();
            clearInterval(checkInterval);
            authenticationSuccessful = true;
            openSidebarAfterAuth();
            window.location.reload(); // Reload để update MCPs
        }
    }, 500);
    
    // Timeout sau 30s
    setTimeout(function() {
        clearInterval(checkInterval);
        if (!authenticationSuccessful) {
            console.log('OAuth authentication timed out');
            ensureSidebarClosed();
        }
    }, 30000);
}
```

#### **Message từ Iframe về Authentication:**
```javascript
window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'ANGIE_USER_ALREADY_AUTHENTICATED') {
        console.log('User already authenticated, replacing loading with Toggle Angie');
        
        // Thay thế loading state bằng toggle button
        if (replaceLoadingWithToggle()) {
            // Mở sidebar sau 500ms
            setTimeout(() => {
                if (typeof window.toggleAngieSidebar === 'function') {
                    window.toggleAngieSidebar(true);
                }
            }, 500);
        }
    }
});
```

---

## 🎛️ QUẢN LÝ SIDEBAR

### 1. **Toggle Function**

**File:** `angie-goc\cnd\js\angie.umd.cjs`

```javascript
window.toggleAngieSidebar = function(forceOpen, skipTransition) {
    const body = document.body;
    const sidebar = document.getElementById("angie-sidebar-container");
    
    if (!sidebar) {
        console.warn("Angie Sidebar: Required elements not found!");
        return;
    }
    
    const isCurrentlyActive = body.classList.contains("angie-sidebar-active");
    const shouldBeOpen = forceOpen !== undefined ? forceOpen : !isCurrentlyActive;
    
    // Add transition class nếu không skip
    if (!skipTransition) {
        body.classList.add("angie-sidebar-transitioning");
        setTimeout(() => {
            body.classList.remove("angie-sidebar-transitioning");
        }, 300);
    }
    
    // Toggle active class
    if (shouldBeOpen) {
        body.classList.add("angie-sidebar-active");
    } else {
        body.classList.remove("angie-sidebar-active");
    }
    
    // Focus vào input khi mở
    if (shouldBeOpen) {
        setTimeout(() => {
            ps({ type: "focusInput" });
        }, skipTransition ? 0 : 300);
    }
    
    // Lưu state vào localStorage
    try {
        localStorage.setItem("angie_sidebar_state", shouldBeOpen ? "open" : "closed");
    } catch {
        console.warn("localStorage not available");
    }
    
    // Dispatch custom event
    const event = new CustomEvent("angieSidebarToggle", {
        detail: { isOpen: shouldBeOpen, sidebar, skipTransition }
    });
    document.dispatchEvent(event);
    
    // Post message tới iframe
    ps({
        type: "ANGIE_SIDEBAR_TOGGLED",
        payload: { state: shouldBeOpen ? "opened" : "closed" }
    });
}
```

### 2. **State Management**

#### **Lưu/Lấy State:**
```javascript
// Lấy state từ localStorage
function Ka() {
    return typeof window > "u" ? null : localStorage.getItem("angie_sidebar_state");
}

// Lưu state
function cd(state) {
    try {
        localStorage.setItem("angie_sidebar_state", state);
    } catch {
        console.warn("localStorage not available");
    }
}

// Lưu width
function Rv(width) {
    try {
        localStorage.setItem("angie_sidebar_width", width.toString());
    } catch {
        console.warn("localStorage not available");
    }
}

// Lấy width (default = 370px)
function ld() {
    if (typeof window > "u") return 370;
    
    try {
        const widthStr = window.localStorage.getItem("angie_sidebar_width");
        if (widthStr) {
            const width = parseInt(widthStr, 10);
            if (width >= 350 && width <= 590) {
                return width;
            }
        }
    } catch {
        console.warn("localStorage not available");
    }
    
    return 370; // Default width
}
```

#### **Initial State (PHP):**
```php
// File: sidebar-html.php
$default_state = get_option('angie_sidebar_default_state', 'open');
$is_open = 'open' === $default_state;

// Không mở sidebar nếu:
// 1. Đang trong iframe
// 2. Đang trong OAuth flow
$shouldBeOpen = (savedState || defaultState) === 'open' 
                && !isIframe 
                && !isInOAuthFlow;
```

### 3. **Resize Functionality**

**File:** `angie-goc\cnd\js\angie.umd.cjs`

```javascript
function Dv() {
    const sidebar = document.getElementById("angie-sidebar-container");
    if (!sidebar) return;
    
    let isResizing = false;
    let startX = 0;
    let startWidth = 0;
    
    sidebar.addEventListener("mousedown", (event) => {
        const rect = sidebar.getBoundingClientRect();
        const isRTL = document.documentElement.dir === "rtl";
        
        // Check if click is on resize handle (4px from edge)
        const isOnHandle = isRTL 
            ? event.clientX <= rect.left + 4 
            : event.clientX >= rect.right - 4;
        
        if (isOnHandle) {
            isResizing = true;
            startX = event.clientX;
            startWidth = rect.width;
            
            sidebar.classList.add("angie-resizing");
            document.body.style.cursor = "ew-resize";
            document.body.style.userSelect = "none";
            
            event.preventDefault();
            event.stopPropagation();
        }
    });
    
    document.addEventListener("mousemove", (event) => {
        if (!isResizing) return;
        
        const isRTL = document.documentElement.dir === "rtl";
        const delta = isRTL 
            ? startX - event.clientX 
            : event.clientX - startX;
        
        const newWidth = startWidth + delta;
        
        // Min: 350px, Max: 590px
        if (newWidth >= 350 && newWidth <= 590) {
            cd(newWidth); // Update CSS variable
            Rv(newWidth); // Save to localStorage
        }
    });
    
    document.addEventListener("mouseup", () => {
        if (isResizing) {
            isResizing = false;
            sidebar.classList.remove("angie-resizing");
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        }
    });
}
```

---

## 📡 MESSAGE COMMUNICATION

### 1. **Messages từ WordPress → Iframe**

```javascript
// Types of messages sent to iframe:
{
    type: "focusInput"
}

{
    type: "ANGIE_SIDEBAR_TOGGLED",
    payload: { state: "opened" | "closed" }
}

{
    type: "toggleAngieSidebar",
    payload: { 
        force: boolean,
        skipTransition: boolean 
    }
}
```

### 2. **Messages từ Iframe → WordPress**

```javascript
// Types of messages received from iframe:
{
    type: "ANGIE_USER_ALREADY_AUTHENTICATED"
}

{
    type: "OAUTH_GET_CODE_AND_STATE"
}

{
    type: "toggleAngieSidebar",
    payload: { 
        force: boolean,
        skipTransition: boolean 
    }
}
```

### 3. **Security - Origin Validation**

```javascript
window.addEventListener("message", (event) => {
    // CHỈ xử lý messages từ iframe origin được trust
    if (event.origin === Bt.iframeUrlObject?.origin) {
        // Process message...
    }
});
```

---

## 🎨 STYLING & CSS

### 1. **CSS Variables**

**File:** `angie-goc\modules\sidebar\assets\sidebar.css`

```css
:root {
    --angie-sidebar-z-index: 1200;
    --angie-sidebar-width: 330px;
    --angie-sidebar-transition: margin 0.3s ease-in-out, transform 0.3s ease-in-out;
    --angie-sidebar-hide-transform: translateX(-100%);
    --angie-sidebar-show-transform: translateX(0);
}

/* RTL Support */
[dir="rtl"] {
    --angie-sidebar-hide-transform: translateX(100%);
}

/* Admin Bar */
body.admin-bar {
    --angie-sidebar-z-index: 99999;
}
```

### 2. **Sidebar Container**

```css
#angie-sidebar-container {
    position: fixed;
    top: 0;
    inset-inline-start: 0;
    width: var(--angie-sidebar-width);
    height: 100vh;
    z-index: var(--angie-sidebar-z-index);
    background: #FCFCFC;
    transform: var(--angie-sidebar-hide-transform);
    outline: none;
    overflow: hidden;
}

/* Active state */
body.angie-sidebar-active #angie-sidebar-container {
    transform: var(--angie-sidebar-show-transform);
}

/* Resize handle */
#angie-sidebar-container::after {
    content: '';
    position: absolute;
    top: 0;
    inset-inline-end: 0;
    width: 4px;
    height: 100%;
    cursor: ew-resize;
    background: transparent;
    z-index: 1000001;
}

/* Resizing state */
#angie-sidebar-container.angie-resizing {
    border-inline-end-color: #ff69b4;
    border-inline-end-width: 2px;
}

/* Disable iframe pointer events during resize */
#angie-sidebar-container.angie-resizing iframe#editor-static-iframe {
    pointer-events: none;
}
```

### 3. **Body Layout khi Sidebar Active**

```css
@media (min-width: 768px) {
    body.angie-sidebar-active {
        padding-inline-start: var(--angie-sidebar-width);
    }
    
    body.angie-sidebar-active #wpadminbar {
        inset-inline-start: var(--angie-sidebar-width);
        inset-inline-end: 8px;
        width: calc(100% - 8px - var(--angie-sidebar-width));
        margin-top: 8px;
    }
    
    html.angie-sidebar-active {
        margin-inline-end: 8px;
    }
}
```

---

## 🔧 CONSENT MANAGEMENT

**File:** `angie-goc\modules\consent-manager\*`

### Kiểm tra Consent:
```php
// File: angie-app.php
if (!ConsentManager::has_consent()) {
    // Hiển thị consent notice
    return;
}

// Load scripts chỉ khi có consent
wp_enqueue_script('angie-app', ...);
```

---

## 📝 SUMMARY - LUỒNG HOẠT ĐỘNG CHÍNH

### **1. Khởi động:**
1. User vào WordPress admin
2. PHP render sidebar container (`#angie-sidebar-container`)
3. Load script `angie.umd.cjs` từ CDN
4. Script inject iframe vào container
5. Setup `window.toggleAngieSidebar` function

### **2. OAuth Flow:**
1. User click login trong iframe
2. Iframe send message `start-oauth`
3. WordPress redirect với `?start-oauth=1`
4. User được redirect đến OAuth provider
5. OAuth provider redirect về với `?oauth_code=xxx&oauth_state=yyy`
6. Iframe nhận code/state thông qua postMessage
7. Iframe xử lý authentication
8. Send message `ANGIE_USER_ALREADY_AUTHENTICATED`
9. WordPress remove loading state, show toggle button

### **3. Sidebar Toggle:**
1. User click toggle button
2. Call `window.toggleAngieSidebar()`
3. Toggle class `angie-sidebar-active` trên body
4. CSS transform sidebar vào/ra
5. Save state vào localStorage
6. Send message tới iframe về state change

### **4. Communication:**
- **WordPress ↔ Iframe:** postMessage API
- **Origin validation** để bảo mật
- **Bidirectional** communication
- **Event-driven** architecture

---

## 🛠️ DEBUG TIPS

### Console Commands:
```javascript
// Check iframe
tn(); // Get iframe element

// Check sidebar state
localStorage.getItem('angie_sidebar_state');
localStorage.getItem('angie_sidebar_width');

// Toggle sidebar manually
window.toggleAngieSidebar(true);  // Open
window.toggleAngieSidebar(false); // Close

// Send message to iframe
ps({ type: "focusInput" });

// Check OAuth flow
new URLSearchParams(window.location.search).get('oauth_code');
```

### Important Elements:
- `#angie-sidebar-container` - Sidebar wrapper
- `#angie-wrapper` - Content border overlay
- `#angie-body-top-padding` - Top spacing
- `.angie-sidebar-active` - Active state class
- `.angie-sidebar-transitioning` - Transition state

---

**📅 Ngày tạo:** October 18, 2025  
**👨‍💻 Người phân tích:** GitHub Copilot  
**📦 Version:** Angie Plugin for WordPress
