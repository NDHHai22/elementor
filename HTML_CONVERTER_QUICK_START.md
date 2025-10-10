# 🚀 QUICK START - HTML TO ELEMENTOR CONVERTER

## ✨ Tính Năng Mới

**HTML Paste Converter** - Paste HTML và tự động chuyển thành Elementor elements!

---

## 📦 Files Đã Tạo

```
✅ angie/modules/elementor-core/components/html-to-elementor-converter.php
   → Parser & Converter component với REST API

✅ angie/modules/elementor-core/widgets/html-paste-widget.php
   → Widget UI để paste HTML

✅ angie/modules/elementor-core/module.php (Updated)
   → Integrated converter

✅ angie/modules/elementor-core/components/widget-manager.php (Updated)
   → Registered HTML paste widget

✅ HTML_TO_ELEMENTOR_GUIDE.md
   → Complete documentation
```

---

## 🎯 Test Ngay (5 Phút)

### Bước 1: Restart Docker
```powershell
cd C:\Users\hai\Documents\glintek\wordpress
docker compose down
docker compose up -d
```

### Bước 2: Open WordPress
```
URL: http://localhost:9090/wp-admin
Login và edit page với Elementor
```

### Bước 3: Tìm Widget
```
1. Trong Elementor Panel
2. Category: "Angie Elements"
3. Widget: "HTML Paste Converter" 🎨
```

### Bước 4: Paste HTML
```html
<h1>Welcome to Angie</h1>
<p>This is an <strong>automatic</strong> HTML conversion demo.</p>
<ul>
  <li>Feature One</li>
  <li>Feature Two</li>
  <li>Feature Three</li>
</ul>
<a href="https://elementor.com">Learn More</a>
```

### Bước 5: Convert
```
1. Chọn mode: "Smart Convert (Recommended)"
2. Click button: "Convert HTML"
3. ✨ Watch the magic!
```

**Kết quả**: 
- ✅ Heading widget
- ✅ Text Editor widget
- ✅ Icon List widget
- ✅ Button widget
- ✅ Converter widget tự động xóa

---

## 🎨 Supported HTML Tags

| Tag | → | Elementor Widget |
|-----|---|------------------|
| `<h1>-<h6>` | → | Heading |
| `<p>` | → | Text Editor |
| `<img>` | → | Image |
| `<a>` | → | Button |
| `<ul>/<ol>` | → | Icon List |
| `<div>/<section>` | → | Section + Column |
| Others | → | HTML Widget |

---

## 🔧 API Endpoint

```
POST /wp-json/angie/v1/html-to-elementor

Body: {
  "html": "<h1>Test</h1>"
}

Response: {
  "success": true,
  "elements": [...]
}
```

---

## 📊 Example Conversions

### Simple Hero Section
```html
<section>
  <h1>Build Amazing Websites</h1>
  <p>With Angie AI-Powered Tools</p>
  <a href="/get-started">Get Started</a>
</section>
```
**→ Creates**: Section > Column > (Heading + Text + Button)

### Feature List
```html
<h2>Features</h2>
<ul>
  <li>Smart Conversion</li>
  <li>Auto Detection</li>
  <li>One Click</li>
</ul>
```
**→ Creates**: Heading + Icon List (3 items)

### Image Card
```html
<img src="image.jpg" alt="Demo">
<h3>Card Title</h3>
<p>Card description</p>
```
**→ Creates**: Image + Heading + Text Editor

---

## 🐛 Troubleshooting

### Widget không thấy?
```powershell
# Clear cache
docker exec -it wordpress_app bash
wp cache flush --allow-root
wp elementor flush-css --allow-root
exit
```

### Conversion fails?
```powershell
# Check logs
docker logs wordpress_app --tail 50
```

### Test API directly
```bash
curl -X POST http://localhost:9090/wp-json/angie/v1/html-to-elementor \
  -H "Content-Type: application/json" \
  -d '{"html":"<h1>Test</h1>"}'
```

---

## 📚 Full Documentation

**Complete Guide**: `HTML_TO_ELEMENTOR_GUIDE.md`

Includes:
- ✅ Detailed architecture
- ✅ All conversion mappings
- ✅ REST API specs
- ✅ Advanced usage
- ✅ Performance tips
- ✅ Custom tag mapping

---

## 🎉 What's New

### Before (Previous Session)
```
✅ Angie Test Button widget
✅ Basic widget system
✅ Category "Angie Elements"
```

### Now (This Session)
```
✅ HTML to Elementor Converter component
✅ HTML Paste Converter widget
✅ Smart HTML parsing
✅ Auto element creation
✅ REST API endpoint
✅ Full documentation
```

---

## 🚀 Quick Test Checklist

- [ ] Containers running (http://localhost:9090)
- [ ] Open Elementor Editor
- [ ] Find "HTML Paste Converter" widget
- [ ] Paste sample HTML
- [ ] Click "Convert HTML"
- [ ] Elements created automatically
- [ ] Converter widget removed
- [ ] Preview looks good
- [ ] Frontend rendering correct

---

## 💡 Use Cases

### 1. **Import Landing Pages**
Copy HTML from templates → Paste → Instant Elementor page

### 2. **Migrate from Other Builders**
Export HTML → Convert → Elementor elements

### 3. **Quick Prototyping**
Write HTML → Convert → Style in Elementor

### 4. **Client Content**
Client sends HTML → Paste → Professional layout

### 5. **Bulk Content Import**
Multiple HTML files → API batch convert → Fast import

---

## 🎯 Next Steps

1. **Test basic conversion**
2. **Try complex HTML**
3. **Test all tag types**
4. **Customize mappings** (if needed)
5. **Integrate with workflows**

---

**Status**: ✅ Ready to Test!  
**Containers**: Ready at http://localhost:9090  
**Documentation**: HTML_TO_ELEMENTOR_GUIDE.md  

Happy Converting! 🎨✨
