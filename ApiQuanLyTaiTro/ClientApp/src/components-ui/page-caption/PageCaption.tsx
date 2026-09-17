import React from 'react';
import Text from '../text';
import { ITextProps } from '../text/Text';
interface IPageCaptionProps extends ITextProps {

}
const PageCaption = (props: IPageCaptionProps) => {
    return (
        <Text
            {...props}
            sx={{
                fontSize: 24,
                // 🔴 TRƯỚC ĐÂY là `"bolder"` - đã đổi sang 700 (2026-09-14).
                // `bolder` KHÔNG phải một weight, nó là phép TÍNH dựa trên weight của phần tử CHA:
                // cha 400-500 -> 700, nhưng cha 600-700 -> 900. Mà font Be Vietnam Pro chỉ nạp tới
                // 800 ⇒ rơi vào 900 là trình duyệt TỰ LÀM ĐẬM GIẢ, và chữ Việt có dấu bị bệt.
                // Component này lại dùng được ở bất kỳ đâu, nên không thể biết trước cha nặng bao nhiêu.
                fontWeight: 700,
                ...props.sx
            }}
        />
    );
};

export default PageCaption;