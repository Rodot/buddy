import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";

interface ToastMessage {
  id: string;
  message: string;
  timestamp: number;
}

interface ToastContextType {
  showToast: (message: string) => void;
  currentToast: ToastMessage | null;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [currentToast, setCurrentToast] = useState<ToastMessage | null>(null);
  const [timeoutId, setTimeoutId] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  const showToast = (message: string) => {
    // Clear existing timeout if any
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Create new toast message
    const newToast: ToastMessage = {
      id: Date.now().toString(),
      message,
      timestamp: Date.now(),
    };

    setCurrentToast(newToast);

    // Set new timeout for 3000ms
    const newTimeoutId = setTimeout(() => {
      setCurrentToast(null);
      setTimeoutId(null);
    }, 3000);

    setTimeoutId(newTimeoutId);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return (
    <ToastContext.Provider value={{ showToast, currentToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

function ToastContainer() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("ToastContainer must be used within a ToastProvider");
  }

  const { currentToast } = context;

  return (
    <AnimatePresence>
      {currentToast && (
        <motion.div
          id="toast"
          key={currentToast.id}
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ duration: 0.3 }}
          className="toast toast-top toast-center z-60"
        >
          <div className="alert font-semibold">
            <span>{currentToast.message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
