import { useEffect, useState } from 'react';

type Position = {
    x: number;
    y: number;
};

export function useElementPosition(ref?: React.MutableRefObject<any>): Position {
    const [position, setPosition] = useState<Position>({ x: 0, y: 0 });

    useEffect(() => {
        let timeoutId: any;
        const updatePosition = () => {
            if (!ref?.current) return;
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                if (!ref?.current) return;
                const rect = ref.current.getBoundingClientRect();
                setPosition({
                    x: rect.left + window.scrollX,
                    y: rect.top + window.scrollY,
                });
            }, 100);

        };

        updatePosition();

        // Bắt scroll và resize từ window và các container
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [ref]);

    return position;
}
