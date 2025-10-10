# Phân Tích Chuyển Đổi JSON Sang HTML Trong Elementor

## Tổng Quan

Tài liệu này phân tích chi tiết cách plugin Elementor chuyển đổi dữ liệu JSON thành HTML và cách plugin Angie tương tác với Elementor.

---

## PHẦN 1: KIẾN TRÚC CHUYỂN ĐỔI JSON SANG HTML TRONG ELEMENTOR

### 1.1. Luồng Dữ Liệu Tổng Thể

```
JSON Data (Database) → PHP Objects → HTML Output
     ↓                      ↓              ↓
_elementor_data    Elements Manager   Frontend Render
```

### 1.2. Các Thành Phần Chính

#### A. **Document Class** (`elementor/core/base/document.php`)

##### Chức năng chính:
- Quản lý toàn bộ document/page được xây dựng bởi Elementor
- Chứa các elements và settings của một trang
- Xử lý việc lưu trữ và truy xuất dữ liệu JSON

##### Các hàm quan trọng:

**1. `get_elements_data($status = self::STATUS_PUBLISH)`**
```php
/**
 * Lấy dữ liệu elements từ database (JSON format)
 * 
 * @param string $status - Trạng thái document (publish/draft)
 * @return array - Mảng dữ liệu elements
 */
```
- **Chức năng**: Đọc JSON từ post meta `_elementor_data`
- **Sử dụng**: `$this->get_json_meta(self::ELEMENTOR_DATA_META_KEY)`
- **Xử lý**: Kiểm tra autosave, draft versions
- **Kết quả**: Trả về array chứa cấu trúc elements

**2. `get_elements_raw_data($data = null, $with_html_content = false)`**
```php
/**
 * Chuyển đổi JSON data thành raw data với HTML cache
 * 
 * @param array|null $data - Dữ liệu elements (null = lấy từ DB)
 * @param bool $with_html_content - Có tạo HTML cache không
 * @return array - Mảng elements đã được xử lý
 * @throws Exception - Nếu data không hợp lệ
 */
```
- **Chức năng**: Xử lý và chuẩn bị data để render
- **Quy trình**:
  1. Lấy elements data từ database nếu `$data` null
  2. Switch context sang document hiện tại
  3. Tạo instance cho mỗi element
  4. Lấy raw data (có thể kèm HTML cache)
  5. Restore document context
- **Kết quả**: Array elements đã được process

**3. `save_elements($elements)`**
```php
/**
 * Lưu elements data vào database dưới dạng JSON
 * 
 * @param array $elements - Mảng elements cần lưu
 */
```
- **Chức năng**: Serialize elements và lưu vào DB
- **Quy trình**:
  1. Gọi `get_elements_raw_data()` để chuẩn bị data
  2. Convert thành JSON: `wp_json_encode($editor_data)`
  3. Escape cho database: `wp_slash()`
  4. Lưu vào meta: `update_metadata('post', ...)`
  5. Trigger các hooks after save
- **Meta Key**: `_elementor_data`

**4. `render_element($data)`**
```php
/**
 * Render một element thành HTML
 * 
 * @param array $data - Dữ liệu element
 * @return string - HTML output
 * @throws Exception - Nếu widget không tìm thấy
 */
```
- **Chức năng**: Render một element đơn lẻ
- **Quy trình**:
  1. Tạo element instance từ data
  2. Buffer output với `ob_start()`
  3. Gọi `$widget->render_content()`
  4. Lấy HTML từ buffer với `ob_get_clean()`
- **Kết quả**: HTML string của element

---

#### B. **Widget_Base Class** (`elementor/includes/base/widget-base.php`)

##### Chức năng chính:
- Base class cho tất cả widgets trong Elementor
- Xử lý rendering từ settings sang HTML

##### Các hàm quan trọng:

**1. `render_content()`**
```php
/**
 * Render nội dung widget ra HTML (frontend)
 * 
 * Abstract method - mỗi widget phải implement
 */
```
- **Chức năng**: Xuất HTML của widget ra frontend
- **Đặc điểm**: Protected method, được gọi bởi print_content()
- **Implement**: Mỗi widget có logic render riêng

**2. `get_raw_data($with_html_content = false)`**
```php
/**
 * Lấy dữ liệu thô của widget (JSON format)
 * 
 * @param bool $with_html_content - Có tạo HTML cache không
 * @return array - Data array của widget
 */
```
- **Chức năng**: Trả về data structure của widget
- **Xử lý**:
  1. Lấy data từ parent class
  2. Thêm `widgetType`
  3. Nếu `$with_html_content = true`:
     - Buffer với `ob_start()`
     - Gọi `render_content()`
     - Lưu vào `htmlCache` field
- **Sử dụng**: Khi export/import hoặc tạo cache

**3. `content_template()`**
```php
/**
 * Template cho editor (Backbone.js)
 * 
 * Tạo template JavaScript để render preview trong editor
 */
```
- **Chức năng**: Generate Underscore.js template
- **Sử dụng**: Live preview trong editor
- **Format**: JavaScript template với `<# #>` tags

**4. `print_unescaped_setting($setting, $repeater_name, $index)`**
```php
/**
 * Xuất setting content không escape
 * 
 * @param string $setting - Tên setting
 * @param string|null $repeater_name - Tên repeater field
 * @param int|null $index - Index trong repeater
 */
```
- **Chức năng**: Echo setting content trực tiếp
- **Bảo mật**: Cho phép HTML tags (dùng cho custom HTML)
- **Sử dụng**: Widgets cho phép custom code

---

#### C. **Frontend Class** (`elementor/includes/frontend.php`)

##### Chức năng chính:
- Quản lý toàn bộ rendering ở frontend
- Load scripts, styles cho widgets
- Xử lý the_content filter

##### Các hàm quan trọng:

**1. `init()`**
```php
/**
 * Khởi tạo frontend rendering
 * 
 * Hook vào template_redirect
 */
```
- **Chức năng**: Setup frontend environment
- **Xử lý**:
  1. Kiểm tra edit mode (skip nếu đang edit)
  2. Get document từ post ID
  3. Enqueue styles/scripts nếu là Elementor page
  4. Setup các hooks (wp_head, wp_footer)

**2. `get_builder_content($post_id, $with_css = false)`**
```php
/**
 * Lấy HTML content của Elementor page
 * 
 * @param int $post_id - ID của post
 * @param bool $with_css - Include inline CSS không
 * @return string - HTML content
 */
```
- **Chức năng**: Render toàn bộ page content
- **Quy trình**:
  1. Get document từ post ID
  2. Render từng element
  3. Wrap trong container
  4. Optional: add inline CSS

---

#### D. **Elements_Manager Class** (`elementor/includes/elements-manager.php`)

##### Chức năng chính:
- Factory pattern để tạo element instances
- Quản lý registry của tất cả element types

##### Các hàm quan trọng:

**1. `create_element_instance($element_data)`**
```php
/**
 * Tạo instance của element từ data array
 * 
 * @param array $element_data - Dữ liệu element từ JSON
 * @return Element_Base|null - Element instance hoặc null
 */
```
- **Chức năng**: Factory method tạo elements
- **Xử lý**:
  1. Xác định element type (section/column/widget)
  2. Lấy class tương ứng từ registry
  3. Tạo instance với settings
  4. Return element object
- **Sử dụng**: Khi deserialize JSON data

---

### 1.3. Cấu Trúc JSON Data

#### Format lưu trong database:

```json
[
  {
    "id": "abc123",
    "elType": "section",
    "settings": {
      "layout": "boxed",
      "gap": "default"
    },
    "elements": [
      {
        "id": "def456",
        "elType": "column",
        "settings": {
          "_column_size": 50
        },
        "elements": [
          {
            "id": "ghi789",
            "elType": "widget",
            "widgetType": "heading",
            "settings": {
              "title": "Hello World",
              "title_color": "#000000"
            }
          }
        ]
      }
    ]
  }
]
```

#### Các trường quan trọng:

- **`id`**: Unique identifier của element
- **`elType`**: Loại element (section/column/widget)
- **`widgetType`**: Type của widget (nếu elType = widget)
- **`settings`**: Object chứa tất cả settings
- **`elements`**: Array các child elements (nested structure)

---

### 1.4. Quy Trình Render Hoàn Chỉnh

#### A. Từ Database → HTML (Frontend)

```
1. WordPress loads post
   ↓
2. Frontend::init() detects Elementor page
   ↓
3. Document::get_elements_data() loads JSON from DB
   ↓
4. Elements_Manager::create_element_instance() for each element
   ↓
5. Element::render_content() generates HTML
   ↓
6. HTML output to browser
```

#### B. Từ Editor → Database (Saving)

```
1. User edits in editor (Backbone.js)
   ↓
2. Ajax request với elements data
   ↓
3. Document::save_elements() receives data
   ↓
4. Document::get_elements_raw_data() processes data
   ↓
5. wp_json_encode() converts to JSON
   ↓
6. update_metadata() saves to _elementor_data
```

---

### 1.5. HTML Cache System

#### Mục đích:
- Tăng tốc render lần sau
- Giảm CPU usage khi generate HTML

#### Cách hoạt động:

**1. Tạo cache:**
```php
// Trong get_raw_data()
if ( $with_html_content ) {
    ob_start();
    $this->render_content(); // Render HTML
    $data['htmlCache'] = ob_get_clean(); // Lưu vào data
}
```

**2. Sử dụng cache:**
- Cache được lưu cùng với elements data
- Khi load lại, có thể dùng cached HTML thay vì render lại
- Update khi settings thay đổi

---

### 1.6. Template System trong Editor

#### Backbone.js Templates:

**Format:**
```html
<script type="text/html" id="tmpl-elementor-widget-heading-content">
    <# 
    var title = settings.title;
    var tag = settings.html_tag;
    #>
    <{{{ tag }}} class="elementor-heading-title">
        {{{ title }}}
    </{{{ tag }}}>
</script>
```

**Cách hoạt động:**
1. Widget định nghĩa `content_template()`
2. Output JavaScript template với Underscore.js syntax
3. Editor compile template thành function
4. Live preview sử dụng template để render realtime
5. Không cần reload page khi thay đổi settings

---

## PHẦN 2: TƯƠNG TÁC CHI TIẾT GIỮA ANGIE VÀ ELEMENTOR

### 2.1. Kiến Trúc Tương Tác Tổng Quan

```
┌─────────────────────────────────────────────────────────────┐
│                      ANGIE PLUGIN                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         ElementorCore Module (Main Hub)              │  │
│  │  - Khởi tạo tích hợp với Elementor                   │  │
│  │  - Kiểm tra Elementor active                         │  │
│  │  - Inject scripts vào Elementor Editor               │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                   │
│                           ├──► Kit_Provider Component        │
│                           │    (REST API cho Kit Settings)   │
│                           │                                   │
│                           ├──► Elementor_Settings Component  │
│                           │    (REST API cho Post Types)     │
│                           │                                   │
│                           ├──► Sidebar Integration           │
│                           │    (UI trong Elementor Editor)   │
│                           │                                   │
│                           └──► Notifications Integration     │
│                                (Sử dụng WP Notifications)    │
│                                                               │
└───────────────────────────┬───────────────────────────────────┘
                            │
                            │ WordPress REST API
                            │ WordPress Hooks
                            │ Direct PHP Calls
                            │
┌───────────────────────────▼───────────────────────────────────┐
│                    ELEMENTOR PLUGIN                            │
├─────────────────────────────────────────────────────────────┤
│  • Kits Manager        → Quản lý theme settings              │
│  • Documents Manager   → Quản lý pages/templates             │
│  • Files Manager       → Cache management                    │
│  • Controls Manager    → Schema & validation                 │
│  • Fonts Manager       → Font configurations                 │
└─────────────────────────────────────────────────────────────┘
```

---

## PHẦN 2: TƯƠNG TÁC CHI TIẾT GIỮA ANGIE VÀ ELEMENTOR

### 2.1. Kiến Trúc Tích Hợp

```
Angie Plugin
    ├── ElementorCore Module (Quản lý tích hợp)
    │   └── Kit_Provider Component (API cho Kit settings)
    ├── AngieSettings Module
    │   └── Elementor_Settings Component (API cho Elementor config)
    └── Sidebar/Notifications Modules (UI integration)
```

---

### 2.2. Module ElementorCore - Hub Tích Hợp Chính

**File**: `angie/modules/elementor-core/module.php`

**Namespace**: `Angie\Modules\ElementorCore`

#### 🎯 Chức năng chính:
Module trung tâm quản lý toàn bộ tương tác giữa Angie và Elementor. Đây là điểm khởi đầu cho tất cả các tích hợp.

#### 📋 Code Structure Complete:

```php
<?php
namespace Angie\Modules\ElementorCore;

use Angie\Classes\Module_Base;
use Angie\Modules\ConsentManager\Module as ConsentManager;
use Angie\Plugin;
use Angie\Modules\ElementorCore\Components\Kit_Provider;
use Angie\Includes\Utils;

/**
 * Module `Elementor Editor`
 * 
 * Quản lý tích hợp với Elementor plugin
 */
class Module extends Module_Base {
    /**
     * Kit Provider controller
     * @var \Angie\Modules\ElementorCore\Components\Kit_Provider
     */
    public $kit_provider;
    
    /**
     * Trả về tên module
     * @return string
     */
    public function get_name(): string {
        return 'elementor-core';
    }
    
    /**
     * Kiểm tra module có active không
     * @return bool
     */
    public static function is_active(): bool {
        return ConsentManager::has_consent() 
            && Utils::is_plugin_active('elementor/elementor.php');
    }
    
    /**
     * Constructor - Khởi tạo module
     */
    protected function __construct() {
        // Khởi tạo REST controllers
        $this->init_rest_controllers();
        
        // Hook vào Elementor editor
        add_action('elementor/editor/after_enqueue_scripts', [$this, 'enqueue_scripts']);
        
        // Đăng ký Elementor với Angie MCP
        add_filter('angie_mcp_plugins', function($plugins) {
            $plugins['elementor'] = [];
            return $plugins;
        });
    }
    
    /**
     * Khởi tạo REST API controllers
     */
    private function init_rest_controllers() {
        $this->kit_provider = new Kit_Provider();
    }
    
    /**
     * Enqueue scripts vào Elementor Editor
     */
    public function enqueue_scripts() {
        // Get Angie App module
        $app_module = Plugin::instance()->modules_manager->get_modules('AngieApp');
        if (!$app_module) return;
        
        // Get Angie App component
        $app_component = $app_module->get_component('Angie_App');
        if (!$app_component) return;
        
        // Enqueue Angie scripts trong Elementor Editor
        $app_component->enqueue_scripts();
    }
}
```

#### 🔑 Các Method Chi Tiết:

**1. `get_name(): string`**
- **Chức năng**: Trả về unique identifier của module
- **Return**: `'elementor-core'`
- **Sử dụng**: Module manager tracking

**2. `is_active(): bool`**
- **Chức năng**: Kiểm tra điều kiện để module hoạt động
- **Điều kiện**:
  - ✅ User đã consent (GDPR compliance)
  - ✅ Elementor plugin được cài đặt và active
- **Return**: `true` nếu cả hai điều kiện thỏa mãn
- **Timing**: Checked trước khi load module

**3. `__construct()`**
- **Chức năng**: Khởi tạo module và đăng ký hooks
- **Actions**:
  1. Init REST controllers (Kit_Provider)
  2. Hook `elementor/editor/after_enqueue_scripts`
  3. Register với MCP plugins filter
- **Timing**: Khi Angie plugin loads

**4. `init_rest_controllers()`**
- **Chức năng**: Khởi tạo REST API components
- **Components**: 
  - `Kit_Provider` - API cho Elementor Kit settings
- **Purpose**: Expose Elementor data qua REST API

**5. `enqueue_scripts()`**
- **Chức năng**: Inject Angie UI vào Elementor Editor
- **Hook**: `elementor/editor/after_enqueue_scripts`
- **Process**:
  1. Get AngieApp module instance
  2. Get Angie_App component
  3. Call `enqueue_scripts()` để load Angie UI
- **Kết quả**: Angie sidebar/UI xuất hiện trong Elementor Editor

#### 🔌 WordPress Hooks được sử dụng:

**1. `elementor/editor/after_enqueue_scripts`**
```php
add_action('elementor/editor/after_enqueue_scripts', [$this, 'enqueue_scripts']);
```
- **Timing**: Sau khi Elementor editor enqueue scripts
- **Purpose**: Inject Angie scripts vào editor
- **Priority**: Default (10)

**2. `angie_mcp_plugins` filter**
```php
add_filter('angie_mcp_plugins', function($plugins) {
    $plugins['elementor'] = [];
    return $plugins;
});
```
- **Purpose**: Đăng ký Elementor với Angie's MCP (Model Context Protocol) system
- **Data**: Empty array (có thể extend với metadata)
- **Usage**: Angie biết Elementor available và có thể tương tác

---

### 2.3. Kit_Provider Component - REST API Bridge

### 2.3. Kit_Provider Component - REST API Bridge

**File**: `angie/modules/elementor-core/components/kit-provider.php`

**Namespace**: `Angie\Modules\ElementorCore\Components`

#### 🎯 Chức năng:
Component này cung cấp REST API để Angie có thể đọc và chỉnh sửa Elementor Global Settings (Kit). Đây là cầu nối chính giữa Angie và Elementor's theming system.

#### 🌐 REST API Endpoints:

##### **1. GET `/wp-json/angie/v1/elementor-kit`** - Lấy Kit Settings

```php
/**
 * Get Elementor kit settings
 * @return \WP_REST_Response|\WP_Error
 */
public function get_kit_settings() {
    // 1. Lấy Kits Manager từ Elementor
    $kits_manager = \Elementor\Plugin::$instance->kits_manager;
    $active_kit = $kits_manager->get_active_kit();
    
    if (!$active_kit) {
        return new \WP_Error('no_active_kit', 
            'No active Elementor kit found', 
            ['status' => 404]
        );
    }
    
    // 2. Lấy kit document
    $kit_id = $active_kit->get_id();
    $kit_document = \Elementor\Plugin::$instance->documents->get($kit_id);
    
    if (!$kit_document) {
        return new \WP_Error('kit_document_not_found', 
            'Kit document not found', 
            ['status' => 404]
        );
    }
    
    // 3. Lấy tất cả settings
    $saved_settings = $kit_document->get_settings();
    
    return \rest_ensure_response($saved_settings);
}
```

**Request:**
```http
GET /wp-json/angie/v1/elementor-kit HTTP/1.1
Host: your-site.com
X-WP-Nonce: <nonce>
```

**Response Example:**
```json
{
  "system_colors": [
    {"_id": "primary", "title": "Primary", "color": "#6EC1E4"},
    {"_id": "secondary", "title": "Secondary", "color": "#54595F"}
  ],
  "custom_colors": [
    {"_id": "custom1", "title": "Brand Blue", "color": "#1A73E8"}
  ],
  "system_typography": [
    {"_id": "primary", "title": "Primary", "typography_font_family": "Roboto"}
  ],
  "default_generic_fonts": "Sans-serif",
  "page_title_selector": "h1.entry-title",
  "container_width": {"unit": "px", "size": 1140},
  "content_width": {"unit": "px", "size": 800}
}
```

**Permission Required**: `edit_theme_options` (admin-level)

**Use Cases**:
- Angie UI cần hiển thị current theme colors
- Angie cần biết typography settings để suggest changes
- Export/Import theme settings

---

##### **2. POST `/wp-json/angie/v1/elementor-kit`** - Update Kit Settings

```php
/**
 * Update Elementor kit settings
 * @param \WP_REST_Request $request
 * @return \WP_REST_Response|\WP_Error
 */
public function update_kit_settings($request) {
    // 1. Get current kit
    $kits_manager = \Elementor\Plugin::$instance->kits_manager;
    $active_kit = $kits_manager->get_active_kit();
    $params = $request->get_json_params();
    
    if (!$active_kit) {
        return new \WP_Error('no_active_kit', 
            'No active Elementor kit found', 
            ['status' => 404]
        );
    }
    
    // 2. Get kit document
    $kit_id = $active_kit->get_id();
    $kit_document = \Elementor\Plugin::$instance->documents->get($kit_id);
    
    if (!$kit_document) {
        return new \WP_Error('kit_document_not_found', 
            'Kit document not found', 
            ['status' => 404]
        );
    }
    
    // 3. Merge settings (preserve existing, update new)
    $current_settings = $kit_document->get_settings();
    $merged_settings = array_merge($current_settings, $params);
    
    // 4. Save to database
    $kit_document->save([
        'settings' => $merged_settings,
    ]);
    
    // 5. Clear cache để changes reflect ngay
    $this->clear_elementor_cache();
    
    return \rest_ensure_response([
        'success' => true,
        'kit_id' => $kit_id,
        'message' => 'Site settings updated successfully',
        'updated_settings' => $params,
    ]);
}

/**
 * Clear Elementor cache after updates
 */
protected function clear_elementor_cache() {
    // Clear file cache (CSS, JS)
    \Elementor\Plugin::$instance->files_manager->clear_cache();
    
    // Clear kit CSS meta
    $kits_manager = \Elementor\Plugin::$instance->kits_manager;
    $active_kit = $kits_manager->get_active_kit();
    $kit_id = $active_kit->get_id();
    
    if ($kit_id) {
        \delete_post_meta($kit_id, '_elementor_css');
    }
}
```

**Request:**
```http
POST /wp-json/angie/v1/elementor-kit HTTP/1.1
Host: your-site.com
Content-Type: application/json
X-WP-Nonce: <nonce>

{
  "system_colors": [
    {"_id": "primary", "title": "Primary", "color": "#FF5733"}
  ],
  "container_width": {"unit": "px", "size": 1200}
}
```

**Response:**
```json
{
  "success": true,
  "kit_id": 123,
  "message": "Site settings updated successfully",
  "updated_settings": {
    "system_colors": [...],
    "container_width": {...}
  }
}
```

**Permission Required**: `edit_theme_options`

**Important Notes:**
- Settings được merge (không override toàn bộ)
- Cache được clear tự động
- Changes reflect ngay trên frontend

---

##### **3. GET `/wp-json/angie/v1/elementor-kit/schema`** - Lấy Control Schema

```php
/**
 * Get Elementor kit schema
 * @return \WP_REST_Response|\WP_Error
 */
public function get_elementor_kit_schema() {
    // 1. Enable style controls (for complete schema)
    \Elementor\Core\Frontend\Performance::set_use_style_controls(true);
    
    // 2. Get active kit
    $kit = \Elementor\Plugin::$instance->kits_manager->get_active_kit();
    $tabs = $kit->get_tabs();
    
    $tab_controls = new \stdClass();
    
    // 3. Clear cache để get fresh controls
    \Elementor\Plugin::$instance->controls_manager->clear_stack_cache();
    
    // 4. Loop through each tab
    foreach ($tabs as $tab_id => $tab) {
        // Delete stack để force re-register
        \Elementor\Plugin::$instance->controls_manager->delete_stack($kit);
        
        // Register controls for this tab
        $tab->register_controls();
        
        // Get all controls
        $tab_specific_controls = $kit->get_controls();
        
        $tab_controls->$tab_id = new \stdClass();
        
        // 5. Process each control
        foreach ($tab_specific_controls as $control_id => $control) {
            // Skip UI-only controls
            if ('section' === $control['type'] ||
                'heading' === $control['type'] ||
                'popover_toggle' === $control['type']) {
                continue;
            }
            
            // Process control schema
            $tab_controls->$tab_id->$control_id = 
                $this->process_control_schema($control);
        }
    }
    
    return \rest_ensure_response($tab_controls);
}

/**
 * Process control schema recursively
 * @param array $control
 * @return array
 */
private function process_control_schema($control) {
    $schema = [];
    
    // Basic properties
    if (!empty($control['label'])) {
        $schema['label'] = $control['label'];
    }
    if (!empty($control['type'])) {
        $schema['type'] = $control['type'];
    }
    if (!empty($control['default'])) {
        $schema['default'] = $control['default'];
    }
    if (!empty($control['options'])) {
        $schema['options'] = $control['options'];
    }
    
    // Handle nested fields (repeater)
    if (isset($control['fields']) && \is_array($control['fields'])) {
        $schema['fields'] = [];
        foreach ($control['fields'] as $field_id => $field) {
            $schema['fields'][$field_id] = 
                $this->process_control_schema($field);
        }
    }
    
    // Repeater-specific properties
    if ('repeater' === $control['type'] || isset($control['is_repeater'])) {
        $schema['title_field'] = $control['title_field'] ?? '';
        $schema['prevent_empty'] = $control['prevent_empty'] ?? true;
        $schema['max_items'] = $control['max_items'] ?? 0;
        $schema['min_items'] = $control['min_items'] ?? 0;
        $schema['item_actions'] = $control['item_actions'] ?? [];
    }
    
    return $schema;
}
```

**Request:**
```http
GET /wp-json/angie/v1/elementor-kit/schema HTTP/1.1
Host: your-site.com
X-WP-Nonce: <nonce>
```

**Response Example:**
```json
{
  "style": {
    "system_colors": {
      "label": "System Colors",
      "type": "repeater",
      "default": [],
      "fields": {
        "_id": {
          "label": "ID",
          "type": "text"
        },
        "title": {
          "label": "Title",
          "type": "text"
        },
        "color": {
          "label": "Color",
          "type": "color",
          "default": "#000000"
        }
      },
      "title_field": "{{{ title }}}",
      "prevent_empty": false
    },
    "container_width": {
      "label": "Container Width",
      "type": "slider",
      "default": {
        "unit": "px",
        "size": 1140
      },
      "options": {
        "px": {"min": 300, "max": 2000},
        "%": {"min": 50, "max": 100}
      }
    }
  },
  "typography": {
    "system_typography": {
      "label": "System Typography",
      "type": "repeater",
      "fields": {...}
    }
  }
}
```

**Permission Required**: `edit_theme_options`

**Use Cases:**
- **Dynamic Form Generation**: Angie tự động tạo UI form từ schema
- **Validation**: Biết data types và constraints
- **Auto-complete**: Suggest valid values
- **Documentation**: Hiểu structure của settings

---

##### **4. GET `/wp-json/angie/v1/elementor-kit/fonts`** - Lấy Fonts Data

```php
/**
 * Get all fonts available in Elementor
 * @return \WP_REST_Response|\WP_Error
 */
public function get_fonts() {
    try {
        // 1. Get fonts từ Elementor
        $fonts = \Elementor\Fonts::get_fonts();
        $font_groups = \Elementor\Fonts::get_font_groups();
        
        // 2. Get settings
        $response_data = [
            'fonts' => $fonts,
            'font_groups' => $font_groups,
            'google_fonts_enabled' => \Elementor\Fonts::is_google_fonts_enabled(),
            'font_display_setting' => \Elementor\Fonts::get_font_display_setting(),
            'total_fonts' => count($fonts),
        ];
        
        return \rest_ensure_response($response_data);
    } catch (\Exception $e) {
        return new \WP_Error(
            'fonts_fetch_error',
            'Failed to fetch fonts: ' . $e->getMessage(),
            ['status' => 500]
        );
    }
}
```

**Request:**
```http
GET /wp-json/angie/v1/elementor-kit/fonts HTTP/1.1
Host: your-site.com
X-WP-Nonce: <nonce>
```

**Response Example:**
```json
{
  "fonts": {
    "Roboto": "googlefonts",
    "Open Sans": "googlefonts",
    "Arial": "system",
    "Custom Font": "custom"
  },
  "font_groups": {
    "googlefonts": "Google Fonts",
    "system": "System Fonts",
    "custom": "Custom Fonts"
  },
  "google_fonts_enabled": true,
  "font_display_setting": "swap",
  "total_fonts": 1500
}
```

**Permission Required**: `edit_theme_options`

**Use Cases:**
- Font picker dropdown trong Angie UI
- Validate font selections
- Show available font groups

---

#### 🔐 Permission & Security:

**Permission Callback:**
```php
'permission_callback' => function() {
    return \current_user_can('edit_theme_options');
}
```

**Security Measures:**
- WordPress nonce verification (automatic với REST API)
- Capability check: `edit_theme_options` (admin-level)
- Data sanitization via Elementor's save methods
- Error handling với proper HTTP status codes

---

### 2.4. Elementor_Settings Component - Configuration API

**File**: `angie/modules/angie-settings/components/elementor-settings.php`

**Namespace**: `Angie\Modules\AngieSettings\Components`

#### 🎯 Chức năng:
Component này cung cấp thông tin về Elementor configuration, đặc biệt là post types được Elementor hỗ trợ.

#### 🌐 REST API Endpoints:

##### **GET `/wp-json/angie/v1/elementor-settings/supported-post-types`**

```php
/**
 * Get Elementor supported post types
 * @param \WP_REST_Request $request
 * @return \WP_REST_Response|\WP_Error
 */
public function get_supported_post_types($request) {
    // 1. Check Elementor is active
    if (!Utils::is_plugin_active('elementor/elementor.php')) {
        return new \WP_Error(
            'elementor_not_active',
            'Elementor plugin is not active',
            ['status' => 404]
        );
    }
    
    // 2. Get from WordPress option
    $supported_post_types = \get_option('elementor_cpt_support', false);
    
    // 3. If not set, detect automatically
    if (false === $supported_post_types) {
        $supported_post_types = $this->get_default_elementor_supported_post_types();
    }
    
    if (!is_array($supported_post_types)) {
        $supported_post_types = [];
    }
    
    return \rest_ensure_response($supported_post_types);
}

/**
 * Get default Elementor supported post types
 * @return array
 */
private function get_default_elementor_supported_post_types() {
    $all_post_types = \get_post_types(['public' => true], 'names');
    $supported_post_types = [];
    
    // 1. Check post type support feature
    foreach ($all_post_types as $post_type) {
        if (\post_type_supports($post_type, 'elementor')) {
            $supported_post_types[] = $post_type;
        }
    }
    
    // 2. Fallback: Check Elementor's document types
    if (empty($supported_post_types) && class_exists('\Elementor\Plugin')) {
        $elementor_settings = \Elementor\Plugin::$instance->documents->get_document_types();
        
        foreach ($elementor_settings as $document_type) {
            if (method_exists($document_type, 'get_post_type_title')) {
                $post_type = $document_type::get_post_type();
                if ($post_type && !in_array($post_type, $supported_post_types, true)) {
                    $supported_post_types[] = $post_type;
                }
            }
        }
    }
    
    return $supported_post_types;
}
```

**Request:**
```http
GET /wp-json/angie/v1/elementor-settings/supported-post-types HTTP/1.1
Host: your-site.com
X-WP-Nonce: <nonce>
```

**Response Example:**
```json
["page", "post", "product", "portfolio"]
```

**Permission Required**: `use_angie` (custom capability)

**Use Cases:**
- Angie cần biết post types nào có thể edit với Elementor
- Filter posts list trong Angie UI
- Determine editing capabilities

#### 🔍 Detection Logic:

1. **Preferred Method**: Đọc từ option `elementor_cpt_support`
2. **Fallback 1**: Check `post_type_supports($post_type, 'elementor')`
3. **Fallback 2**: Query Elementor's document types

---

### 2.5. Sidebar Integration - UI trong Editor

**Files**: 
- `angie/modules/sidebar/components/sidebar-admin-bar.php`
- `angie/modules/sidebar/components/sidebar-css-injector.php`
- `angie/modules/sidebar/components/sidebar-html.php`

#### 🎯 Chức năng:
Tích hợp Angie sidebar vào Elementor Editor interface, cho phép users truy cập Angie ngay trong khi edit với Elementor.

---

#### A. **Sidebar_Admin_Bar Component**

```php
<?php
namespace Angie\Modules\Sidebar\Components;

/**
 * Sidebar Admin Bar Component
 * Integrates sidebar toggle vào WordPress admin bar
 */
class Sidebar_Admin_Bar {
    
    public function __construct() {
        // WordPress admin bar
        add_action('admin_bar_menu', [$this, 'add_toggle_to_admin_bar'], 999);
        
        // Elementor editor (admin bar không fire ở đây)
        add_action('elementor/editor/init', function() {
            add_action('wp_footer', [$this, 'add_toggle_to_admin_bar']);
        });
    }
    
    /**
     * Check if should add to admin bar
     */
    private function should_add_to_admin_bar(): bool {
        if (!current_user_can('use_angie')) {
            return false;
        }
        
        if (!is_admin_bar_showing()) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Add toggle button
     * @param \WP_Admin_Bar|null $wp_admin_bar
     */
    public function add_toggle_to_admin_bar($wp_admin_bar): void {
        if (!$this->should_add_to_admin_bar()) {
            return;
        }
        
        if ($wp_admin_bar) {
            // Standard WordPress admin bar
            $wp_admin_bar->add_node([
                'id' => 'angie-sidebar-toggle',
                'title' => 'Toggle Angie',
                'href' => '#',
                'meta' => [
                    'class' => 'angie-sidebar-toggle-item',
                    'title' => 'Toggle Angie',
                ],
            ]);
        } else {
            // Elementor editor context
            echo '<div id="wp-admin-bar-angie-sidebar-toggle" 
                       class="angie-sidebar-toggle-item" 
                       style="display: none;">
                <a href="#" class="ab-item" title="Toggle Angie">Toggle Angie</a>
            </div>';
        }
    }
}
```

**Key Points:**
- **Hook**: `elementor/editor/init` để detect Elementor editor
- **Fallback**: Output HTML directly vì admin_bar_menu không fire trong editor
- **Permission**: Check `use_angie` capability
- **UI**: Toggle button trong admin bar

---

#### B. **Sidebar_CSS_Injector Component**

```php
<?php
namespace Angie\Modules\Sidebar\Components;

/**
 * Sidebar CSS Injector Component
 * Injects CSS cho sidebar với RTL support
 */
class Sidebar_Css_Injector {
    
    public function __construct() {
        // Admin pages
        add_action('admin_head', [$this, 'enqueue_css']);
        
        // Frontend
        add_action('wp_head', [$this, 'enqueue_css']);
        
        // Elementor editor
        add_action('elementor/editor/init', function() {
            add_action('wp_footer', [$this, 'enqueue_css']);
        });
    }
    
    public function enqueue_css() {
        $plugin_url = plugin_dir_url(__DIR__);
        wp_enqueue_style(
            'angie-sidebar-css',
            $plugin_url . 'assets/sidebar.css',
            [],
            ANGIE_VERSION
        );
    }
}
```

**Key Points:**
- **Multi-context**: Admin, Frontend, và Elementor Editor
- **Hook timing**: `wp_footer` trong Elementor để ensure proper load order
- **Versioning**: Use ANGIE_VERSION để cache busting

---

#### C. **Sidebar_HTML Component**

```php
<?php
namespace Angie\Modules\Sidebar\Components;

/**
 * Sidebar HTML Component
 * Outputs sidebar HTML structure
 */
class Sidebar_Html {
    
    public function __construct() {
        // Hook vào Elementor editor
        add_action('elementor/editor/init', function() {
            add_action('wp_footer', [$this, 'render_sidebar_html']);
        });
    }
    
    public function render_sidebar_html() {
        // Output sidebar container HTML
        // JavaScript sẽ mount Angie app vào đây
    }
}
```

---

#### 🔌 WordPress Hooks Summary:

| Hook | Component | Timing | Purpose |
|------|-----------|--------|---------|
| `elementor/editor/init` | Sidebar_Admin_Bar | Editor loads | Add toggle button |
| `elementor/editor/init` | Sidebar_CSS_Injector | Editor loads | Inject styles |
| `elementor/editor/init` | Sidebar_Html | Editor loads | Output HTML structure |
| `wp_footer` | All | Footer | Actual rendering trong editor |

**Tại sao dùng `wp_footer` thay vì inject trực tiếp?**
- Elementor editor có custom rendering pipeline
- `admin_bar_menu` hook không fire trong editor
- `wp_footer` đảm bảo tất cả dependencies đã loaded

---

### 2.6. Notifications Integration

**File**: `angie/modules/notifications/module.php`

**Namespace**: `Angie\Modules\Notifications`

#### 🎯 Chức năng:
Sử dụng Elementor's WPNotifications package để hiển thị notifications trong Angie, đảm bảo UI consistency.

#### Code Structure:

```php
<?php
namespace Angie\Modules\Notifications;

use Angie\Classes\Module_Base;
use Elementor\WPNotificationsPackage\V120\Notifications;

/**
 * Notifications Module
 * Sử dụng Elementor's WPNotifications package
 */
class Module extends Module_Base {
    
    /**
     * @var Notifications|null
     */
    public ?Notifications $notifications = null;
    
    public function get_name(): string {
        return 'notifications';
    }
    
    /**
     * Check if module should be active
     */
    public static function is_active(): bool {
        return is_admin() 
            && class_exists('Elementor\WPNotificationsPackage\V120\Notifications');
    }
    
    public function __construct() {
        $this->init_notifications();
    }
    
    /**
     * Initialize WPNotifications package
     */
    private function init_notifications() {
        // Double check class exists
        if (!class_exists('Elementor\WPNotificationsPackage\V120\Notifications')) {
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('Angie: WPNotifications package not found');
            }
            return;
        }
        
        try {
            $this->notifications = new Notifications([
                'app_name' => 'angie',
                'app_version' => ANGIE_VERSION,
                'short_app_name' => 'angie',
                'app_data' => [
                    'plugin_basename' => plugin_basename(ANGIE_PATH . 'angie.php'),
                ],
            ]);
        } catch (\Exception $e) {
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('Angie: Failed to init notifications - ' . $e->getMessage());
            }
        }
    }
    
    /**
     * Get notifications instance
     */
    public function get_notifications(): ?Notifications {
        return $this->notifications;
    }
    
    /**
     * Check if notifications available
     */
    public function has_notifications(): bool {
        return null !== $this->notifications;
    }
}
```

#### 🔑 Key Features:

**1. Conditional Loading:**
```php
public static function is_active(): bool {
    return is_admin() 
        && class_exists('Elementor\WPNotificationsPackage\V120\Notifications');
}
```
- Chỉ load khi Elementor có WPNotifications package
- Graceful degradation nếu package không có

**2. Configuration:**
```php
new Notifications([
    'app_name' => 'angie',              // Full name
    'app_version' => ANGIE_VERSION,     // Version tracking
    'short_app_name' => 'angie',        // Display name
    'app_data' => [
        'plugin_basename' => '...'      // For WordPress integration
    ],
])
```

**3. Usage Example:**
```php
// Get notifications instance
$notifications_module = Plugin::instance()->modules_manager->get_modules('Notifications');
if ($notifications_module && $notifications_module->has_notifications()) {
    $notifications = $notifications_module->get_notifications();
    
    // Show notification
    $notifications->add([
        'id' => 'angie-update-success',
        'title' => 'Settings Updated',
        'message' => 'Your theme settings have been updated successfully.',
        'type' => 'success',
    ]);
}
```

**Benefits:**
- ✅ Consistent UI/UX với Elementor
- ✅ Proven, tested notification system
- ✅ No need to build from scratch
- ✅ Auto-styling và behavior

---

### 2.7. Data Flow: Angie ↔ Elementor - Các Luồng Tương Tác Chi Tiết

#### 📊 Scenario 1: Angie Đọc Elementor Kit Settings

**Use Case**: User mở Angie UI, Angie cần hiển thị current theme colors/fonts

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER ACTION                                                  │
│    User clicks "Open Angie" button in Elementor Editor         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. ANGIE FRONTEND (JavaScript)                                  │
│    const response = await fetch(                                │
│      '/wp-json/angie/v1/elementor-kit',                        │
│      { headers: { 'X-WP-Nonce': wpApiSettings.nonce } }        │
│    );                                                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. WORDPRESS REST API                                           │
│    - Verify nonce                                               │
│    - Check permissions: current_user_can('edit_theme_options') │
│    - Route to Kit_Provider::get_kit_settings()                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. ANGIE - Kit_Provider Component                               │
│    $kits_manager = \Elementor\Plugin::$instance->kits_manager; │
│    $active_kit = $kits_manager->get_active_kit();              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. ELEMENTOR - Kits Manager                                     │
│    - Get active kit ID from option 'elementor_active_kit'      │
│    - Return Kit Document instance                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. ELEMENTOR - Documents Manager                                │
│    $kit_document = Plugin::$instance->documents->get($kit_id); │
│    $settings = $kit_document->get_settings();                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. WORDPRESS DATABASE                                           │
│    SELECT meta_value FROM wp_postmeta                           │
│    WHERE post_id = $kit_id                                      │
│    AND meta_key = '_elementor_data'                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼ (JSON Data)
┌─────────────────────────────────────────────────────────────────┐
│ 8. RESPONSE BACK TO ANGIE                                       │
│    {                                                            │
│      "system_colors": [...],                                   │
│      "custom_colors": [...],                                   │
│      "system_typography": [...],                               │
│      "container_width": {"unit": "px", "size": 1140}          │
│    }                                                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 9. ANGIE FRONTEND RENDERING                                     │
│    - Parse settings data                                        │
│    - Render color picker với current colors                    │
│    - Render typography controls với current fonts              │
│    - User sees current theme settings                          │
└─────────────────────────────────────────────────────────────────┘
```

**Timing**: ~100-300ms (depends on DB query)

**Code Example:**
```javascript
// Angie Frontend
async function loadElementorSettings() {
  try {
    const response = await fetch('/wp-json/angie/v1/elementor-kit', {
      headers: {
        'X-WP-Nonce': wpApiSettings.nonce
      }
    });
    
    const settings = await response.json();
    
    // Render UI với settings
    renderColorPicker(settings.system_colors);
    renderTypographyControls(settings.system_typography);
    
  } catch (error) {
    console.error('Failed to load Elementor settings:', error);
  }
}
```

---

#### 📊 Scenario 2: Angie Update Elementor Settings

**Use Case**: User thay đổi primary color từ #6EC1E4 sang #FF5733 trong Angie UI

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER ACTION                                                  │
│    User changes color in Angie color picker                     │
│    Old: #6EC1E4 → New: #FF5733                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. ANGIE FRONTEND (JavaScript)                                  │
│    const response = await fetch(                                │
│      '/wp-json/angie/v1/elementor-kit',                        │
│      {                                                          │
│        method: 'POST',                                          │
│        headers: {                                               │
│          'Content-Type': 'application/json',                   │
│          'X-WP-Nonce': wpApiSettings.nonce                     │
│        },                                                       │
│        body: JSON.stringify({                                  │
│          system_colors: [                                      │
│            {_id: 'primary', title: 'Primary', color: '#FF5733'}│
│          ]                                                      │
│        })                                                       │
│      }                                                          │
│    );                                                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. WORDPRESS REST API                                           │
│    - Verify nonce                                               │
│    - Check permissions: current_user_can('edit_theme_options') │
│    - Parse JSON body                                            │
│    - Route to Kit_Provider::update_kit_settings($request)      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. ANGIE - Kit_Provider::update_kit_settings()                  │
│    $params = $request->get_json_params();                      │
│    $kits_manager = \Elementor\Plugin::$instance->kits_manager; │
│    $active_kit = $kits_manager->get_active_kit();              │
│    $kit_document = Plugin::$instance->documents->get($kit_id); │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. MERGE SETTINGS                                               │
│    $current_settings = $kit_document->get_settings();          │
│    $merged_settings = array_merge($current_settings, $params); │
│                                                                 │
│    Before: system_colors[0].color = '#6EC1E4'                  │
│    After:  system_colors[0].color = '#FF5733'                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. ELEMENTOR - Document::save()                                 │
│    $kit_document->save([                                        │
│      'settings' => $merged_settings                            │
│    ]);                                                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. WORDPRESS DATABASE - UPDATE                                  │
│    UPDATE wp_postmeta                                           │
│    SET meta_value = '{"system_colors":[...]}'                  │
│    WHERE post_id = $kit_id                                      │
│    AND meta_key = '_elementor_data'                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. CLEAR CACHE                                                  │
│    Kit_Provider::clear_elementor_cache()                        │
│    - Plugin::$instance->files_manager->clear_cache()           │
│    - delete_post_meta($kit_id, '_elementor_css')               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 9. RESPONSE TO ANGIE                                            │
│    {                                                            │
│      "success": true,                                          │
│      "kit_id": 123,                                            │
│      "message": "Site settings updated successfully",          │
│      "updated_settings": {...}                                 │
│    }                                                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 10. ANGIE FRONTEND                                              │
│     - Show success notification                                 │
│     - Update UI với new color                                   │
│     - Elementor frontend auto-regenerates CSS với new color    │
└─────────────────────────────────────────────────────────────────┘
```

**Timing**: ~200-500ms (includes DB write + cache clear)

**Important Notes:**
- Settings được **merge** không phải replace
- Cache **phải** được clear để changes reflect ngay
- CSS sẽ được regenerate khi frontend loads lần sau

**Code Example:**
```javascript
// Angie Frontend
async function updateColor(colorId, newColor) {
  try {
    const response = await fetch('/wp-json/angie/v1/elementor-kit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-WP-Nonce': wpApiSettings.nonce
      },
      body: JSON.stringify({
        system_colors: [{
          _id: colorId,
          color: newColor
        }]
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      showNotification('Color updated successfully!', 'success');
      updateUIColor(colorId, newColor);
    }
    
  } catch (error) {
    showNotification('Failed to update color', 'error');
  }
}
```

---

#### 📊 Scenario 3: Schema Discovery - Dynamic Form Generation

**Use Case**: Angie cần tạo form tự động cho tất cả Elementor settings

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. ANGIE INITIALIZATION                                         │
│    Angie needs to know available settings & their types         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. FETCH SCHEMA                                                 │
│    GET /wp-json/angie/v1/elementor-kit/schema                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. KIT_PROVIDER - get_elementor_kit_schema()                    │
│    $kit = Plugin::$instance->kits_manager->get_active_kit();   │
│    $tabs = $kit->get_tabs(); // All setting tabs               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. LOOP THROUGH TABS                                            │
│    foreach ($tabs as $tab_id => $tab) {                        │
│      // style, typography, layout, etc.                        │
│                                                                 │
│      // Force re-register controls                             │
│      Plugin::$instance->controls_manager->delete_stack($kit);  │
│      $tab->register_controls();                                │
│                                                                 │
│      // Get controls for this tab                              │
│      $controls = $kit->get_controls();                         │
│    }                                                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. EXTRACT CONTROL METADATA                                     │
│    For each control:                                            │
│    - label: "Primary Color"                                    │
│    - type: "color"                                             │
│    - default: "#6EC1E4"                                        │
│    - options: null                                             │
│                                                                 │
│    For repeater controls:                                       │
│    - fields: {                                                 │
│        _id: {type: "text"},                                    │
│        title: {type: "text"},                                  │
│        color: {type: "color", default: "#000"}                 │
│      }                                                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. PROCESS RECURSIVELY                                          │
│    process_control_schema() handles:                            │
│    - Basic controls (color, text, slider)                      │
│    - Complex controls (repeater, group)                        │
│    - Nested fields (repeater within repeater)                  │
│    - All metadata (min, max, options, etc.)                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. RETURN COMPLETE SCHEMA                                       │
│    {                                                            │
│      "style": {                                                │
│        "system_colors": {                                      │
│          "label": "System Colors",                            │
│          "type": "repeater",                                   │
│          "fields": {                                           │
│            "_id": {...},                                       │
│            "title": {...},                                     │
│            "color": {...}                                      │
│          }                                                      │
│        },                                                       │
│        "container_width": {                                    │
│          "label": "Container Width",                           │
│          "type": "slider",                                     │
│          "default": {"unit": "px", "size": 1140},             │
│          "options": {                                          │
│            "px": {"min": 300, "max": 2000},                   │
│            "%": {"min": 50, "max": 100}                       │
│          }                                                      │
│        }                                                        │
│      },                                                         │
│      "typography": {...},                                      │
│      "layout": {...}                                           │
│    }                                                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. ANGIE - DYNAMIC FORM GENERATION                              │
│    function generateForm(schema) {                              │
│      for (const [tabId, controls] of Object.entries(schema)) { │
│        for (const [controlId, control] of Object.entries(...)) {│
│                                                                 │
│          if (control.type === 'color') {                       │
│            return <ColorPicker                                 │
│                     label={control.label}                      │
│                     default={control.default} />;              │
│          }                                                      │
│                                                                 │
│          if (control.type === 'repeater') {                    │
│            return <RepeaterControl                             │
│                     fields={control.fields}                    │
│                     titleField={control.title_field} />;       │
│          }                                                      │
│                                                                 │
│          // ... handle all control types                       │
│        }                                                        │
│      }                                                          │
│    }                                                            │
└─────────────────────────────────────────────────────────────────┘
```

**Benefits:**
- ✅ **Zero hardcoding**: Form adapts to Elementor version
- ✅ **Auto-validation**: Know min/max/type from schema
- ✅ **Future-proof**: New Elementor settings auto-appear
- ✅ **Type-safe**: Generate TypeScript interfaces from schema

**Timing**: ~500-1000ms (first time, then cached)

---

#### 📊 Scenario 4: Editor Integration Flow

**Use Case**: User opens page với Elementor Editor, Angie UI cần xuất hiện

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER OPENS ELEMENTOR EDITOR                                 │
│    Click "Edit with Elementor" on a page                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. ELEMENTOR EDITOR LOADS                                       │
│    - Init Elementor editor iframe                               │
│    - Load editor assets (CSS, JS)                              │
│    - Fire hook: elementor/editor/init                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. ANGIE - ElementorCore Module                                 │
│    Hook: add_action('elementor/editor/after_enqueue_scripts',  │
│                      [$this, 'enqueue_scripts'])               │
│                                                                 │
│    Triggered after Elementor enqueues its scripts              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. ANGIE - Enqueue Scripts                                      │
│    ElementorCore::enqueue_scripts() {                           │
│      $app_module = Plugin::instance()                          │
│                    ->modules_manager                           │
│                    ->get_modules('AngieApp');                  │
│                                                                 │
│      $app_component = $app_module->get_component('Angie_App'); │
│      $app_component->enqueue_scripts();                        │
│    }                                                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. ANGIE - Load Assets                                          │
│    wp_enqueue_script('angie-app',                              │
│      'https://editor-static-bucket.elementor.com/angie.umd.cjs',│
│      ['wp-api-request'],                                       │
│      ANGIE_VERSION                                             │
│    );                                                           │
│                                                                 │
│    wp_add_inline_script('angie-app',                           │
│      'window.angieConfig = {...}'                              │
│    );                                                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. SIDEBAR COMPONENTS                                           │
│    Hook: add_action('elementor/editor/init', function() {      │
│      add_action('wp_footer', [Sidebar_Admin_Bar, 'render']);  │
│      add_action('wp_footer', [Sidebar_CSS_Injector, 'inject']);│
│      add_action('wp_footer', [Sidebar_Html, 'render']);        │
│    });                                                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. RENDER IN wp_footer                                          │
│    - Output: <div id="wp-admin-bar-angie-sidebar-toggle">     │
│    - Output: <style> Angie sidebar CSS </style>                │
│    - Output: <div id="angie-sidebar-container">                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. ANGIE APP JAVASCRIPT INITIALIZES                             │
│    window.angieApp.init({                                       │
│      container: '#angie-sidebar-container',                    │
│      config: window.angieConfig,                               │
│      plugins: {elementor: {}}                                  │
│    });                                                          │
│                                                                 │
│    - Mounts React/Vue app into container                       │
│    - Connects to WordPress REST API                            │
│    - Ready to interact with Elementor                          │
└─────────────────────────────────────────────────────────────────┘
```

**Key Timing:**
1. `elementor/editor/init` - Earliest safe point trong editor
2. `elementor/editor/after_enqueue_scripts` - Sau khi Elementor loads assets
3. `wp_footer` - Actual rendering point

**Why this order?**
- Elementor editor có custom rendering pipeline
- Standard WordPress hooks không fire đúng timing
- wp_footer ensures tất cả dependencies available

---

### 2.8. Cache Management Strategy

#### Angie's cache clearing:
```php
protected function clear_elementor_cache() {
    // Clear Elementor files cache
    \Elementor\Plugin::$instance->files_manager->clear_cache();
    
    // Clear kit CSS cache
    $kit_id = $active_kit->get_id();
    \delete_post_meta($kit_id, '_elementor_css');
}
```

**Khi nào clear cache:**
- Sau khi update kit settings
- Sau khi thay đổi colors/typography
- Để đảm bảo frontend reflects changes ngay lập tức

---

### 2.9. Permission System

#### Angie Permissions:
```php
// In Elementor_Settings
public function permissions_check() {
    return \current_user_can('use_angie');
}

// In Kit_Provider
'permission_callback' => function() {
    return \current_user_can('edit_theme_options');
}
```

**Phân quyền:**
- `use_angie`: Quyền cơ bản sử dụng Angie
- `edit_theme_options`: Quyền edit global settings (admin-level)

---

### 2.10. Luồng Hoạt Động Tổng Thể

```
┌─────────────────────────────────────────────────────────────────┐
│                      ANGIE PLUGIN                               │
│                                                                 │
│  ┌──────────────┐      ┌──────────────┐     ┌──────────────┐  │
│  │ ElementorCore│─────▶│Kit_Provider  │────▶│ REST API     │  │
│  │   Module     │      │  Component   │     │  Endpoints   │  │
│  └──────────────┘      └──────────────┘     └──────────────┘  │
│         │                                            │          │
│         │                                            │          │
│         ▼                                            ▼          │
│  ┌──────────────┐                          ┌──────────────┐   │
│  │   Sidebar    │                          │ Elementor    │   │
│  │ Integration  │                          │  Settings    │   │
│  └──────────────┘                          └──────────────┘   │
│                                                     │          │
└─────────────────────────────────────────────────────┼──────────┘
                                                      │
                        ┌─────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                   ELEMENTOR PLUGIN                              │
│                                                                 │
│  ┌──────────────┐      ┌──────────────┐     ┌──────────────┐  │
│  │Kits Manager  │◀────▶│   Document   │◀───▶│  Database    │  │
│  │              │      │              │     │(_elementor   │  │
│  │Active Kit    │      │Kit Settings  │     │    _data)    │  │
│  └──────────────┘      └──────────────┘     └──────────────┘  │
│         │                      │                                │
│         │                      │                                │
│         ▼                      ▼                                │
│  ┌──────────────┐      ┌──────────────┐                        │
│  │   Frontend   │      │    Editor    │                        │
│  │   Renderer   │      │  Interface   │                        │
│  └──────────────┘      └──────────────┘                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## PHẦN 3: CÁC USE CASES THỰC TẾ

### 3.1. Use Case: Custom Theme Builder

**Angie's Role:**
1. Expose global colors/typography qua REST API
2. Allow bulk changes từ centralized UI
3. Preview changes realtime
4. Sync changes across multiple sites (multisite)

**Code Flow:**
```
User changes primary color in Angie
    ↓
POST /angie/v1/elementor-kit
    {
        "custom_colors": [
            {"_id": "primary", "color": "#FF0000"}
        ]
    }
    ↓
Kit_Provider updates Elementor kit
    ↓
Cache cleared
    ↓
All pages using primary color updated
```

### 3.2. Use Case: Font Management

**Angie's Role:**
1. Get available fonts từ Elementor
2. Allow quick font switching
3. Manage Google Fonts loading

**Code Flow:**
```
GET /angie/v1/elementor-kit/fonts
    ↓
Returns: {fonts: [...], font_groups: {...}}
    ↓
Angie displays font picker
    ↓
User selects new font
    ↓
POST /angie/v1/elementor-kit
    {
        "system_typography": [...]
    }
```

### 3.3. Use Case: Schema-Driven UI

**Angie's Role:**
1. Dynamic form generation based on Elementor controls
2. No hardcoding needed
3. Automatically supports new Elementor features

**Code Flow:**
```
GET /angie/v1/elementor-kit/schema
    ↓
Receive control definitions with types/options
    ↓
Angie generates React/Vue forms automatically
    ↓
Form validation based on schema
    ↓
User inputs mapped back to Elementor format
```

---

## PHẦN 4: BEST PRACTICES & CONSIDERATIONS

### 4.1. Performance

**Elementor:**
- Sử dụng HTML cache để tránh re-render
- Lazy load widgets không cần thiết
- Minify JSON khi save

**Angie:**
- Cache schema calls (không cần call mỗi lần)
- Batch API calls khi có thể
- Clear cache có chọn lọc (không clear all)

### 4.2. Security

**Elementor:**
- Sanitize tất cả settings trước khi save
- Escape output HTML
- Validate JSON structure

**Angie:**
- Check permissions cho tất cả endpoints
- Validate data type theo schema
- Use nonce cho AJAX requests

### 4.3. Compatibility

**Version Checks:**
```php
// Angie checks Elementor exists
if (!Utils::is_plugin_active('elementor/elementor.php')) {
    return new \WP_Error(...);
}

// Check for specific features
if (class_exists('Elementor\WPNotificationsPackage\V120\Notifications')) {
    // Use notifications
}
```

### 4.4. Error Handling

**Graceful Degradation:**
```php
// If Elementor not available
if (!$active_kit) {
    return new \WP_Error(
        'no_active_kit',
        'No active Elementor kit found',
        ['status' => 404]
    );
}
```

---

## PHẦN 5: TÓM TẮT KIẾN TRÚC

### JSON → HTML Flow trong Elementor:

```
_elementor_data (JSON in DB)
    ↓ [get_json_meta()]
Element Data Array
    ↓ [create_element_instance()]
Element Objects (Section/Column/Widget)
    ↓ [render_content()]
HTML Output
    ↓ [ob_get_clean()]
Rendered Page
```

### Angie ↔ Elementor Integration:

```
Angie UI (React/Vue)
    ↓ [REST API]
Kit_Provider / Elementor_Settings
    ↓ [Direct calls]
Elementor\Plugin::$instance
    ↓
Kits Manager / Documents
    ↓
Database (_elementor_data, kit settings)
```

---

## KẾT LUẬN

### Điểm Mạnh của Kiến Trúc:

1. **Separation of Concerns**: JSON storage riêng biệt với rendering logic
2. **Flexibility**: Dễ extend với custom widgets
3. **Caching**: HTML cache system tối ưu performance
4. **API-First**: Angie tận dụng structure để build tools
5. **Schema-Driven**: Dynamic UI generation possible

### Điểm Cần Lưu Ý:

1. **JSON Size**: Cần optimize cho large pages
2. **Cache Invalidation**: Phức tạp khi có nhiều levels
3. **Version Compatibility**: Cần test khi Elementor update
4. **Performance**: Rendering cost khi có nhiều widgets

---

## TÀI LIỆU THAM KHẢO

### File Paths Quan Trọng:

**Elementor:**
- `elementor/core/base/document.php` - Document management
- `elementor/includes/base/widget-base.php` - Widget base class
- `elementor/includes/frontend.php` - Frontend rendering
- `elementor/includes/elements-manager.php` - Element factory

**Angie:**
- `angie/modules/elementor-core/module.php` - Core integration
- `angie/modules/elementor-core/components/kit-provider.php` - Kit API
- `angie/modules/angie-settings/components/elementor-settings.php` - Settings API

### Meta Keys:
- `_elementor_data` - Elements JSON data
- `_elementor_page_settings` - Page settings
- `_elementor_version` - Elementor version used
- `_elementor_css` - Cached CSS

### REST API Endpoints:
- `GET /angie/v1/elementor-kit` - Get kit settings
- `POST /angie/v1/elementor-kit` - Update kit settings
- `GET /angie/v1/elementor-kit/schema` - Get control schema
- `GET /angie/v1/elementor-kit/fonts` - Get available fonts
- `GET /angie/v1/elementor-settings/supported-post-types` - Get post types

---

**Document Version:** 1.0  
**Date:** 2025-10-10  
**Author:** Copilot Analysis
