import { motion } from 'framer-motion';
import { InterestIcon } from './InterestIcon';

interface PeerlyChipProps {
  label: string;
  iconName: string;
  active: boolean;
  onClick: () => void;
}

export const PeerlyChip = ({ label, iconName, active, onClick }: PeerlyChipProps) => (
  <motion.button
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`px-4 py-2.5 rounded-full flex items-center gap-2 border transition-all text-sm font-medium ${
      active
        ? 'bg-secondary border-secondary text-secondary-foreground'
        : 'bg-accent border-border text-foreground hover:border-secondary/50'
    }`}
  >
    <InterestIcon name={iconName} size={16} />
    <span>{label}</span>
  </motion.button>
);
