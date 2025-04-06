import React, { useEffect } from "react";

interface ActionMessageProps {
    message: string;
    isVisible: boolean;
    onHide?: () => void;
    duration?: number;
    position?: "bottom" | "top";
    className?: string;
}

const ActionMessage: React.FC<ActionMessageProps> = ({
                                                         message,
                                                         isVisible,
                                                         onHide,
                                                         duration = 3000,
                                                         position = "bottom",
                                                         className = ""
                                                     }) => {
    useEffect(() => {
        let timer: NodeJS.Timeout;

        if (isVisible && onHide) {
            timer = setTimeout(() => {
                onHide();
            }, duration);
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [isVisible, duration, onHide]);

    if (!isVisible) return null;

    const positionClass = position === "bottom"
        ? "bottom-8 left-1/2 transform -translate-x-1/2"
        : "top-8 left-1/2 transform -translate-x-1/2";

    return (
        <div
            className={`fixed ${positionClass} bg-[#3b3e88] text-white py-2 px-4 rounded-full shadow-lg transition-opacity duration-300 z-50 ${className}`}
        >
            {message}
        </div>
    );
};

export default ActionMessage;