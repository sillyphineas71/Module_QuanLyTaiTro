import { useState, useEffect } from 'react'

export const useWindowSize = () => {
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: window.innerWidth <= 576
    })

    useEffect(() => {
        let timeoutId: any;
        const handler = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setWindowSize({
                    width: window.innerWidth,
                    height: window.innerHeight,
                    isMobile: window.innerWidth <= 576
                })
            }, 100);
        }
        window.addEventListener('resize', handler)

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', handler)
        }
    }, [])

    return windowSize
}