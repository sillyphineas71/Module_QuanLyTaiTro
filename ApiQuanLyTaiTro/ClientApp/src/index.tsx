import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
// ĐÃ GỠ @react-oauth/google (D4). <GoogleOAuthProvider> từng bọc cả app với một clientId
// HARDCODE ngay trong file này, trong khi CLAUDE.md §9 ghi rõ cổng KHÔNG có luồng OAuth nào:
// hai cột provider/provider_key của CSV_TaiKhoan là dự phòng, không API nào đọc/ghi.
// Định danh của cổng là EMAIL + mật khẩu (CLAUDE.md §7), xử lý ở contexts/AppAuthContext.tsx.

// ĐÃ GỠ REDUX (D2). Cổng Cựu SV chưa từng dispatch một action nào; toàn bộ store là di sản
// của hệ học vụ. Một dòng `import { store }` ở đây giữ sống 757 file (state/ + api/ + model/)
// vì store -> rootReducer -> mọi reducer -> mọi saga -> mọi api -> mọi model.
// Xác thực của cổng nằm ở contexts/AppAuthContext.tsx, không liên quan Redux.

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <App />
);

reportWebVitals();
