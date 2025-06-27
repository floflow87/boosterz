import { TrophySystem, UserTrophyStats } from "@/utils/trophySystem";

interface TrophyAvatarProps {
  userStats: UserTrophyStats;
  avatarSrc?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12', 
  lg: 'w-16 h-16',
  xl: 'w-24 h-24'
};

export default function TrophyAvatar({ userStats, avatarSrc, size = 'md', className = '' }: TrophyAvatarProps) {
  const trophies = TrophySystem.calculateAllTrophies(userStats);
  const highestRarity = TrophySystem.getHighestAchievedRarity(trophies);
  const borderClass = TrophySystem.getAvatarBorderClass(highestRarity);

  return (
    <div className={`${sizeClasses[size]} ${borderClass} rounded-full overflow-hidden ${className}`}>
      {avatarSrc ? (
        <img 
          src={avatarSrc} 
          alt="Avatar" 
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold">
          ?
        </div>
      )}
    </div>
  );
}