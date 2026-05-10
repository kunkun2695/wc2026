import React from 'react';
import { User } from 'lucide-react';

const UserAvatar = ({ src, className, size = 40 }) => {
  const isUrl = src && (src.startsWith('http') || src.startsWith('https') || src.startsWith('data:image/'));

  if (isUrl) {
    return (
      <img 
        src={src} 
        alt="avatar" 
        className={className} 
        style={{ width: size, height: size, borderRadius: 'inherit', objectFit: 'cover' }}
        onError={(e) => {
          e.target.onerror = null;
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'flex';
        }}
      />
    );
  }

  // Nếu là Emoji hoặc Text
  return (
    <div 
      className={className} 
      style={{ 
        width: size, 
        height: size, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        fontSize: size * 0.5,
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 'inherit',
        color: 'white'
      }}
    >
      {src || <User size={size * 0.6} />}
    </div>
  );
};

export default UserAvatar;
