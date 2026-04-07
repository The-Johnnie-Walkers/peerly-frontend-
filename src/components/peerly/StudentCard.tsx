import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { Student, INTERESTS } from '@/data/mockData';
import { SafeRemoteImage } from '@/components/peerly/SafeRemoteImage';

interface StudentCardProps {
  student: Student;
  onClick?: () => void;
  compact?: boolean;
}

export const StudentCard = ({ student, onClick, compact = false }: StudentCardProps) => {
  if (compact) {
    return (
      <motion.div
        whileTap={{ scale: 0.97 }}
        onClick={onClick}
        className="min-w-[150px] bg-card rounded-3xl p-3 shadow-card border border-border cursor-pointer"
      >
        <SafeRemoteImage
          src={student.photo}
          alt={student.name}
          className="w-full aspect-square object-cover rounded-2xl mb-3"
        />
        <p className="font-display font-bold text-sm truncate">{student.name}</p>
        <p className="text-[10px] text-muted-foreground mb-2 truncate">{student.career}</p>
        <div className="flex items-center gap-1 text-success font-mono font-bold text-[10px]">
          <CheckCircle2 size={10} /> {student.compatibility}% Compatible
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-card rounded-3xl overflow-hidden shadow-card border border-border cursor-pointer"
    >
      <div className="relative">
        <SafeRemoteImage
          src={student.photo}
          alt={student.name}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-3 right-3 bg-success px-2.5 py-1 rounded-full text-[10px] font-mono font-bold text-success-foreground">
          {student.compatibility}% Compatible
        </div>
        {student.isOnline && (
          <div className="absolute bottom-3 right-3 w-3 h-3 bg-success rounded-full border-2 border-card" />
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display font-bold text-base">{student.name}</h3>
        <p className="text-xs text-muted-foreground mb-2">{student.career} · {student.semester}° semestre</p>
        <div className="flex gap-1.5 flex-wrap">
          {student.interests.slice(0, 3).map(id => (
            <span key={id} className="px-2 py-0.5 bg-accent text-accent-foreground rounded-full text-[10px] font-mono font-medium">
              {INTERESTS.find(i => i.id === id)?.label}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
