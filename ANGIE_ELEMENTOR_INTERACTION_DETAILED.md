# TƯƠNG TÁC CHI TIẾT GIỮA ANGIE VÀ ELEMENTOR

## 📋 MỤC LỤC

1. [Tổng Quan Kiến Trúc](#1-tổng-quan-kiến-trúc)
2. [Files và Components Chính](#2-files-và-components-chính)
3. [Chi Tiết Từng File](#3-chi-tiết-từng-file)
4. [Luồng Tương Tác](#4-luồng-tương-tác)
5. [API Endpoints](#5-api-endpoints)
6. [Hooks và Filters](#6-hooks-và-filters)
7. [Database Interactions](#7-database-interactions)

---

## 1. TỔNG QUAN KIẾN TRÚC

### 1.1. Sơ Đồ Tương Tác

```
┌─────────────────────────────────────────────────────────────────┐
│                        ANGIE PLUGIN                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📁 angie/modules/elementor-core/                               │
│     ├─ module.php (ElementorCore\Module)                        │
│     └─ components/                                              │
│        └─ kit-provider.php (Kit_Provider)                       │
│                                                                  │
│  📁 angie/modules/angie-settings/                               │
│     └─ components/                                              │
│        └─ elementor-settings.php (Elementor_Settings)           │
│                                                                  │
│  📁 angie/modules/sidebar/                                      │
│     └─ components/                                              │
│        ├─ sidebar-admin-bar.php (Sidebar_Admin_Bar)            │
│        ├─ sidebar-css-injector.php (Sidebar_Css_Injector)      │
│        └─ sidebar-html.php (Sidebar_Html)                       │
│                                                                  │
│  📁 angie/modules/notifications/                                │
│     └─ module.php (Notifications\Module)                        │
│                                                                  │
│  📁 angie/modules/angie-app/                                    │
│     └─ components/                                              │
│        └─ angie-app.php (Angie_App)                            │
│                                                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ REST API Calls
                         │ WordPress Hooks
                         │ Direct PHP Calls
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                     ELEMENTOR PLUGIN                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📦 Elementor\Plugin::$instance                                 │
│     ├─ kits_manager (Kits_Manager)                             │
│     ├─ documents (Documents_Manager)                           │
│     ├─ files_manager (Files_Manager)                           │
│     ├─ controls_manager (Controls_Manager)                     │
│     └─ fonts (Fonts)                                           │
│                                                                  │
│  📦 Elementor\Core\Kits\Manager (Kits Manager)                  │
│     ├─ get_active_kit()                                        │
│     └─ get_active_kit_for_frontend()                           │
│                                                                  │
│  📦 Elementor\Core\Base\Document                                │
│     ├─ get_settings()                                          │
│     ├─ save()                                                  │
│     └─ get_elements_data()                                     │
│                                                                  │
│  📦 Elementor\Fonts                                             │
│     ├─ get_fonts()                                             │
│     ├─ get_font_groups()                                       │
│     ├─ is_google_fonts_enabled()                               │
│     └─ get_font_display_setting()                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. FILES VÀ COMPONENTS CHÍNH

### 2.1. Angie Files - Tương Tác Với Elementor

| File Path | Class | Purpose |
|-----------|-------|---------|
| `angie/modules/elementor-core/module.php` | `Angie\Modules\ElementorCore\Module` | Module chính quản lý tích hợp |
| `angie/modules/elementor-core/components/kit-provider.php` | `Angie\Modules\ElementorCore\Components\Kit_Provider` | REST API cho Kit settings |
| `angie/modules/angie-settings/components/elementor-settings.php` | `Angie\Modules\AngieSettings\Components\Elementor_Settings` | REST API cho Elementor config |
| `angie/modules/sidebar/components/sidebar-admin-bar.php` | `Angie\Modules\Sidebar\Components\Sidebar_Admin_Bar` | Toggle button trong editor |
| `angie/modules/sidebar/components/sidebar-css-injector.php` | `Angie\Modules\Sidebar\Components\Sidebar_Css_Injector` | CSS injection |
| `angie/modules/sidebar/components/sidebar-html.php` | `Angie\Modules\Sidebar\Components\Sidebar_Html` | HTML structure |
| `angie/modules/notifications/module.php` | `Angie\Modules\Notifications\Module` | Sử dụng Elementor notifications |
| `angie/modules/angie-app/components/angie-app.php` | `Angie\Modules\AngieApp\Components\Angie_App` | Main app loader |

### 2.2. Elementor Classes Được Angie Gọi

| Class | Methods Used | Purpose |
|-------|-------------|---------|
| `Elementor\Plugin` | `::$instance` | Access singleton instance |
| `Elementor\Core\Kits\Manager` | `get_active_kit()`, `get_active_kit_for_frontend()` | Get active kit |
| `Elementor\Core\Base\Document` | `get_settings()`, `save()`, `get_controls()`, `get_tabs()` | Read/Write settings |
| `Elementor\Core\Documents_Manager` | `get()`, `get_document_types()` | Get documents |
| `Elementor\Files_Manager` | `clear_cache()` | Clear cache |
| `Elementor\Controls_Manager` | `clear_stack_cache()`, `delete_stack()` | Control management |
| `Elementor\Fonts` | `get_fonts()`, `get_font_groups()`, `is_google_fonts_enabled()`, `get_font_display_setting()` | Font management |
| `Elementor\WPNotificationsPackage\V120\Notifications` | `new Notifications()` | Notification system |
| `Elementor\Core\Frontend\Performance` | `set_use_style_controls()` | Performance settings |

---

## 3. CHI TIẾT TỪNG FILE

### 3.1. FILE: `angie/modules/elementor-core/module.php`

**Class**: `Angie\Modules\ElementorCore\Module`

**Extends**: `Angie\Classes\Module_Base`

#### Hàm và Chức Năng:

##### `get_name(): string`
```php
public function get_name(): string {
    return 'elementor-core';
}
```
- **Chức năng**: Trả về tên module
- **Return**: `'elementor-core'`
- **Được gọi bởi**: Module Manager để tracking

---

##### `is_active(): bool`
```php
public static function is_active(): bool {
    return ConsentManager::has_consent() 
        && Utils::is_plugin_active('elementor/elementor.php');
}
```
- **Chức năng**: Kiểm tra module có nên active không
- **Điều kiện**:
  - User đã consent
  - Elementor plugin được cài đặt và active
- **Elementor function được gọi**: Không có (chỉ check file exists)
- **Return**: `true` nếu cả hai điều kiện thỏa mãn

---

##### `__construct()`
```php
protected function __construct() {
    $this->init_rest_controllers();
    add_action('elementor/editor/after_enqueue_scripts', [$this, 'enqueue_scripts']);
    add_filter('angie_mcp_plugins', function($plugins) {
        $plugins['elementor'] = [];
        return $plugins;
    });
}
```
- **Chức năng**: Khởi tạo module
- **Actions**:
  1. Khởi tạo REST controllers
  2. Hook vào Elementor editor
  3. Đăng ký với MCP system
- **Elementor hooks được dùng**: `elementor/editor/after_enqueue_scripts`

---

##### `init_rest_controllers()`
```php
private function init_rest_controllers() {
    $this->kit_provider = new Kit_Provider();
}
```
- **Chức năng**: Khởi tạo REST API components
- **Creates**: Instance của `Kit_Provider`

---

##### `enqueue_scripts()`
```php
public function enqueue_scripts() {
    $app_module = Plugin::instance()->modules_manager->get_modules('AngieApp');
    if (!$app_module) return;
    
    $app_component = $app_module->get_component('Angie_App');
    if (!$app_component) return;
    
    $app_component->enqueue_scripts();
}
```
- **Chức năng**: Inject Angie scripts vào Elementor Editor
- **Được gọi khi**: Elementor editor loads (hook: `elementor/editor/after_enqueue_scripts`)
- **Process**:
  1. Get Angie App module
  2. Get Angie App component
  3. Enqueue Angie scripts

---

### 3.2. FILE: `angie/modules/elementor-core/components/kit-provider.php`

**Class**: `Angie\Modules\ElementorCore\Components\Kit_Provider`

**REST API Namespace**: `angie/v1`

**REST API Base**: `elementor-kit`

#### Properties:

```php
protected $namespace = 'angie/v1';
protected $rest_base = 'elementor-kit';
```

#### Hàm và Chức Năng:

##### `__construct()`
```php
public function __construct() {
    \add_action('rest_api_init', [$this, 'register_routes']);
}
```
- **Chức năng**: Khởi tạo component
- **Hooks**: `rest_api_init` để đăng ký REST routes

---

##### `register_routes()`
```php
public function register_routes() {
    // Route 1: GET /angie/v1/elementor-kit
    \register_rest_route(
        $this->namespace,
        '/' . $this->rest_base,
        [
            'methods' => 'GET',
            'callback' => [$this, 'get_kit_settings'],
            'permission_callback' => function() {
                return \current_user_can('edit_theme_options');
            },
        ]
    );
    
    // Route 2: POST /angie/v1/elementor-kit
    \register_rest_route(
        $this->namespace,
        '/' . $this->rest_base,
        [
            'methods' => 'POST',
            'callback' => [$this, 'update_kit_settings'],
            'permission_callback' => function() {
                return \current_user_can('edit_theme_options');
            },
        ]
    );
    
    // Route 3: GET /angie/v1/elementor-kit/schema
    \register_rest_route(
        $this->namespace,
        '/' . $this->rest_base . '/schema',
        [
            'methods' => 'GET',
            'callback' => [$this, 'get_elementor_kit_schema'],
            'permission_callback' => function() {
                return \current_user_can('edit_theme_options');
            },
        ]
    );
    
    // Route 4: GET /angie/v1/elementor-kit/fonts
    \register_rest_route(
        $this->namespace,
        '/' . $this->rest_base . '/fonts',
        [
            'methods' => 'GET',
            'callback' => [$this, 'get_fonts'],
            'permission_callback' => function() {
                return \current_user_can('edit_theme_options');
            },
        ]
    );
}
```
- **Chức năng**: Đăng ký 4 REST API routes
- **Permission**: Tất cả require `edit_theme_options` capability

---

##### `get_kit_settings()`
```php
public function get_kit_settings() {
    // 1. Get Kits Manager từ Elementor
    $kits_manager = \Elementor\Plugin::$instance->kits_manager;
    $active_kit = $kits_manager->get_active_kit();
    
    if (!$active_kit) {
        return new \WP_Error('no_active_kit', 
            'No active Elementor kit found', 
            ['status' => 404]
        );
    }
    
    // 2. Get kit ID
    $kit_id = $active_kit->get_id();
    
    // 3. Get kit document từ Documents Manager
    $kit_document = \Elementor\Plugin::$instance->documents->get($kit_id);
    
    if (!$kit_document) {
        return new \WP_Error('kit_document_not_found', 
            'Kit document not found', 
            ['status' => 404]
        );
    }
    
    // 4. Get all settings từ document
    $saved_settings = $kit_document->get_settings();
    
    return \rest_ensure_response($saved_settings);
}
```

**Elementor Classes/Methods được gọi**:
1. `\Elementor\Plugin::$instance->kits_manager` - Access Kits Manager
2. `$kits_manager->get_active_kit()` - Lấy active kit instance
3. `$active_kit->get_id()` - Lấy kit post ID
4. `\Elementor\Plugin::$instance->documents->get($kit_id)` - Lấy kit document
5. `$kit_document->get_settings()` - Lấy tất cả kit settings

**Return**: Array of kit settings (colors, typography, layout, etc.)

**Database**: Đọc từ `wp_postmeta` với meta_key `_elementor_data`

---

##### `update_kit_settings($request)`
```php
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
    
    // 3. Merge settings
    $current_settings = $kit_document->get_settings();
    $merged_settings = array_merge($current_settings, $params);
    
    // 4. Save to database
    $kit_document->save([
        'settings' => $merged_settings,
    ]);
    
    // 5. Clear cache
    $this->clear_elementor_cache();
    
    return \rest_ensure_response([
        'success' => true,
        'kit_id' => $kit_id,
        'message' => 'Site settings updated successfully',
        'updated_settings' => $params,
    ]);
}
```

**Elementor Classes/Methods được gọi**:
1. `\Elementor\Plugin::$instance->kits_manager` - Access Kits Manager
2. `$kits_manager->get_active_kit()` - Lấy active kit
3. `\Elementor\Plugin::$instance->documents->get($kit_id)` - Lấy document
4. `$kit_document->get_settings()` - Lấy current settings
5. `$kit_document->save(['settings' => $merged_settings])` - Lưu settings mới

**Database**: Update `wp_postmeta` với meta_key `_elementor_data`

**Important**: Settings được **merge** không phải replace toàn bộ

---

##### `get_fonts()`
```php
public function get_fonts() {
    try {
        // 1. Get fonts từ Elementor Fonts class
        $fonts = \Elementor\Fonts::get_fonts();
        $font_groups = \Elementor\Fonts::get_font_groups();
        
        // 2. Get font settings
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

**Elementor Classes/Methods được gọi**:
1. `\Elementor\Fonts::get_fonts()` - Lấy danh sách tất cả fonts
2. `\Elementor\Fonts::get_font_groups()` - Lấy font groups (Google, System, Custom)
3. `\Elementor\Fonts::is_google_fonts_enabled()` - Check Google Fonts enabled
4. `\Elementor\Fonts::get_font_display_setting()` - Get font-display CSS property

**Return**: Object với fonts data và settings

---

##### `get_elementor_kit_schema()`
```php
public function get_elementor_kit_schema() {
    // 1. Enable style controls
    \Elementor\Core\Frontend\Performance::set_use_style_controls(true);
    
    // 2. Get active kit
    $kit = \Elementor\Plugin::$instance->kits_manager->get_active_kit();
    $tabs = $kit->get_tabs();
    
    $tab_controls = new \stdClass();
    
    // 3. Clear cache
    \Elementor\Plugin::$instance->controls_manager->clear_stack_cache();
    
    // 4. Loop through tabs
    foreach ($tabs as $tab_id => $tab) {
        // Delete stack để force re-register
        \Elementor\Plugin::$instance->controls_manager->delete_stack($kit);
        
        // Register controls
        $tab->register_controls();
        
        // Get controls
        $tab_specific_controls = $kit->get_controls();
        
        $tab_controls->$tab_id = new \stdClass();
        
        // 5. Process controls
        foreach ($tab_specific_controls as $control_id => $control) {
            // Skip UI-only controls
            if ('section' === $control['type'] ||
                'heading' === $control['type'] ||
                'popover_toggle' === $control['type']) {
                continue;
            }
            
            $tab_controls->$tab_id->$control_id = 
                $this->process_control_schema($control);
        }
    }
    
    return \rest_ensure_response($tab_controls);
}
```

**Elementor Classes/Methods được gọi**:
1. `\Elementor\Core\Frontend\Performance::set_use_style_controls(true)` - Enable style controls
2. `\Elementor\Plugin::$instance->kits_manager->get_active_kit()` - Get kit
3. `$kit->get_tabs()` - Lấy tất cả setting tabs
4. `\Elementor\Plugin::$instance->controls_manager->clear_stack_cache()` - Clear cache
5. `\Elementor\Plugin::$instance->controls_manager->delete_stack($kit)` - Delete stack
6. `$tab->register_controls()` - Register controls cho tab
7. `$kit->get_controls()` - Lấy tất cả controls

**Purpose**: Generate schema cho dynamic form generation

---

##### `process_control_schema($control)`
```php
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
    
    // Nested fields (repeater)
    if (isset($control['fields']) && \is_array($control['fields'])) {
        $schema['fields'] = [];
        foreach ($control['fields'] as $field_id => $field) {
            $schema['fields'][$field_id] = 
                $this->process_control_schema($field);
        }
    }
    
    // Repeater properties
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
- **Chức năng**: Process control schema recursively
- **Handles**: Basic controls, repeaters, nested fields
- **Không gọi Elementor**: Chỉ process data structure

---

##### `clear_elementor_cache()`
```php
protected function clear_elementor_cache() {
    // 1. Clear files cache (CSS, JS)
    \Elementor\Plugin::$instance->files_manager->clear_cache();
    
    // 2. Get kit ID
    $kits_manager = \Elementor\Plugin::$instance->kits_manager;
    $active_kit = $kits_manager->get_active_kit();
    $kit_id = $active_kit->get_id();
    
    // 3. Clear kit CSS meta
    if ($kit_id) {
        \delete_post_meta($kit_id, '_elementor_css');
    }
}
```

**Elementor Classes/Methods được gọi**:
1. `\Elementor\Plugin::$instance->files_manager->clear_cache()` - Clear file cache
2. `\Elementor\Plugin::$instance->kits_manager->get_active_kit()` - Get kit

**Database**: Delete post meta `_elementor_css`

**Khi nào được gọi**: Sau khi update kit settings

---

### 3.3. FILE: `angie/modules/angie-settings/components/elementor-settings.php`

**Class**: `Angie\Modules\AngieSettings\Components\Elementor_Settings`

**REST API Namespace**: `angie/v1`

**REST API Base**: `elementor-settings`

#### Hàm và Chức Năng:

##### `__construct()`
```php
public function __construct() {
    \add_action('rest_api_init', [$this, 'register_routes']);
}
```

---

##### `register_routes()`
```php
public function register_routes() {
    \register_rest_route(
        $this->namespace, 
        '/' . $this->rest_base . '/supported-post-types',
        [
            'methods' => 'GET',
            'callback' => [$this, 'get_supported_post_types'],
            'permission_callback' => [$this, 'permissions_check'],
        ]
    );
}
```
- **Route**: `GET /angie/v1/elementor-settings/supported-post-types`
- **Permission**: `use_angie` capability

---

##### `get_supported_post_types($request)`
```php
public function get_supported_post_types($request) {
    // 1. Check Elementor active
    if (!Utils::is_plugin_active('elementor/elementor.php')) {
        return new \WP_Error(
            'elementor_not_active',
            'Elementor plugin is not active',
            ['status' => 404]
        );
    }
    
    // 2. Get from option
    $supported_post_types = \get_option('elementor_cpt_support', false);
    
    // 3. If not set, detect
    if (false === $supported_post_types) {
        $supported_post_types = $this->get_default_elementor_supported_post_types();
    }
    
    if (!is_array($supported_post_types)) {
        $supported_post_types = [];
    }
    
    return \rest_ensure_response($supported_post_types);
}
```

**Database**: Đọc option `elementor_cpt_support`

**Return**: Array of post type names

---

##### `get_default_elementor_supported_post_types()`
```php
private function get_default_elementor_supported_post_types() {
    $all_post_types = \get_post_types(['public' => true], 'names');
    $supported_post_types = [];
    
    // Method 1: Check post type support
    foreach ($all_post_types as $post_type) {
        if (\post_type_supports($post_type, 'elementor')) {
            $supported_post_types[] = $post_type;
        }
    }
    
    // Method 2: Check Elementor's document types
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

**Elementor Classes/Methods được gọi**:
1. `\Elementor\Plugin::$instance->documents->get_document_types()` - Get document types
2. `$document_type::get_post_type()` - Get post type từ document

**Detection Strategy**:
1. Check `post_type_supports($post_type, 'elementor')`
2. Fallback: Query Elementor document types

---

### 3.4. FILE: `angie/modules/sidebar/components/sidebar-admin-bar.php`

**Class**: `Angie\Modules\Sidebar\Components\Sidebar_Admin_Bar`

#### Hàm và Chức Năng:

##### `__construct()`
```php
public function __construct() {
    add_action('admin_bar_menu', [$this, 'add_toggle_to_admin_bar'], 999);
    
    // Elementor editor integration
    add_action('elementor/editor/init', function() {
        add_action('wp_footer', [$this, 'add_toggle_to_admin_bar']);
    });
}
```

**Elementor Hook**: `elementor/editor/init` - Fired khi Elementor editor initializes

---

##### `add_toggle_to_admin_bar($wp_admin_bar)`
```php
public function add_toggle_to_admin_bar($wp_admin_bar): void {
    if (!$this->should_add_to_admin_bar()) {
        return;
    }
    
    if ($wp_admin_bar) {
        // Standard admin bar
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
```

**Được gọi**:
- Hook `admin_bar_menu` cho WordPress admin
- Hook `wp_footer` trong Elementor editor

**Tại sao khác nhau**: Admin bar không render trong Elementor editor, cần output HTML directly

---

### 3.5. FILE: `angie/modules/sidebar/components/sidebar-css-injector.php`

**Class**: `Angie\Modules\Sidebar\Components\Sidebar_Css_Injector`

#### Hàm và Chức Năng:

##### `__construct()`
```php
public function __construct() {
    add_action('admin_head', [$this, 'enqueue_css']);
    add_action('wp_head', [$this, 'enqueue_css']);
    
    // Elementor editor
    add_action('elementor/editor/init', function() {
        add_action('wp_footer', [$this, 'enqueue_css']);
    });
}
```

**Elementor Hook**: `elementor/editor/init`

---

##### `enqueue_css()`
```php
public function enqueue_css() {
    $plugin_url = plugin_dir_url(__DIR__);
    wp_enqueue_style(
        'angie-sidebar-css',
        $plugin_url . 'assets/sidebar.css',
        [],
        ANGIE_VERSION
    );
}
```

**Chức năng**: Enqueue CSS cho sidebar

**Context**: Admin, Frontend, và Elementor Editor

---

### 3.6. FILE: `angie/modules/notifications/module.php`

**Class**: `Angie\Modules\Notifications\Module`

**Extends**: `Angie\Classes\Module_Base`

**Uses**: `Elementor\WPNotificationsPackage\V120\Notifications`

#### Hàm và Chức Năng:

##### `is_active(): bool`
```php
public static function is_active(): bool {
    return is_admin() 
        && class_exists('Elementor\WPNotificationsPackage\V120\Notifications');
}
```

**Elementor Dependency**: Require `Elementor\WPNotificationsPackage\V120\Notifications` class

---

##### `init_notifications()`
```php
private function init_notifications() {
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
```

**Elementor Class được dùng**: `Elementor\WPNotificationsPackage\V120\Notifications`

**Purpose**: Sử dụng Elementor's notification system

---

### 3.7. FILE: `angie/modules/angie-app/components/angie-app.php`

**Class**: `Angie\Modules\AngieApp\Components\Angie_App`

#### Hàm và Chức Năng:

##### `enqueue_scripts()`
```php
public function enqueue_scripts() {
    if (!current_user_can('use_angie')) {
        return;
    }
    
    // ... check consent ...
    
    // Enqueue Angie app script
    wp_enqueue_script(
        'angie-app',
        'https://editor-static-bucket.elementor.com/angie.umd.cjs',
        ['wp-api-request'],
        ANGIE_VERSION,
        false
    );
    
    $plugins = apply_filters('angie_mcp_plugins', []);
    
    // Check Elementor active
    if (Utils::is_plugin_active('elementor/elementor.php')) {
        $plugins['elementor'] = [];
    }
    
    // Check Elementor Pro active
    if (Utils::is_plugin_active('elementor-pro/elementor-pro.php')) {
        $plugins['elementor_pro'] = [];
    }
    
    // Get Elementor site key
    $site_key = get_option('elementor_connect_site_key', null);
    
    wp_add_inline_script(
        'angie-app',
        'window.angieConfig = ' . wp_json_encode([
            'plugins' => $plugins,
            'postTypesNames' => $post_types_names,
            'version' => ANGIE_VERSION,
            'wpVersion' => get_bloginfo('version'),
            'wpUsername' => $wp_username,
            'untrusted__wpUserRole' => $wp_user_role,
            'siteKey' => $site_key,
        ]),
        'before'
    );
}
```

**Elementor Data được dùng**:
1. Check `elementor/elementor.php` active
2. Check `elementor-pro/elementor-pro.php` active
3. Get option `elementor_connect_site_key`

**Purpose**: 
- Load Angie app script
- Pass Elementor info to frontend
- Include Elementor site key

---

## 4. LUỒNG TƯƠNG TÁC

### 4.1. Khởi Tạo (Initialization)

```
WordPress Load
    ↓
Angie Plugin Init
    ↓
angie/includes/modules-manager.php loads modules
    ↓
ElementorCore Module::is_active() checks
    ├─ ConsentManager::has_consent()
    └─ Utils::is_plugin_active('elementor/elementor.php')
    ↓
If true: ElementorCore Module::__construct()
    ├─ init_rest_controllers()
    │  └─ new Kit_Provider() → registers REST routes
    ├─ add_action('elementor/editor/after_enqueue_scripts', ...)
    └─ add_filter('angie_mcp_plugins', ...)
```

---

### 4.2. Đọc Kit Settings

```
Frontend JavaScript
    ↓
fetch('/wp-json/angie/v1/elementor-kit')
    ↓
WordPress REST API
    ↓
Kit_Provider::get_kit_settings()
    ↓
\Elementor\Plugin::$instance->kits_manager
    ↓
$kits_manager->get_active_kit()
    ↓ (returns Kit Document)
\Elementor\Plugin::$instance->documents->get($kit_id)
    ↓ (returns Kit Document)
$kit_document->get_settings()
    ↓ (queries database)
SELECT meta_value FROM wp_postmeta 
WHERE post_id = $kit_id 
AND meta_key = '_elementor_data'
    ↓
Return JSON to frontend
```

**Elementor Methods Called**:
1. `\Elementor\Plugin::$instance->kits_manager`
2. `$kits_manager->get_active_kit()`
3. `\Elementor\Plugin::$instance->documents->get($kit_id)`
4. `$kit_document->get_settings()`

---

### 4.3. Update Kit Settings

```
Frontend JavaScript
    ↓
fetch('/wp-json/angie/v1/elementor-kit', {
    method: 'POST',
    body: JSON.stringify({settings})
})
    ↓
WordPress REST API
    ↓
Kit_Provider::update_kit_settings($request)
    ↓
Get current settings:
    \Elementor\Plugin::$instance->kits_manager->get_active_kit()
    \Elementor\Plugin::$instance->documents->get($kit_id)
    $kit_document->get_settings()
    ↓
Merge settings:
    $merged = array_merge($current, $new)
    ↓
Save to database:
    $kit_document->save(['settings' => $merged])
    ↓ (Elementor handles this)
UPDATE wp_postmeta 
SET meta_value = JSON
WHERE post_id = $kit_id 
AND meta_key = '_elementor_data'
    ↓
Clear cache:
    \Elementor\Plugin::$instance->files_manager->clear_cache()
    delete_post_meta($kit_id, '_elementor_css')
    ↓
Return success response
```

**Elementor Methods Called**:
1. `\Elementor\Plugin::$instance->kits_manager->get_active_kit()`
2. `\Elementor\Plugin::$instance->documents->get($kit_id)`
3. `$kit_document->get_settings()`
4. `$kit_document->save()`
5. `\Elementor\Plugin::$instance->files_manager->clear_cache()`

---

### 4.4. Get Schema

```
Frontend JavaScript
    ↓
fetch('/wp-json/angie/v1/elementor-kit/schema')
    ↓
Kit_Provider::get_elementor_kit_schema()
    ↓
\Elementor\Core\Frontend\Performance::set_use_style_controls(true)
    ↓
\Elementor\Plugin::$instance->kits_manager->get_active_kit()
    ↓
$kit->get_tabs()
    ↓
For each tab:
    \Elementor\Plugin::$instance->controls_manager->delete_stack($kit)
    $tab->register_controls()
    $kit->get_controls()
    ↓
Process controls recursively
    ↓
Return schema object
```

**Elementor Methods Called**:
1. `\Elementor\Core\Frontend\Performance::set_use_style_controls()`
2. `\Elementor\Plugin::$instance->kits_manager->get_active_kit()`
3. `$kit->get_tabs()`
4. `\Elementor\Plugin::$instance->controls_manager->delete_stack()`
5. `$tab->register_controls()`
6. `$kit->get_controls()`

---

### 4.5. Get Fonts

```
Frontend JavaScript
    ↓
fetch('/wp-json/angie/v1/elementor-kit/fonts')
    ↓
Kit_Provider::get_fonts()
    ↓
\Elementor\Fonts::get_fonts()
\Elementor\Fonts::get_font_groups()
\Elementor\Fonts::is_google_fonts_enabled()
\Elementor\Fonts::get_font_display_setting()
    ↓
Return fonts data
```

**Elementor Methods Called**:
1. `\Elementor\Fonts::get_fonts()`
2. `\Elementor\Fonts::get_font_groups()`
3. `\Elementor\Fonts::is_google_fonts_enabled()`
4. `\Elementor\Fonts::get_font_display_setting()`

---

### 4.6. Editor Integration

```
User clicks "Edit with Elementor"
    ↓
Elementor Editor loads
    ↓
Hook fires: elementor/editor/init
    ↓
Sidebar_Admin_Bar::__construct() hooked
    ↓
Hook fires: elementor/editor/after_enqueue_scripts
    ↓
ElementorCore\Module::enqueue_scripts()
    ↓
Get AngieApp module
Get Angie_App component
Call $app_component->enqueue_scripts()
    ↓
wp_enqueue_script('angie-app', 'https://...')
wp_add_inline_script('angie-app', 'window.angieConfig = {...}')
    ↓
Hook fires: wp_footer
    ↓
Sidebar components render:
    - Sidebar_Admin_Bar::add_toggle_to_admin_bar()
    - Sidebar_Css_Injector::enqueue_css()
    - Sidebar_Html::render_sidebar_html()
    ↓
Angie UI appears in Elementor Editor
```

**Elementor Hooks Used**:
1. `elementor/editor/init`
2. `elementor/editor/after_enqueue_scripts`

---

## 5. API ENDPOINTS

### Summary Table

| Endpoint | Method | Angie File | Angie Function | Elementor Classes Used | Purpose |
|----------|--------|------------|----------------|----------------------|---------|
| `/angie/v1/elementor-kit` | GET | `kit-provider.php` | `get_kit_settings()` | `Kits_Manager`, `Documents_Manager`, `Document` | Lấy kit settings |
| `/angie/v1/elementor-kit` | POST | `kit-provider.php` | `update_kit_settings()` | `Kits_Manager`, `Documents_Manager`, `Document`, `Files_Manager` | Update kit settings |
| `/angie/v1/elementor-kit/schema` | GET | `kit-provider.php` | `get_elementor_kit_schema()` | `Kits_Manager`, `Controls_Manager`, `Document` | Lấy control schema |
| `/angie/v1/elementor-kit/fonts` | GET | `kit-provider.php` | `get_fonts()` | `Fonts` | Lấy fonts data |
| `/angie/v1/elementor-settings/supported-post-types` | GET | `elementor-settings.php` | `get_supported_post_types()` | `Documents_Manager` | Lấy supported post types |

---

## 6. HOOKS VÀ FILTERS

### 6.1. Elementor Hooks Angie Sử Dụng

| Hook Name | Type | Angie File | Angie Function | Purpose |
|-----------|------|------------|----------------|---------|
| `elementor/editor/init` | Action | `sidebar-admin-bar.php` | `__construct()` | Add toggle button |
| `elementor/editor/init` | Action | `sidebar-css-injector.php` | `__construct()` | Inject CSS |
| `elementor/editor/init` | Action | `sidebar-html.php` | `__construct()` | Render HTML |
| `elementor/editor/after_enqueue_scripts` | Action | `module.php` (ElementorCore) | `enqueue_scripts()` | Load Angie scripts |

### 6.2. Angie Filters

| Filter Name | Angie File | Purpose |
|-------------|------------|---------|
| `angie_mcp_plugins` | `module.php` (ElementorCore) | Register Elementor với MCP system |

---

## 7. DATABASE INTERACTIONS

### 7.1. WordPress Options

| Option Name | Angie File | Angie Function | Purpose |
|-------------|------------|----------------|---------|
| `elementor_cpt_support` | `elementor-settings.php` | `get_supported_post_types()` | Get supported post types |
| `elementor_connect_site_key` | `angie-app.php` | `enqueue_scripts()` | Get Elementor site key |
| `elementor_active_kit` | N/A | N/A | Read by Elementor (Angie uses indirectly) |

### 7.2. Post Meta

| Meta Key | Angie File | Angie Function | Access Type | Purpose |
|----------|------------|----------------|-------------|---------|
| `_elementor_data` | `kit-provider.php` | `get_kit_settings()`, `update_kit_settings()` | Read/Write | Kit settings JSON |
| `_elementor_css` | `kit-provider.php` | `clear_elementor_cache()` | Delete | Clear CSS cache |

### 7.3. Database Queries (Via Elementor)

**Angie không trực tiếp query database**. Tất cả database access thông qua Elementor methods:

1. **Read Kit Settings**:
   ```sql
   -- Via: $kit_document->get_settings()
   SELECT meta_value 
   FROM wp_postmeta 
   WHERE post_id = $kit_id 
   AND meta_key = '_elementor_data'
   ```

2. **Write Kit Settings**:
   ```sql
   -- Via: $kit_document->save()
   UPDATE wp_postmeta 
   SET meta_value = $json_data
   WHERE post_id = $kit_id 
   AND meta_key = '_elementor_data'
   ```

3. **Clear CSS Cache**:
   ```sql
   -- Via: delete_post_meta($kit_id, '_elementor_css')
   DELETE FROM wp_postmeta 
   WHERE post_id = $kit_id 
   AND meta_key = '_elementor_css'
   ```

4. **Get Active Kit ID**:
   ```sql
   -- Via: get_option('elementor_active_kit')
   SELECT option_value 
   FROM wp_options 
   WHERE option_name = 'elementor_active_kit'
   ```

---

## 8. DEPENDENCIES MATRIX

### 8.1. Angie Files → Elementor Classes

| Angie File | Elementor Classes Dependency |
|------------|----------------------------|
| `elementor-core/module.php` | None (chỉ check plugin active) |
| `elementor-core/components/kit-provider.php` | `Plugin`, `Kits_Manager`, `Documents_Manager`, `Document`, `Files_Manager`, `Controls_Manager`, `Fonts`, `Frontend\Performance` |
| `angie-settings/components/elementor-settings.php` | `Plugin`, `Documents_Manager` |
| `sidebar/components/sidebar-admin-bar.php` | None (chỉ dùng hooks) |
| `sidebar/components/sidebar-css-injector.php` | None (chỉ dùng hooks) |
| `sidebar/components/sidebar-html.php` | None (chỉ dùng hooks) |
| `notifications/module.php` | `WPNotificationsPackage\V120\Notifications` |
| `angie-app/components/angie-app.php` | None (chỉ check plugin active và option) |

### 8.2. Critical Dependencies

**Hard Dependencies** (Angie không hoạt động nếu thiếu):
1. `Elementor\Plugin` - Core singleton
2. `Elementor\Core\Kits\Manager` - Kit management
3. `Elementor\Core\Base\Document` - Settings read/write

**Soft Dependencies** (Graceful degradation):
1. `Elementor\WPNotificationsPackage\V120\Notifications` - Có thể hoạt động không có
2. `Elementor\Fonts` - Fallback nếu không có

---

## 9. ERROR HANDLING

### 9.1. Elementor Not Active

**File**: `elementor-settings.php`

**Function**: `get_supported_post_types()`

```php
if (!Utils::is_plugin_active('elementor/elementor.php')) {
    return new \WP_Error(
        'elementor_not_active',
        'Elementor plugin is not active',
        ['status' => 404]
    );
}
```

---

### 9.2. No Active Kit

**File**: `kit-provider.php`

**Function**: `get_kit_settings()`, `update_kit_settings()`

```php
if (!$active_kit) {
    return new \WP_Error(
        'no_active_kit',
        'No active Elementor kit found',
        ['status' => 404]
    );
}
```

---

### 9.3. Kit Document Not Found

**File**: `kit-provider.php`

**Function**: `get_kit_settings()`, `update_kit_settings()`

```php
if (!$kit_document) {
    return new \WP_Error(
        'kit_document_not_found',
        'Kit document not found',
        ['status' => 404]
    );
}
```

---

### 9.4. Fonts Fetch Error

**File**: `kit-provider.php`

**Function**: `get_fonts()`

```php
catch (\Exception $e) {
    return new \WP_Error(
        'fonts_fetch_error',
        'Failed to fetch fonts: ' . $e->getMessage(),
        ['status' => 500]
    );
}
```

---

## 10. PERMISSIONS

### 10.1. Capabilities Required

| Angie Component | Capability | Elementor Equivalent |
|-----------------|------------|---------------------|
| Kit_Provider endpoints | `edit_theme_options` | Admin-level access |
| Elementor_Settings endpoint | `use_angie` | Custom Angie capability |
| Sidebar components | `use_angie` | Custom Angie capability |

### 10.2. Permission Checks

**File**: `kit-provider.php`
```php
'permission_callback' => function() {
    return \current_user_can('edit_theme_options');
}
```

**File**: `elementor-settings.php`
```php
public function permissions_check() {
    return \current_user_can('use_angie');
}
```

---

## 11. PERFORMANCE CONSIDERATIONS

### 11.1. Caching Strategy

**When Cache is Cleared**:
- After `update_kit_settings()` call
- Via `clear_elementor_cache()` function

**What Gets Cleared**:
1. `Elementor\Plugin::$instance->files_manager->clear_cache()` - CSS/JS files
2. `delete_post_meta($kit_id, '_elementor_css')` - Kit CSS meta

### 11.2. API Call Optimization

**Schema Caching**:
- `get_elementor_kit_schema()` expensive (loops all tabs/controls)
- Should be cached on frontend
- Only call once per session

**Settings Caching**:
- `get_kit_settings()` moderate cost (1 DB query)
- Can be cached with short TTL (5 minutes)

---

## 12. VERSION COMPATIBILITY

### 12.1. Elementor Version Checks

**No explicit version checks in Angie code**

Angie assumes:
- Elementor 3.x+ (uses Kits system)
- WPNotifications package available (optional)

### 12.2. Backwards Compatibility

**Graceful Degradation**:
```php
if (class_exists('Elementor\WPNotificationsPackage\V120\Notifications')) {
    // Use notifications
} else {
    // Fallback: không có notifications
}
```

---

## 13. TESTING CHECKLIST

### 13.1. Manual Testing

- [ ] Elementor active: Angie module loads
- [ ] Elementor inactive: Angie module disabled
- [ ] GET /elementor-kit: Returns kit settings
- [ ] POST /elementor-kit: Updates settings + clears cache
- [ ] GET /elementor-kit/schema: Returns control schema
- [ ] GET /elementor-kit/fonts: Returns fonts data
- [ ] Elementor editor: Angie sidebar appears
- [ ] Elementor editor: Toggle button works
- [ ] Settings update: Frontend reflects changes
- [ ] Cache cleared: CSS regenerated

### 13.2. Error Scenarios

- [ ] Elementor not installed: Proper error
- [ ] No active kit: Proper error
- [ ] Invalid kit ID: Proper error
- [ ] Permission denied: 403 error
- [ ] Invalid JSON: Validation error

---

## 14. SUMMARY

### 14.1. Key Files

**Top 3 Most Important Angie Files**:
1. `angie/modules/elementor-core/components/kit-provider.php` - Main API bridge
2. `angie/modules/elementor-core/module.php` - Integration hub
3. `angie/modules/angie-settings/components/elementor-settings.php` - Configuration API

### 14.2. Key Elementor Classes

**Top 5 Most Used Elementor Classes**:
1. `Elementor\Plugin::$instance` - Singleton access
2. `Elementor\Core\Kits\Manager` - Kit management
3. `Elementor\Core\Base\Document` - Settings CRUD
4. `Elementor\Core\Documents_Manager` - Document access
5. `Elementor\Files_Manager` - Cache management

### 14.3. Integration Points

**4 Main Integration Points**:
1. **REST API** - Read/Write kit settings
2. **Hooks** - Inject UI into editor
3. **Direct Calls** - Access Elementor classes
4. **Database** - Via Elementor methods

### 14.4. Data Flow Summary

```
Angie UI (Frontend)
    ↕ REST API
Kit_Provider / Elementor_Settings (PHP)
    ↕ Direct Method Calls
Elementor\Plugin Classes (PHP)
    ↕ Database Queries
WordPress Database (MySQL)
```

---

## 📚 APPENDIX

### A. Complete Method Reference

#### Angie Methods That Call Elementor

| Angie Class | Method | Elementor Class | Elementor Method |
|-------------|--------|-----------------|------------------|
| `Kit_Provider` | `get_kit_settings()` | `Plugin` | `::$instance->kits_manager` |
| `Kit_Provider` | `get_kit_settings()` | `Kits_Manager` | `get_active_kit()` |
| `Kit_Provider` | `get_kit_settings()` | `Documents_Manager` | `get($id)` |
| `Kit_Provider` | `get_kit_settings()` | `Document` | `get_settings()` |
| `Kit_Provider` | `update_kit_settings()` | `Plugin` | `::$instance->kits_manager` |
| `Kit_Provider` | `update_kit_settings()` | `Kits_Manager` | `get_active_kit()` |
| `Kit_Provider` | `update_kit_settings()` | `Documents_Manager` | `get($id)` |
| `Kit_Provider` | `update_kit_settings()` | `Document` | `get_settings()`, `save()` |
| `Kit_Provider` | `clear_elementor_cache()` | `Files_Manager` | `clear_cache()` |
| `Kit_Provider` | `get_fonts()` | `Fonts` | `get_fonts()`, `get_font_groups()`, `is_google_fonts_enabled()`, `get_font_display_setting()` |
| `Kit_Provider` | `get_elementor_kit_schema()` | `Frontend\Performance` | `set_use_style_controls()` |
| `Kit_Provider` | `get_elementor_kit_schema()` | `Kits_Manager` | `get_active_kit()` |
| `Kit_Provider` | `get_elementor_kit_schema()` | `Document` | `get_tabs()`, `get_controls()` |
| `Kit_Provider` | `get_elementor_kit_schema()` | `Controls_Manager` | `clear_stack_cache()`, `delete_stack()` |
| `Elementor_Settings` | `get_default_elementor_supported_post_types()` | `Documents_Manager` | `get_document_types()` |
| `Notifications\Module` | `init_notifications()` | `WPNotificationsPackage` | `new Notifications()` |

---

### B. Hook Reference

| Hook Name | Type | Priority | File | Function |
|-----------|------|----------|------|----------|
| `elementor/editor/init` | action | default | `sidebar-admin-bar.php` | Closure → `add_toggle_to_admin_bar()` |
| `elementor/editor/init` | action | default | `sidebar-css-injector.php` | Closure → `enqueue_css()` |
| `elementor/editor/init` | action | default | `sidebar-html.php` | Closure → `render_sidebar_html()` |
| `elementor/editor/after_enqueue_scripts` | action | default | `elementor-core/module.php` | `enqueue_scripts()` |
| `angie_mcp_plugins` | filter | default | `elementor-core/module.php` | Closure |
| `rest_api_init` | action | default | `kit-provider.php` | `register_routes()` |
| `rest_api_init` | action | default | `elementor-settings.php` | `register_routes()` |

---

**Document Created**: 2025-10-10  
**Author**: GitHub Copilot  
**Version**: 1.0 - Detailed Interaction Reference
