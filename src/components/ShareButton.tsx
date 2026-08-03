'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './ShareButton.module.css';

interface EventData {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  event_date: string;
  image_url?: string;
}

interface ShareButtonProps {
  event: EventData;
}

export default function ShareButton({ event }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getEventUrl = () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/agenda#event-${event.id}`;
  };

  const getFormattedDate = () => {
    try {
      const date = new Date(event.event_date);
      const tzOptions: Intl.DateTimeFormatOptions = { timeZone: 'America/Merida' };
      const dayName = new Intl.DateTimeFormat('es-MX', { ...tzOptions, weekday: 'long' }).format(date);
      const dayNum = new Intl.DateTimeFormat('es-MX', { ...tzOptions, day: 'numeric' }).format(date);
      const monthStr = new Intl.DateTimeFormat('es-MX', { ...tzOptions, month: 'long' }).format(date);
      const timeStr = new Intl.DateTimeFormat('es-MX', { ...tzOptions, hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
      
      const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      return `${capitalizedDay} ${dayNum} de ${monthStr} a las ${timeStr} h`;
    } catch {
      return '';
    }
  };

  const handleWhatsAppShare = () => {
    const eventUrl = getEventUrl();
    const dateFormatted = getFormattedDate();
    
    let text = `*${event.title}* 🎵\n`;
    if (dateFormatted) {
      text += `📅 ${dateFormatted}\n`;
    }
    text += `📍 Museo de la Canción Yucateca\n\n`;
    text += `🖼️ Ver cartel y detalles del evento:\n${eventUrl}`;

    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  const handleCopyLink = async () => {
    const eventUrl = getEventUrl();
    try {
      await navigator.clipboard.writeText(eventUrl);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setIsOpen(false);
      }, 2000);
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
    }
  };

  const handleNativeShare = async () => {
    const eventUrl = getEventUrl();
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: `${event.title} | Museo de la Canción Yucateca`,
          text: `Te invito a: ${event.title} en el Museo de la Canción Yucateca.`,
          url: eventUrl,
        });
        setIsOpen(false);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className={styles.shareContainer} ref={dropdownRef}>
      <button 
        type="button" 
        className={`${styles.shareButton} ${isOpen ? styles.active : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Compartir evento"
        aria-expanded={isOpen}
      >
        <svg 
          className={styles.shareIcon} 
          width="14" 
          height="14" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <circle cx="18" cy="5" r="3"></circle>
          <circle cx="6" cy="12" r="3"></circle>
          <circle cx="18" cy="19" r="3"></circle>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
        <span>Compartir</span>
      </button>

      {isOpen && (
        <div className={styles.dropdownMenu}>
          <button 
            type="button" 
            className={styles.menuItem} 
            onClick={handleWhatsAppShare}
          >
            <svg 
              className={styles.whatsappIcon} 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
            <span>Enviar cartel por WhatsApp</span>
          </button>

          <button 
            type="button" 
            className={styles.menuItem} 
            onClick={handleCopyLink}
          >
            {copied ? (
              <>
                <svg className={styles.checkIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span className={styles.copiedText}>¡Enlace copiado!</span>
              </>
            ) : (
              <>
                <svg className={styles.linkIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
                <span>Copiar enlace del cartel</span>
              </>
            )}
          </button>

          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button 
              type="button" 
              className={styles.menuItem} 
              onClick={handleNativeShare}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
              <span>Otras aplicaciones...</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
