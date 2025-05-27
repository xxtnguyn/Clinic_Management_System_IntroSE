import { createContext, useContext, useState, useMemo, ReactNode } from "react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

// Định nghĩa kiểu dữ liệu cho context
interface ErrorContextType {
    error: string;
    showError: (message: string) => void;
}

// Tạo Context
const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

// Component ToastMessage (Hiển thị lỗi)
function ToastMessage({ message }: { message: string }) {
    return (
        <div className="fixed bottom-4 right-4 bg-white text-black border border-red-500 p-2 rounded-md flex items-center gap-2 shadow-md z-[9999]">
            <ExclamationCircleIcon className="w-6 h-6 text-red-500" />
            <span>{message}</span>
        </div>
    );
}

// Tạo Provider để bọc toàn bộ app
export function ErrorProvider({ children }: { children: ReactNode }) {
    const [error, setError] = useState<string>("");

    const showError = (message: string) => {
        setError(message);
        setTimeout(() => setError(""), 3000); // Tự động ẩn sau 3 giây
    };

    const memoizedChildren = useMemo(() => children, [children]);

    return (
        <ErrorContext.Provider value={{ error, showError }}>
            {memoizedChildren}
            {error && <ToastMessage message={error} />}
        </ErrorContext.Provider>
    );
}

// Tạo hook để dễ dùng hơn
export function useError(): ErrorContextType {
    const context = useContext(ErrorContext);
    if (!context) {
        throw new Error("useError must be used within an ErrorProvider");
    }
    return context;
}
