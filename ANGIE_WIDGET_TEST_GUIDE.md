# HƯỚNG DẪN TEST ANGIE WIDGET INTEGRATION

## 📋 Tổng Quan

Tài liệu này hướng dẫn cách test widget **Angie Test Button** đã được tạo để demo tương tác giữa plugin Angie và Elementor.

---

## 🎯 Widget Đã Tạo

### Angie Test Button Widget

**File Location**: `angie/modules/elementor-core/widgets/angie-test-button.php`

**Tính năng**:
- Tạo button có thể customize hoàn toàn
- Hỗ trợ icon (trái/phải)
- Kiểm soát màu sắc (normal/hover)
- Padding, border, border radius, box shadow
- Typography controls
- Link với external/nofollow options

---

## 🏗️ Kiến Trúc Tích Hợp

### 1. Widget Class
```
angie/modules/elementor-core/widgets/angie-test-button.php
└─ Angie_Test_Button extends Widget_Base
```

### 2. Widget Manager Component
```
angie/modules/elementor-core/components/widget-manager.php
└─ Widget_Manager
   ├─ register_widget_categories() - Đăng ký category "Angie Elements"
   ├─ register_widgets() - Đăng ký widget với Elementor
   └─ enqueue_widget_styles() - Load CSS
```

### 3. Module Integration
```
angie/modules/elementor-core/module.php
└─ Module
   └─ init_rest_controllers()
      └─ $this->widget_manager = new Widget_Manager()
```

---

## 🔌 Cách Tích Hợp Hoạt Động

### Hook Flow:

```
1. Elementor loads
   ↓
2. elementor/elements/categories_registered
   ↓
   Widget_Manager::register_widget_categories()
   → Tạo category "Angie Elements"
   ↓
3. elementor/widgets/register
   ↓
   Widget_Manager::register_widgets()
   → Include widget file
   → Register Angie_Test_Button widget
   ↓
4. Widget xuất hiện trong Elementor Panel
```

---

## 🧪 Hướng Dẫn Test

### Bước 1: Restart Docker Container

```powershell
cd C:\Users\hai\Documents\glintek\wordpress
docker compose down
docker compose up -d
```

### Bước 2: Truy Cập WordPress

1. Mở browser: `http://localhost:9090`
2. Login vào WordPress Admin
   - Username: (tùy cấu hình của bạn)
   - Password: (tùy cấu hình của bạn)

### Bước 3: Kiểm Tra Plugins

1. Vào **Plugins** → **Installed Plugins**
2. Đảm bảo cả 2 plugins đang active:
   - ✅ **Elementor**
   - ✅ **Angie**

### Bước 4: Tạo/Edit Page với Elementor

1. Vào **Pages** → **Add New** hoặc chọn một page có sẵn
2. Click **Edit with Elementor**

### Bước 5: Tìm Widget Angie Test Button

1. Trong Elementor Panel (bên trái), tìm category **"Angie Elements"**
2. Sẽ thấy widget **"Angie Test Button"** với icon button
3. Drag & drop widget vào page

### Bước 6: Customize Widget

#### Content Tab:
- **Button Text**: Nhập text cho button (vd: "Click Me!")
- **Link**: Nhập URL (vd: https://elementor.com)
- **Icon**: Chọn icon từ library
- **Icon Position**: Left hoặc Right

#### Style Tab:
- **Typography**: Font size, weight, family, etc.
- **Normal State**:
  - Text Color: Màu chữ
  - Background Color: Màu nền
- **Hover State**:
  - Text Color: Màu chữ khi hover
  - Background Color: Màu nền khi hover
- **Padding**: Khoảng cách bên trong button
- **Border**: Viền button
- **Border Radius**: Bo góc
- **Box Shadow**: Bóng đổ

### Bước 7: Preview & Publish

1. Click **Preview** để xem trước
2. Test hover effect
3. Click **Update** hoặc **Publish** để lưu

---

## 🔍 Kiểm Tra Kỹ Thuật

### 1. Check Widget Registration

Thêm code này vào `functions.php` của theme để debug:

```php
add_action('elementor/widgets/register', function($widgets_manager) {
    error_log('Registered Elementor Widgets:');
    error_log(print_r($widgets_manager->get_widget_types(), true));
}, 999);
```

### 2. Check Category Registration

```php
add_action('elementor/elements/categories_registered', function($elements_manager) {
    error_log('Registered Categories:');
    error_log(print_r($elements_manager->get_categories(), true));
}, 999);
```

### 3. Check trong Browser Console

1. Mở Elementor Editor
2. Mở Developer Tools (F12)
3. Console tab
4. Type: `elementor.config.widgets`
5. Tìm `angie-test-button` trong list

---

## 🐛 Troubleshooting

### Widget không xuất hiện?

**Giải pháp 1: Clear Cache**
```powershell
# Trong container
docker exec -it wordpress_app bash
wp cache flush --allow-root
wp elementor flush-css --allow-root
```

**Giải pháp 2: Check PHP Errors**
```powershell
# Xem logs
docker logs wordpress_app

# Hoặc check trong WordPress
# Vào wp-content/debug.log
```

**Giải pháp 3: Verify File Exists**
```powershell
# Check file đã tồn tại
docker exec -it wordpress_app ls -la /var/www/html/wp-content/plugins/angie/modules/elementor-core/widgets/
docker exec -it wordpress_app ls -la /var/www/html/wp-content/plugins/angie/modules/elementor-core/components/
```

**Giải pháp 4: Check Autoloading**

Thêm vào `angie/modules/elementor-core/module.php`:

```php
protected function __construct() {
    error_log('ElementorCore Module: Initializing...');
    $this->init_rest_controllers();
    error_log('ElementorCore Module: Widget Manager initialized');
    // ... rest of code
}
```

---

## 📝 Test Checklist

- [ ] Widget xuất hiện trong Elementor Panel
- [ ] Widget trong category "Angie Elements"
- [ ] Drag & drop hoạt động
- [ ] Content controls hoạt động (text, link, icon)
- [ ] Style controls hoạt động (colors, typography, spacing)
- [ ] Live preview trong editor
- [ ] Hover effects hoạt động
- [ ] Frontend rendering đúng
- [ ] Responsive trên mobile
- [ ] Link hoạt động khi click

---

## 🎨 Customize & Extend

### Thêm Widget Mới

1. Tạo file mới: `angie/modules/elementor-core/widgets/your-widget.php`
2. Class extends `Widget_Base`
3. Update `Widget_Manager::register_widgets()`:

```php
public function register_widgets( $widgets_manager ) {
    // Existing widgets
    require_once ANGIE_PATH . 'modules/elementor-core/widgets/angie-test-button.php';
    $widgets_manager->register( new \Angie\Modules\ElementorCore\Widgets\Angie_Test_Button() );
    
    // Your new widget
    require_once ANGIE_PATH . 'modules/elementor-core/widgets/your-widget.php';
    $widgets_manager->register( new \Angie\Modules\ElementorCore\Widgets\Your_Widget() );
}
```

### Thêm Category Mới

Trong `Widget_Manager::register_widget_categories()`:

```php
$elements_manager->add_category(
    'angie-advanced',
    [
        'title' => esc_html__( 'Angie Advanced', 'angie' ),
        'icon'  => 'fa fa-rocket',
    ]
);
```

---

## 📚 Tài Liệu Tham Khảo

### Elementor Developer Docs:
- Widget Development: https://developers.elementor.com/docs/widgets/
- Controls: https://developers.elementor.com/docs/controls/
- Group Controls: https://developers.elementor.com/docs/group-controls/

### Angie Architecture:
- `ANGIE_ELEMENTOR_INTERACTION_DETAILED.md` - Chi tiết tương tác
- `ELEMENTOR_JSON_TO_HTML_ANALYSIS.md` - JSON to HTML conversion

---

## 🎯 Next Steps

1. Test widget trong production
2. Thêm unit tests
3. Tạo thêm widgets phức tạp hơn
4. Tích hợp với Angie AI features
5. Tạo widget presets/templates

---

## ✅ Kết Luận

Widget **Angie Test Button** demonstrate được:

✅ **Cách Angie tích hợp với Elementor** thông qua hooks  
✅ **Widget registration flow** hoàn chỉnh  
✅ **Custom category** trong Elementor Panel  
✅ **Controls và styling** đầy đủ  
✅ **Frontend và Editor rendering** chuẩn Elementor  

Đây là foundation để xây dựng các widgets phức tạp hơn trong tương lai!
