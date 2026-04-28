import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import Aurora from '@/shared/components/ui/aurora';

const testimonials = [
    {
        name: 'Laura M.',
        career: 'Ing. de Sistemas · 6to semestre',
        initials: 'LM',
        text: 'Conocí a mis mejores amigos del semestre gracias a Peerly. Nunca pensé que una app me ayudaría a perderle la pena a hablarle a gente nueva en la U.',
    },
    {
        name: 'Sebastián R.',
        career: 'Economia · 4to semestre',
        initials: 'SR',
        text: 'Armé un grupo de estudio con gente de mi carrera en menos de un día. Antes me tocaba buscar en grupos de WhatsApp desorganizados.',
    },
    {
        name: 'Valeria T.',
        career: 'Ing. Civil · 5to semestre',
        initials: 'VT',
        text: 'Lo que más me gusta es que todos son de la misma universidad. Uno siente más confianza para conectar y proponer planes.',
    },
];

const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 80 : -80,
        opacity: 0,
    }),
    center: {
        x: 0,
        opacity: 1,
    },
    exit: (direction: number) => ({
        x: direction > 0 ? -80 : 80,
        opacity: 0,
    }),
};

const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
};

export default function TestimonialsSection() {
    const [index, setIndex] = useState(0);
    const [direction, setDirection] = useState(1);

    const prev = () => {
        setDirection(-1);
        setIndex((i) => (i - 1 + testimonials.length) % testimonials.length);
    };

    const next = () => {
        setDirection(1);
        setIndex((i) => (i + 1) % testimonials.length);
    };

    const current = testimonials[index];

    return (
        <section className="relative flex items-center overflow-hidden min-h-screen">
            <Aurora className="absolute inset-0 z-0" />
            <div className="relative z-10 max-w-2xl mx-auto w-full px-6 sm:px-8 py-16">
                <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="mb-12"
                >
                    <h2 className="text-3xl sm:text-4xl font-bold mb-2">
                        <span className="text-[#C87C65]">Opiniones</span>
                    </h2>
                    <div className="w-16 h-1 bg-[#C87C65] rounded" />
                </motion.div>

                <div className="relative flex items-center gap-4">
                    <button
                        onClick={prev}
                        aria-label="Opinion anterior"
                        className="flex-shrink-0 w-10 h-10 rounded-full border border-gray-200 bg-white shadow-sm flex items-center justify-center hover:bg-[#C87C65] hover:text-white hover:border-[#C87C65] transition-colors duration-200"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <div className="overflow-hidden flex-1">
                        <AnimatePresence mode="wait" custom={direction}>
                            <motion.div
                                key={index}
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.35, ease: 'easeInOut' }}
                                className="bg-white rounded-2xl shadow-md p-5 sm:p-8 flex flex-col gap-5"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-[#C87C65]/15 flex items-center justify-center text-[#C87C65] font-bold text-lg flex-shrink-0">
                                        {current.initials}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">{current.name}</p>
                                        <p className="text-sm text-gray-500">{current.career}</p>
                                    </div>
                                </div>

                                <div className="flex gap-1">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star key={i} size={16} className="fill-[#C87C65] text-[#C87C65]" />
                                    ))}
                                </div>

                                <p className="text-gray-600 leading-relaxed text-sm sm:text-base italic">
                                    &ldquo;{current.text}&rdquo;
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={next}
                        aria-label="Siguiente opinion"
                        className="flex-shrink-0 w-10 h-10 rounded-full border border-gray-200 bg-white shadow-sm flex items-center justify-center hover:bg-[#C87C65] hover:text-white hover:border-[#C87C65] transition-colors duration-200"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Dot indicators */}
                <div className="flex justify-center gap-2 mt-6">
                    {testimonials.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => { setDirection(i > index ? 1 : -1); setIndex(i); }}
                            aria-label={`Ver opinion ${i + 1}`}
                            className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                                i === index ? 'bg-[#C87C65] w-6' : 'bg-gray-300 hover:bg-gray-400'
                            }`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
