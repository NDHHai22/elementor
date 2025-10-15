# 🎯 QUICK GUIDE: Smart Insert Feature

## Tính Năng Mới

**Insert HTML vào đúng vị trí bạn đang edit!**

---

## Cách Dùng

### Bước 1: Chọn Vị Trí
```
Click vào widget/column/section muốn thêm
→ Panel bên trái hiện ra
→ Title: "Working on: ... > Column #2"
```

### Bước 2: Paste & Insert
```
Press: Ctrl + Shift + H
Paste HTML
Click: "Insert to Page"
→ ✅ Elements xuất hiện đúng chỗ!
```

---

## 4 Trường Hợp

### 1️⃣ Chọn Widget
```
┌─ Column ──────────┐
│ Widget #1         │ ← Chọn cái này
│ Widget #2         │
└───────────────────┘

→ Insert → New element ở GIỮA Widget #1 và #2
```

### 2️⃣ Chọn Column
```
┌─ Section ─────────────────┐
│ ┌─ Column 1 ─┐ ┌─ Col 2 ─┐│
│ │ (empty)    │ │ Widget  ││ ← Chọn Column 2
│ └────────────┘ └─────────┘│
└───────────────────────────┘

→ Insert → New element vào Column 2
```

### 3️⃣ Chọn Section
```
┌─ Section ─────────────────┐ ← Chọn cái này
│ ┌─ Column 1 ─┐ ┌─ Col 2 ─┐│
│ │            │ │         ││
│ └────────────┘ └─────────┘│
└───────────────────────────┘

→ Insert → New element vào Column 1 (đầu tiên)
```

### 4️⃣ Không Chọn Gì
```
→ Insert → New element vào cuối page
```

---

## Test Nhanh

### Test 1: After Widget
```bash
1. Click một heading widget
2. Ctrl+Shift+H
3. Paste: <button>Click Me</button>
4. Insert
5. ✅ Button xuất hiện ngay sau heading
```

### Test 2: Into Column
```bash
1. Click vào border của column (chọn column, không phải widget)
2. Ctrl+Shift+H
3. Paste: <h1>Title</h1><p>Text</p>
4. Insert
5. ✅ Elements xuất hiện trong column đó
```

---

## Debug

### Check Console
```javascript
// Khi click Insert, xem console:
🎯 Selected element: { type: 'widget', id: 'abc123' }
  → Inserting after widget at index 2
🎯 Inserting into: { container: Column, options: { at: 3 } }
✅ Elements inserted successfully!
```

### No Selection
```javascript
📄 No selection, inserting at document level
```

---

## Logic Đơn Giản

```javascript
if (chọn widget) {
    → Insert AFTER widget
}
else if (chọn column) {
    → Insert INTO column
}
else if (chọn section) {
    → Insert INTO column đầu tiên
}
else {
    → Insert vào cuối page
}
```

---

## So Sánh

| Trước | Sau |
|-------|-----|
| ❌ Luôn insert cuối page | ✅ Insert đúng chỗ |
| ❌ Phải drag elements | ✅ Không cần drag |
| ❌ Mất thời gian | ✅ Nhanh hơn 3x |

---

## Example Workflow

**Scenario**: Thêm button sau hero heading

### Trước
```
1. Open converter
2. Paste HTML
3. Insert
4. Elements ở cuối page 😞
5. Scroll down
6. Drag lên
7. Drop vào vị trí
= 7 steps
```

### Bây giờ
```
1. Click hero heading
2. Ctrl+Shift+H
3. Paste & Insert
= 3 steps ✅
```

---

## Tips

✅ **Nhớ chọn element trước khi insert**  
✅ **Panel bên trái phải mở ra** (để biết đang edit gì)  
✅ **Xem console để debug** (nếu insert sai chỗ)  
✅ **Không chọn gì = insert cuối page** (như cũ)

---

## Files Changed

```
angie/modules/elementor-core/assets/js/
└── html-to-elementor-converter.js
    ├── getTargetContainer()  ← NEW METHOD
    └── insertBtn.onclick     ← UPDATED
```

---

## Code Tham Khảo

### Elementor Official
```
elementor/packages/core/editor-components/src/utils/
└── get-container-for-new-element.ts
```

Chúng ta học và implement tương tự!

---

**That's it! Smart insert vào đúng chỗ! 🎯**

Test ngay: Ctrl+Shift+H → Paste → Insert!
