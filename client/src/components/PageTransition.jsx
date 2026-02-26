import { motion } from 'framer-motion';

const pageVariants = {
    initial: { opacity: 0, scale: 0.98, filter: 'blur(4px)' },
    in: { opacity: 1, scale: 1, filter: 'blur(0px)' },
    out: { opacity: 0, scale: 1.02, filter: 'blur(4px)' }
};

const pageTransition = {
    type: 'tween',
    ease: 'easeInOut',
    duration: 0.35
};

export default function PageTransition({ children, className = "" }) {
    return (
        <motion.div
            className={className}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
        >
            {children}
        </motion.div>
    );
}
