import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface LessonPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: {
    title: string;
    duration: string;
    videoUrl?: string;
  } | null;
  courseTitle: string;
}

const LessonPlayer = ({ isOpen, onClose, lesson, courseTitle }: LessonPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video || !isLoaded || hasError) return;

    try {
      if (isPlaying) {
        video.pause();
      } else {
        await video.play();
      }
    } catch (error) {
      console.error('Error playing video:', error);
      setHasError(true);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSkip = (direction: 'forward' | 'back') => {
    const video = videoRef.current;
    if (!video || !isLoaded) return;
    
    const skipAmount = 10;
    if (direction === 'forward') {
      video.currentTime = Math.min(video.currentTime + skipAmount, totalTime);
    } else {
      video.currentTime = Math.max(video.currentTime - skipAmount, 0);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !isLoaded || totalTime === 0 || hasError) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * totalTime;
    video.currentTime = newTime;
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

  const handleClose = () => {
    const video = videoRef.current;
    if (video && !video.paused) {
      video.pause();
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setIsLoaded(false);
    setIsLoading(false);
    setHasError(false);
    onClose();
  };

  // Initialize video when lesson changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isOpen || !lesson?.videoUrl) {
      setIsLoaded(false);
      setIsLoading(false);
      return;
    }

    console.log('Loading lesson video:', lesson.videoUrl);
    setIsLoading(true);
    setIsLoaded(false);
    setCurrentTime(0);
    setTotalTime(0);
    setHasError(false);
    setIsPlaying(false);
    
    // Reset video element
    video.pause();
    video.currentTime = 0;
    
    // Use the provided videoUrl or fall back to a working sample
    const videoUrl = lesson.videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
    video.src = videoUrl;
    video.preload = 'metadata';
    video.muted = isMuted;

    const handleLoadedMetadata = () => {
      const duration = video.duration;
      console.log('Video metadata loaded, duration:', duration);
      if (!isNaN(duration) && isFinite(duration) && duration > 0) {
        setTotalTime(duration);
        setIsLoaded(true);
        setIsLoading(false);
        setHasError(false);
        console.log('Video ready to play, duration:', duration);
      } else {
        console.warn('Invalid video duration:', duration);
        setHasError(true);
        setIsLoading(false);
      }
    };

    const handleCanPlay = () => {
      console.log('Video can play');
      setIsLoaded(true);
      setIsLoading(false);
      setHasError(false);
    };

    const handleTimeUpdate = () => {
      const current = video.currentTime;
      if (isFinite(current)) {
        setCurrentTime(current);
      }
    };

    const handlePlay = () => {
      console.log('Video playing');
      setIsPlaying(true);
    };
    
    const handlePause = () => {
      console.log('Video paused');
      setIsPlaying(false);
    };

    const handleError = (e: Event) => {
      console.error('Video error occurred:', e);
      setIsLoading(false);
      setIsLoaded(false);
      setHasError(true);
      setIsPlaying(false);
    };

    const handleWaiting = () => {
      console.log('Video buffering...');
      setIsLoading(true);
    };

    const handleCanPlayThrough = () => {
      console.log('Video can play through');
      setIsLoading(false);
      setIsLoaded(true);
    };

    // Add event listeners
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('canplaythrough', handleCanPlayThrough);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('error', handleError);
    video.addEventListener('waiting', handleWaiting);

    // Load the video
    video.load();

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('canplaythrough', handleCanPlayThrough);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('error', handleError);
      video.removeEventListener('waiting', handleWaiting);
    };
  }, [isOpen, lesson?.videoUrl, isMuted]);

  // Reset states when modal closes
  useEffect(() => {
    if (!isOpen || !lesson) {
      setCurrentTime(0);
      setIsPlaying(false);
      setTotalTime(0);
      setIsLoaded(false);
      setIsLoading(false);
      setHasError(false);
    }
  }, [isOpen, lesson]);

  if (!lesson) {
    return null;
  }

  // Always use the lesson's videoUrl, with fallback to working sample video
  const videoUrl = lesson.videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
  const progressPercentage = totalTime > 0 && isFinite(currentTime) ? (currentTime / totalTime) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{lesson.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
            {isLoading && !hasError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              </div>
            )}

            {hasError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
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

            <video
              ref={videoRef}
              className="w-full h-full"
              onClick={togglePlay}
              poster="https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=450&fit=crop"
              playsInline
              controls={false}
            >
              <source src={videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            
            {!isLoading && !hasError && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={togglePlay}
                  className="bg-black/50 text-white hover:bg-black/70 w-16 h-16 rounded-full"
                  disabled={!isLoaded}
                >
                  {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
                </Button>
              </div>
            )}
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div 
              className="w-full bg-gray-200 rounded-full h-2 mb-4 cursor-pointer"
              onClick={handleSeek}
            >
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(0, Math.min(100, progressPercentage))}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSkip('back')}
                  disabled={!isLoaded || hasError}
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                
                <Button
                  onClick={togglePlay}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={!isLoaded || isLoading || hasError}
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSkip('forward')}
                  disabled={!isLoaded || hasError}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={toggleMute}
                  disabled={!isLoaded || hasError}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={toggleFullscreen}
                  disabled={!isLoaded || hasError}
                >
                  <Maximize className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="text-sm text-gray-600">
                {formatTime(currentTime)} / {formatTime(totalTime)}
              </div>
            </div>
          </div>
          
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold mb-2">About this lesson</h3>
            <p className="text-gray-600 text-sm">
              Duration: {lesson.duration}
            </p>
            <p className="text-gray-600 text-sm mt-2">
              Course: {courseTitle}
            </p>
            <p className="text-gray-600 text-sm mt-2">
              In this lesson, you'll learn the fundamentals covered in "{lesson.title}". 
              Follow along with the video and practice the concepts presented.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LessonPlayer;
