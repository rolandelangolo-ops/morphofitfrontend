import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AppIcon } from "../../../components/ui/icons";

export function LightboxModal({ url, onClose }: { url: string | null; onClose: () => void }) {
  return createPortal(
    <AnimatePresence>
      {url && (
        <motion.div
          className="fixed inset-0 z-[1250] flex items-center justify-center p-6"
          style={{ background: "rgba(10,10,13,0.92)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full"
            style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}
          >
            <AppIcon name="close" size={18} />
          </button>
          <motion.img
            src={url}
            alt=""
            className="max-h-full max-w-full rounded-lg object-contain"
            initial={{ scale: 0.94 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.94 }}
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
