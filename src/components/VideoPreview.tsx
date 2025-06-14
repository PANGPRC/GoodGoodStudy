
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Pause, Volume2, VolumeX, Maximize, X } from 'lucide-react';

interface VideoPreviewProps {
  videoUrl: string;
  thumbnail: string;
  title: string;
  onClose: () => void;
  isOpen: boolean;
}

const VideoPreview = ({ videoUrl, thumbnail, title, onClose, isOpen }: VideoPreviewProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Reset states when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentTime(0);
      setIsPlaying(false);
      setIsLoading(true);
      setDuration(0);
      setHasError(false);
      setShowControls(true);
    }
  }, [isOpen]);

  // Initialize video when URL changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isOpen || !videoUrl) return;

    console.log('Initializing video with URL:', videoUrl);
    setIsLoading(true);
    setHasError(false);
    
    // Set video source
    video.src = videoUrl;
    video.muted = false;
    video.preload = 'metadata';
    
    const handleLoadedMetadata = () => {
      console.log('Video metadata loaded, duration:', video.duration);
      if (video.duration && isFinite(video.duration)) {
        setDuration(video.duration);
      }
      setIsLoading(false);
      setHasError(false);
    };

    const handleCanPlay = () => {
      console.log('Video can play');
      setIsLoading(false);
      setHasError(false);
    };

    const handleTimeUpdate = () => {
      if (video.currentTime !== undefined && isFinite(video.currentTime)) {
        setCurrentTime(video.currentTime);
      }
    };

    const handlePlay = () => {
      console.log('Video started playing');
      setIsPlaying(true);
    };
    
    const handlePause = () => {
      console.log('Video paused');
      setIsPlaying(false);
    };

    const handleError = (e: Event) => {
      console.error('Video error:', e);
      setIsLoading(false);
      setHasError(true);
    };

    // Add event listeners
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('error', handleError);

    // Load the video
    video.load();

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('error', handleError);
    };
  }, [videoUrl, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video || hasError || isLoading) return;

    try {
      if (isPlaying) {
        video.pause();
      } else {
        await video.play();
      }
    } catch (error) {
      console.error('Error toggling play:', error);
      setHasError(true);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen();
    }
  };

  const handleVideoClick = () => {
    if (!isLoading && !hasError) {
      togglePlay();
    }
  };

  const handleClose = () => {
    const video = videoRef.current;
    if (video && !video.paused) {
      video.pause();
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsLoading(true);
    setHasError(false);
    onClose();
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time) || !isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || duration === 0 || hasError || isLoading) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    video.currentTime = newTime;
  };

  if (!isOpen) return null;

  const progressPercentage = duration > 0 && isFinite(currentTime) ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <Card className="relative max-w-5xl w-full bg-black border-0">
        <div className="relative" onMouseMove={handleMouseMove}>
          <Button
            variant="ghost"
            onClick={handleClose}
            className="absolute top-4 right-4 z-20 bg-black/50 text-white hover:bg-black/70"
          >
            <X className="h-5 w-5" />
          </Button>

          <div className="absolute top-4 left-4 z-20 bg-black/50 text-white px-3 py-1 rounded">
            <h3 className="font-medium">{title} - Preview</h3>
          </div>

          <video
            ref={videoRef}
            className="w-full aspect-video bg-black cursor-pointer"
            poster={thumbnail}
            onClick={handleVideoClick}
            playsInline
          >
            Your browser does not support the video tag.
          </video>

          {isLoading && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          )}

          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-white text-center">
                <p className="text-lg mb-2">Unable to load video</p>
                <p className="text-sm opacity-75">Please try again later</p>
                <Button 
                  variant="outline" 
                  className="mt-4 text-white border-white"
                  onClick={() => {
                    setHasError(false);
                    setIsLoading(true);
                    if (videoRef.current) {
                      videoRef.current.load();
                    }
                  }}
                >
                  Retry
                </Button>
              </div>
            </div>
          )}

          <div
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
              showControls && !isLoading && !hasError ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Button
              variant="ghost"
              size="lg"
              onClick={togglePlay}
              className="bg-black/50 text-white hover:bg-black/70 w-16 h-16 rounded-full"
              disabled={isLoading || hasError}
            >
              {isPlaying ? (
                <Pause className="h-8 w-8" />
              ) : (
                <Play className="h-8 w-8 ml-1" />
              )}
            </Button>
          </div>

          <div
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
              showControls && !hasError ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div 
              className="w-full h-1 bg-white/30 rounded-full mb-4 cursor-pointer"
              onClick={handleSeek}
            >
              <div 
                className="h-full bg-red-500 rounded-full transition-all duration-200"
                style={{ width: `${Math.max(0, Math.min(100, progressPercentage))}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePlay}
                  className="text-white hover:bg-white/20"
                  disabled={isLoading || hasError}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/20"
                  disabled={hasError}
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>

                <span className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20"
                  disabled={hasError}
                >
                  <Maximize className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-900 text-white text-center">
          <p className="text-sm opacity-80">
            This is a preview of the course content. 
            <span className="font-medium"> Enroll to access the full course.</span>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default VideoPreview;
