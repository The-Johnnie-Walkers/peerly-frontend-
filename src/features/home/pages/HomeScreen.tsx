import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronRight, Loader2 } from 'lucide-react';
import { StudentCard } from '@/features/users/components/StudentCard';
import { ActivityCard } from '@/features/activities/components/ActivityCard';
import { userService, UserProfile } from '@/features/users/services/user.service';
import { useCurrentUser } from '@/shared/contexts/CurrentUserContext';
import { MOCK_ACTIVITIES, MOCK_NOTIFICATIONS, Notification, Student } from '@/shared/data/mockData';
import { NotificationPanel } from '@/shared/components/layout/NotificationPanel';

const HomeScreen = () => {
  const navigate = useNavigate();
  const { userData } = useCurrentUser();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [nearbyUsers, setNearbyUsers] = useState<Student[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await userService.getAllUsers();
        // Filtrar al usuario actual y mapear al formato Student que espera el componente
        const filteredUsers: Student[] = users
          .filter(u => u.id !== userData?.id)
          .map(u => ({
            id: u.id,
            name: `${u.name} ${u.lastname}`,
            photo: u.profilePicURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}+${encodeURIComponent(u.lastname)}&background=random`,
            career: u.programs?.[0] || 'Estudiante',
            semester: u.semester,
            interests: u.interests?.map(i => i.id) || [],
            bio: u.description || '',
            availability: u.freeTimeSchedule?.map(f => ({
              day: f.dayOfTheWeek,
              start: f.startsAt,
              end: f.endsAt
            })) || [],
            compatibility: Math.floor(Math.random() * 21) + 80,
            isOnline: true,
          }));
        setNearbyUsers(filteredUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [userData?.id]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-background rounded-none lg:rounded-[32px] shadow-elevated overflow-hidden">
      {/* Header */}
      <header className="p-6 pb-4 flex justify-between items-center bg-card/80 backdrop-blur-md sticky top-0 z-10">
        <div>
          <p className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest">Campus Central</p>
          <h2 className="text-xl font-display font-extrabold">
            ¡Hola, {userData?.name || 'Compañero'}!
          </h2>
        </div>
        <div className="flex gap-3 items-center">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 bg-accent rounded-xl relative"
            aria-label="Abrir notificaciones"
          >
            <Bell size={20} className="text-foreground" />
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-secondary rounded-full flex items-center justify-center text-[8px] font-mono font-bold text-secondary-foreground shadow-sm">
                {unreadCount}
              </div>
            )}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary overflow-hidden flex-shrink-0"
            aria-label="Ir a mi perfil"
          >
            {userData?.profilePicURL && (
              <img src={userData.profilePicURL} alt="Mi perfil" className="w-full h-full object-cover" />
            )}
          </motion.button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Hero prompt */}
        <div className="px-6 py-4">
          <p className="text-lg font-display font-bold text-foreground/80">
            ¿A quién quieres conocer hoy? 🐾
          </p>
        </div>

        {/* Quick Connect */}
        <section className="mb-8">
          <div className="flex justify-between items-center px-6 mb-4">
            <h3 className="font-display font-bold text-lg">Conecta ahora</h3>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/connect')}
              className="text-primary text-sm font-display font-bold flex items-center gap-1"
            >
              Ver todos <ChevronRight size={16} />
            </motion.button>
          </div>
          <div className="flex gap-3.5 overflow-x-auto px-6 pb-2 no-scrollbar min-h-[180px]">
            {isLoadingUsers ? (
              <div className="flex items-center justify-center w-full">
                <Loader2 className="animate-spin text-primary" size={24} />
              </div>
            ) : nearbyUsers.length > 0 ? (
              nearbyUsers.slice(0, 10).map((student, i) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <StudentCard
                    student={student}
                    compact
                    onClick={() => navigate(`/profile/${student.id}`)}
                  />
                </motion.div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground px-2">No hay usuarios disponibles.</p>
            )}
          </div>
        </section>

        {/* Activities */}
        <section className="px-6 pb-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display font-bold text-lg">Actividades cerca</h3>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/explore')}
              className="text-primary text-sm font-display font-bold flex items-center gap-1"
            >
              Explorar <ChevronRight size={16} />
            </motion.button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {MOCK_ACTIVITIES.slice(0, 8).map((activity, i) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
              >
                <ActivityCard
                  activity={activity}
                  onClick={() => navigate(`/activity/${activity.id}`)}
                />
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
      />
    </div>
  );
};

export default HomeScreen;
