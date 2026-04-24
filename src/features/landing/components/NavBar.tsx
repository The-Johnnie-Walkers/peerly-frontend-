import { useState } from 'react';

const principal = { label: 'Peerly', href: '#peerly'}
const navItems = [
    { label: 'Que es?', href: '#what-is'},
    { label: 'Beneficios', href: '#benefits'},
    { label: 'Opiniones', href: '#opinions'},
]

const navItemClass = "relative text-sm font-medium text-gray-700 hover:text-[#C87C65] transition-colors duration-200 after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 after:bg-[#C87C65] after:transition-all after:duration-200 hover:after:w-full";

export default function NavBar() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <nav aria-label="Navegación principal" className="bg-transparent backdrop-blur-sm w-full sticky top-0 z-50 shadow-sm">
            <div className="flex items-center justify-between h-12 px-6">
                
                <a href={principal.href} className="font-bold text-2xl">{principal.label}</a>

                {/* Desktop menu */}
                <ul className="hidden md:flex gap-20">
                    {navItems.map(({ label, href }) => (
                        <li key={label}>
                            <a href={href} className={navItemClass}>{label}</a>
                        </li>
                    ))}
                </ul>

                <a href='/login' className="hidden md:block bg-[#C87C65] rounded p-1.5 text-white hover:bg-[#b56b55] transition-colors duration-200">
                    Empieza aqui
                </a>

                {/* Hamburger button (mobile only) */}
                <button
                    className="md:hidden flex flex-col justify-center gap-1.5 p-2"
                    aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    <span className={`block h-0.5 w-6 bg-gray-700 transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                    <span className={`block h-0.5 w-6 bg-gray-700 transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
                    <span className={`block h-0.5 w-6 bg-gray-700 transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
                </button>
            </div>

            {/* Mobile dropdown menu */}
            {menuOpen && (
                <div className="md:hidden flex flex-col items-start gap-4 px-6 pb-4 bg-white/95">
                    {navItems.map(({ label, href }) => (
                        <a
                            key={label}
                            href={href}
                            className={navItemClass}
                            onClick={() => setMenuOpen(false)}
                        >
                            {label}
                        </a>
                    ))}
                    <a href='/login' className="bg-[#C87C65] rounded p-1.5 text-white w-full hover:bg-[#b56b55] transition-colors duration-200">
                        Empieza aqui
                    </a>
                </div>
            )}
        </nav>
    );
}
