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
            <div className="flex items-center justify-between h-16 px-6">
                <a href={principal.href} className="font-bold text-2xl">{principal.label}</a>

                {/* Desktop menu */}
                <ul className="hidden md:flex gap-20">
                    {navItems.map(({ label, href }) => (
                        <li key={label}>
                            <a href={href} className={navItemClass}>{label}</a>
                        </li>
                    ))}
                </ul>

                <a href='/login' className="hidden md:block bg-[#C87C65] rounded-lg px-4 py-2 text-sm font-medium text-white hover:bg-[#b56b55] transition-colors duration-200">
                    Empieza aquí
                </a>

                {/* Hamburger button (mobile only) */}
                <button
                    className="md:hidden flex flex-col justify-center gap-[5px] p-3 -mr-1 rounded-lg hover:bg-gray-100 transition-colors"
                    aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    <span className={`block h-0.5 w-6 bg-gray-700 transition-all duration-300 origin-center ${menuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
                    <span className={`block h-0.5 w-6 bg-gray-700 transition-all duration-300 ${menuOpen ? 'opacity-0 scale-x-0' : ''}`} />
                    <span className={`block h-0.5 w-6 bg-gray-700 transition-all duration-300 origin-center ${menuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
                </button>
            </div>

            {/* Mobile dropdown menu */}
            {menuOpen && (
                <div className="md:hidden flex flex-col bg-white/95 border-t border-gray-100 shadow-md">
                    {navItems.map(({ label, href }) => (
                        <a
                            key={label}
                            href={href}
                            className="px-6 py-4 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-[#C87C65] border-b border-gray-100 transition-colors"
                            onClick={() => setMenuOpen(false)}
                        >
                            {label}
                        </a>
                    ))}
                    <div className="px-6 py-4">
                        <a
                            href='/login'
                            className="block bg-[#C87C65] rounded-xl py-3 text-center text-base font-semibold text-white hover:bg-[#b56b55] transition-colors duration-200"
                        >
                            Empieza aquí
                        </a>
                    </div>
                </div>
            )}
        </nav>
    );
}
