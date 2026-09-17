import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, theme } from '@primer/react';
import BaseStyles from './BaseStyles';
import deepmerge from 'deepmerge';
import AppRoutes from './AppRoutes';
import { appConst } from './AppConst';
import { useWebIcon } from './hooks/useWebIcon';
import { Toaster } from 'react-hot-toast';
import { AppAuthProvider } from './contexts/AppAuthContext';

const customTheme = deepmerge(
  {
    ...theme,
    fontSizes: ['11px', '13px', '16px', '20px', '24px', '32px', '40px', '48px', '56px'],
    // Nối font của app vào Primer. BaseStyles.tsx nhận prop `fontFamily` mặc định là 'normal'
    // rồi đưa qua styled-system typography -> nó tra `theme.fonts.normal`. Nên chỉ cần khai ở
    // theme là mọi component Primer nằm trong cây <BaseStyles> dùng chung font.
    // Component render qua PORTAL (Dialog, ActionMenu...) nằm ngoài cây đó nên không nhận được
    // từ đây - phần ấy do `body { font-family }` trong index.css phủ. Cần CẢ HAI.
    fonts: {
      ...theme.fonts,
      normal: '"Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
  },
  {
    colorSchemes: {
      light: {
        colors: {
          accent: {
            fg: "var(--primary)",
            emphasis: "var(--primary)",
          },
          // Nút primary của Primer. TRƯỚC ĐÂY đặt cam #DE3F0F ở đây, gây ra lỗi "một nút hai
          // màu": components-ui/button/Button.tsx có HAI nhánh render, nhánh KHÔNG tooltip gắn
          // className={styles[variant]} nên ăn .primary của Button.module.css (teal
          // var(--primary)), còn nhánh CÓ tooltip QUÊN gắn className nên rơi về theme này và ra
          // cam. Cùng một <MyButton variant="primary">, chỉ thêm prop tooltip là đổi màu.
          // Button.tsx thuộc vùng cấm (components-ui) nên sửa từ nguồn: cho theme cũng là teal.
          // Sau thay đổi này CẢ HAI nhánh đều ra teal, và `.primary !important` chỉ còn dư thừa
          // vô hại. ĐỪNG "dọn" mấy dòng này về cam - đó chính là lỗi cũ.
          btn: {
            primary: {
              bg: "var(--primary)",
              focusBg: "var(--primary)",
              hoverBg: "var(--primary)",
              selectedBg: "var(--primary)",
              disabledBg: "rgba(0, 117, 131, 0.6)",
            },
          },
        },
      },
    },
  }
);

// MỘT cây route duy nhất, gắn ở GỐC: /* -> AppRoutes. URL lạ do chính AppRoutes bắt (route "*"
// -> AppNotFoundPage), nên ở đây KHÔNG có nhánh Navigate dự phòng nào nữa.
// Lịch sử: từng có cây thứ hai (HocVuGate, hệ học vụ cũ, dùng Redux state.auth). Nó đã bị gỡ
// khỏi routing từ trước lô dọn này, và toàn bộ màn hệ học vụ đã bị XOÁ ở D1 - repo ClientApp
// nay chỉ phục vụ Cổng Vận động tài trợ.
// AppRoutes tự khai <Routes> con, khớp TƯƠNG ĐỐI so với lớp <Route path="/*"> ở đây.
// D2: `colorMode` TRƯỚC ĐÂY đọc từ Redux — `useAppSelector(x => x.common.layout).themeMode`.
// Đọc lại reducer thì thấy nó khởi tạo `eThemeMode.light` và CHỈ đổi qua một action mà cổng
// Cựu SV KHÔNG BAO GIỜ dispatch (đã grep: 0 lời gọi useAppDispatch trong toàn nhánh alumni).
// Tức giá trị chạy thật luôn là "light" — một hằng số đi vòng qua cả một store Redux.
// Cổng cũng KHÔNG có nút bật/tắt giao diện tối ở bất kỳ màn nào.
// => Khai thẳng hằng số. Khi nào cổng thật sự cần giao diện tối thì đổi thành useState +
//    localStorage NGAY TẠI ĐÂY, không cần dựng lại Redux.
// Giữ ĐÚNG chuỗi "light" mà eThemeMode.light sinh ra trước đây - Primer nhận cả "day" lẫn
// "light", nhưng đây là lô GỠ chứ không phải lô đổi hành vi.
const COLOR_MODE = "light" as const;

function AppContent() {
  useWebIcon(appConst.appURLLogo);

  return (
    <Router>
      {/* Toaster DUY NHẤT của toàn app (FIX #17: gộp - trước đây có thêm 1 <Toaster> nữa trong
          contexts/common.tsx gây toast hiện lặp 2 nơi). Giữ style success/error xanh/đỏ vốn có
          ở common.tsx để không đổi cảm nhận. Mọi lời gọi NotifyHelper.* (helpers/toast.ts) không
          đổi. */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          success: { style: { background: '#1B7F36', color: '#fff' } },
          error: { style: { background: '#A30F26', color: '#fff' } },
          // Cảnh báo. react-hot-toast KHÔNG có loại "warning" riêng - NotifyHelper.Warning gọi
          // hotToast() trần, tức loại "blank", nên style của cảnh báo khai ở đây. Không có chỗ
          // nào khác trong repo gọi toast blank, nên khoá này phục vụ riêng cảnh báo.
          // (Trước đây Warning gọi hotToast.error -> cảnh báo hiện icon lỗi + nền đỏ, người dùng
          // không phân biệt được "chú ý" với "thất bại".)
          blank: { style: { background: 'var(--attention-fg)', color: '#fff' } },
        }}
      />
      {/* ĐÃ BỎ <CommonProvider> (D2). Đọc contexts/common.tsx thì nó là một cái VỎ RỖNG:
          `CommonStoreType = {}`, `store = {}`, và biến `user` đọc từ Redux rồi KHÔNG dùng vào
          việc gì. `useCommonContext` được export nhưng KHÔNG file nào import (đã grep).
          Nó chỉ còn tác dụng duy nhất là kéo `state/reducers/rootReducer` vào cây phụ thuộc. */}
        <ThemeProvider theme={customTheme} colorMode={COLOR_MODE}>
          <BaseStyles>
            <Routes>
              <Route path="/*" element={<AppRoutes />} />
            </Routes>
          </BaseStyles>
        </ThemeProvider>
    </Router>
  );
}

function App() {
  return (
    <AppAuthProvider>
      <AppContent />
    </AppAuthProvider>
  );
}

export default App;
