export default function Footer() {
    return (
        <footer className="border-t border-gray-200 py-4 px-6 ">
            
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex flex-col items-center md:items-start gap-1">
                    <span className="font-bold text-2xl">Peerly</span>
                    <span className="text-sm text-gray-500">Conecta y Comparte.</span>
                </div>
                <div className="mt-8 text-center text-xs text-gray-500">
                    © {new Date().getFullYear()} Peerly · Hecho con amor para la U
                </div>
            </div>


        </footer>
    );
}
