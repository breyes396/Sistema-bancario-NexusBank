import { useEffect, useState } from 'react';

export const AnimatedLogo = () => {
  const [done, setDone] = useState(false);
  const [fadeOutVideo, setFadeOutVideo] = useState(false);

  useEffect(() => {
    if (!done) {
      return undefined;
    }

    const timer = window.setTimeout(() => setFadeOutVideo(true), 220);
    return () => window.clearTimeout(timer);
  }, [done]);

  return (
    <div className="animated-logo-root">
      <video
        className={`animated-logo-video ${fadeOutVideo ? 'is-hidden' : ''}`}
        src="/src/assets/img/Sinfondo.webm"
        autoPlay
        muted
        playsInline
        onEnded={() => setDone(true)}
      />

      {(done || fadeOutVideo) ? (
        <img className={`auth-left-logo ${done ? 'is-visible' : ''}`} src="/src/assets/img/Logo.jpg" alt="NexusBank" />
      ) : null}
    </div>
  );
};

export default AnimatedLogo;
