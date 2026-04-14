import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface BenefitsCardProps {
    title: string;
    content: string;
    icon: LucideIcon;
    delay?: number;
}

const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
};

export default function BenefitsCard({ title, content, icon: Icon, delay = 0 }: BenefitsCardProps) {
    return (
        <motion.div
            className="bg-white rounded-xl shadow-md flex flex-col overflow-hidden border border-transparent hover:border-[#C87C65] hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay }}
        >
            <div className="h-1 bg-[#C87C65] w-full" />
            <div className="p-6 flex flex-col gap-4">
                <div className="w-12 h-12 rounded-full bg-[#C87C65]/10 flex items-center justify-center">
                    <Icon className="text-[#C87C65]" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm">{content}</p>
            </div>
        </motion.div>
    );
}
