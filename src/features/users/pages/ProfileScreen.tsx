import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit3 } from 'lucide-react';
import { MOCK_STUDENTS, INTERESTS } from '@/shared/data/mockData';
import { SafeRemoteImage } from '@/shared/components/SafeRemoteImage';
import { useCurrentUser } from '@/shared/contexts/CurrentUserContext';

const ME_FIXED = {
  id: 'me',
  name: 'Camilo Pérez',
  photo: 'https://picsum.photos/seed/peerly-me/400/400',
  career: 'Ingeniería de Sistemas',
  semester: 6,
  compatibility: 100,
  isOnline: true,
} as const;

const ProfileScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile: currentUserProfile } = useCurrentUser();
  const isOwnProfile = !id;

  const student = id
    ? MOCK_STUDENTS.find(s => s.id === id)
    : {
        ...ME_FIXED,
        interests: currentUserProfile.interests,
        bio: currentUserProfile.bio,
        availability: currentUserProfile.availability,
      };

  if (!student) {
    return (
      <div className="h-svh flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Usuario no encontrado</p>
      </div>
    );
  }

  // Shared interests for other profiles
  const myInterests = ['coding', 'coffee', 'music', 'gaming'];
  const sharedInterests = !isOwnProfile ? student.interests.filter(i => myInterests.includes(i)) : [];

  return (
    <div className="min-h-svh flex flex-col bg-background">
      {/* Centered column on desktop, full width on mobile */}
      <div className="flex-1 flex flex-col w-full max-w-2xl mx-auto">
        {/* Header */}
        {!isOwnProfile && (
          <header className="flex-shrink-0 px-4 sm:px-6 py-4 flex items-center justify-between z-10">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(-1)}
              className="p-2.5 bg-card/80 backdrop-blur rounded-xl"
            >
              <ArrowLeft size={18} />
            </motion.button>
          </header>
        )}

        <div className="flex-1 overflow-y-auto pb-24 px-4 sm:px-6">
          {/* Cover + Avatar — no overflow-hidden so avatar is not clipped */}
          <div className="relative rounded-t-2xl md:rounded-2xl md:mx-0">
            <div className="h-44 md:h-52 bg-gradient-to-br from-primary to-secondary rounded-t-2xl md:rounded-2xl" />
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
              <div className="relative">
                <SafeRemoteImage
                  src={student.photo}
                  alt={student.name}
                  className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover border-4 border-background shadow-elevated"
                />
                {student.isOnline && (
                  <div className="absolute bottom-1 right-1 w-4 h-4 bg-success rounded-full border-2 border-background" />
                )}
              </div>
            </div>
          </div>

          <div className="pt-16 px-0 md:px-4 text-center">
            <h1 className="text-2xl md:text-3xl font-display font-extrabold">{student.name}</h1>
            <p className="text-sm md:text-base text-muted-foreground mb-1">{student.career} · {student.semester}° semestre</p>

            {isOwnProfile && (
              <div className="flex items-center justify-center gap-6 md:gap-8 my-4">
                <div className="text-center">
                  <p className="font-display font-extrabold text-lg md:text-xl">24</p>
                  <p className="text-[10px] md:text-xs font-mono text-muted-foreground">Conexiones</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center">
                  <p className="font-display font-extrabold text-lg md:text-xl">8</p>
                  <p className="text-[10px] md:text-xs font-mono text-muted-foreground">Actividades</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center">
                  <p className="font-display font-extrabold text-lg md:text-xl">94%</p>
                  <p className="text-[10px] md:text-xs font-mono text-muted-foreground">Perfil</p>
                </div>
              </div>
            )}

            {!isOwnProfile && (
              <div className="flex items-center justify-center gap-2 my-3">
                <div className="bg-success/10 px-3 py-1 rounded-full">
                  <span className="text-xs font-mono font-bold text-success">{student.compatibility}% Compatible</span>
                </div>
              </div>
            )}

            <p className="text-foreground/80 text-sm md:text-base mb-6 leading-relaxed max-w-xl mx-auto">{student.bio}</p>
          </div>

          {/* Interests */}
          <div className="mb-6 px-0 md:px-4">
            <h3 className="font-display font-bold text-sm md:text-base mb-3">
              {isOwnProfile ? 'Tus intereses' : 'Intereses'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {student.interests.map(id => {
                const interest = INTERESTS.find(i => i.id === id);
                const isShared = sharedInterests.includes(id);
                return interest ? (
                  <span
                    key={id}
                    className={`px-3 py-1.5 rounded-full text-xs md:text-sm font-medium border ${
                      isShared
                        ? 'bg-primary/10 border-primary/30 text-primary font-bold'
                        : 'bg-accent border-border text-accent-foreground'
                    }`}
                  >
                    {isShared && '✨ '}{interest.label}
                  </span>
                ) : null;
              })}
            </div>
          </div>

          {/* Availability — bloques/franjas */}
          <div className="mb-6 px-0 md:px-4">
            <h3 className="font-display font-bold text-sm md:text-base mb-3">Disponibilidad</h3>
            {student.availability.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin franjas definidas.</p>
            ) : (
              <ul className="flex flex-wrap gap-2 list-none p-0 m-0">
                {student.availability.map((block, i) => (
                  <li
                    key={block.id ?? i}
                    className="px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-sm font-mono font-medium text-foreground"
                  >
                    {block.day} {block.start}–{block.end}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* CTA — in flow, at bottom of page (not fixed) */}
          <div className="pt-4 pb-2 md:px-0">
            {isOwnProfile ? (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate('/profile/edit')}
                className="w-full p-4 rounded-2xl bg-primary text-primary-foreground font-display font-bold flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Edit3 size={18} /> Editar perfil
              </motion.button>
            ) : (
              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => navigate('/chats')}
                  className="flex-1 p-4 rounded-2xl bg-primary text-primary-foreground font-display font-bold"
                >
                  Conectar 🤝
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  className="flex-1 p-4 rounded-2xl bg-card border-2 border-primary text-primary font-display font-bold"
                >
                  Proponer plan
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
