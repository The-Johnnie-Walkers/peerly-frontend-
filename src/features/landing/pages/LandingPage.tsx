import { motion } from 'framer-motion';
import { MessageCircle, Users, ShieldCheck, ChevronDown } from 'lucide-react';
import NavBar from '@/features/landing/components/NavBar';
import PeerlyLogo from '../../../assets/peerly-logo.png';
import BenefitsCard from '../components/BenefitsCard';
import TestimonialsSection from '../components/TestimonialsSection';
import Footer from '../components/Footer';
import Aurora from '../../../shared/components/ui/aurora';
import BubbleBackground from '@/shared/components/ui/bubble-background';

const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
};

export default function LandingPage() {
    return (
        <div className='scroll-smooth' id="peerly">
            <NavBar/>
            <div className="relative flex min-h-screen justify-center">
                <BubbleBackground showGlow />
                <div className="relative z-10 flex flex-col items-center justify-center">
                    <motion.img
                        className="w-65 h-60 object-contain"
                        src={PeerlyLogo}
                        alt="peerly-logo"
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                    <motion.h1
                        className="text-8xl font-bold pr-6"
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
                    >
                        Peerly
                    </motion.h1>
                </div>
                <motion.div
                    className="absolute bottom-14 flex flex-col items-center gap-1 text-black-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 0.6 }}
                >
                    <span className="text-xs tracking-widest uppercase text-black">Scroll</span>
                    <ChevronDown size={20} className="animate-bounce" />
                </motion.div>
            </div>
            <section id="what-is" className="relative flex items-center overflow-hidden min-h-screen">
                <Aurora className="absolute inset-0 z-0" />
                <div className="relative z-10 max-w-3xl mx-auto">
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                    >
                        <h2 className="text-4xl font-bold mb-2">
                            ¿Qué es{' '}
                            <span className="text-[#C87C65]">Peerly</span>?
                        </h2>
                        <div className="w-16 h-1 bg-[#C87C65] rounded mb-8" />
                    </motion.div>

                    <motion.p
                        className="text-gray-600 text-lg leading-relaxed mb-8"
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
                    >
                        En el entorno universitario, los cambios de horarios, materias y compañeros cada semestre genera una desconexión social
                        que empuja a muchos estudiantes al aislamiento o la dificultad de establecer nuevas redes de contacto. Existe una barrera
                        psicológica y social donde el temor al rechazo y la pena de la primera interacción presencial impiden que las personas
                        que comparten el mismo espacio físico, intereses, carreras o clases en común logren conectar de manera natural.
                    </motion.p>

                    <motion.p
                        className="border-l-4 border-[#C87C65] pl-5 text-xl font-semibold text-gray-800 leading-relaxed"
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
                    >
                        Peerly es una red social universitaria donde los estudiantes puedan conectar y hacer actividades por medio de intereses,
                        disponibilidad horaria y carreras en común.
                    </motion.p>
                </div>
            </section>
            <section id="benefits" className="relative flex overflow-hidden items-center min-h-screen p-10">
                <div className="max-w-5xl mx-auto">
                    <BubbleBackground showGlow />
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="mb-12"
                    >
                        <h2 className="text-4xl font-bold mb-2">
                            <span className="text-[#C87C65]">Beneficios</span>
                        </h2>
                        <div className="w-16 h-1 bg-[#C87C65] rounded" />
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <BenefitsCard
                            icon={MessageCircle}
                            title="Deja la pena!"
                            content={'La app llega a solucionar ese típico \u201cme da pena hablarle\u201d bajándole la intensidad al primer contacto. Todo empieza desde lo digital, dentro del campus, donde la gente se siente más tranquila. Además, con un sistema de matchmaking según intereses, carrera y tiempos, conectar deja de ser incómodo y se vuelve algo natural.'}
                            delay={0}
                        />
                        <BenefitsCard
                            icon={Users}
                            title="El mismo campus, pero más bacano"
                            content="Ya no toca depender solo de verse en persona: la gente puede ir armando planes, conociéndose y participando más tanto dentro como fuera de la U, ya sea con planes improvisados o más organizados."
                            delay={0.15}
                        />
                        <BenefitsCard
                            icon={ShieldCheck}
                            title="Un parche seguro pa' todos"
                            content="La app es solo para estudiantes de la misma universidad, así que el ambiente es más confiable. Esto ayuda a que más gente se anime a salir de la zona de confort, dejar de estar sola en la U y empezar a conocer gente de otras carreras en un espacio seguro y relajado."
                            delay={0.3}
                        />
                    </div>
                </div>
            </section>
            <div id="opinions">
                <TestimonialsSection/>
            </div>
            <Footer/>
        </div>
    );
}